import "server-only";

import type {
  DevelopmentGoalStatus,
  EntityType,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { notify } from "@/features/notifications/notify";
import { notifyPublishedUpdate } from "@/features/updates/publish";
import { analyzeFeedback } from "./analyze";
import {
  feedbackAttribution,
  feedbackStatusForGoal,
  problemStatusForGoal,
  questionStatusForGoal,
  releaseSummary,
  releaseVersion,
} from "./workflow";

type SourceType = Extract<EntityType, "QUESTION" | "PROBLEM" | "KNOWLEDGE">;
type FeedbackSource = {
  sourceType: EntityType | null;
  sourceId: string | null;
};

type PromoteInput = {
  sourceType: SourceType;
  sourceId: string;
  title: string;
  description: string;
  sourceUrl: string | null;
  actorId: string;
};

async function sourceAuthorId(
  tx: Prisma.TransactionClient,
  sourceType: SourceType,
  sourceId: string,
): Promise<string | null> {
  if (sourceType === "QUESTION") {
    return (
      await tx.question.findUnique({
        where: { id: sourceId },
        select: { authorId: true },
      })
    )?.authorId ?? null;
  }
  if (sourceType === "PROBLEM") {
    return (
      await tx.problem.findUnique({
        where: { id: sourceId },
        select: { createdById: true },
      })
    )?.createdById ?? null;
  }
  return (
    await tx.knowledge.findUnique({
      where: { id: sourceId },
      select: { authorId: true },
    })
  )?.authorId ?? null;
}

async function syncSourceForGoal(
  tx: Prisma.TransactionClient,
  feedback: FeedbackSource,
  status: DevelopmentGoalStatus,
): Promise<void> {
  if (!feedback.sourceId) return;
  if (feedback.sourceType === "PROBLEM") {
    await tx.problem.updateMany({
      where: { id: feedback.sourceId },
      data: { status: problemStatusForGoal(status) },
    });
  }
  if (feedback.sourceType === "QUESTION") {
    await tx.question.updateMany({
      where: { id: feedback.sourceId },
      data: { status: questionStatusForGoal(status) },
    });
  }
}

async function closeRejectedSource(
  tx: Prisma.TransactionClient,
  feedback: FeedbackSource,
): Promise<void> {
  if (!feedback.sourceId) return;
  if (feedback.sourceType === "PROBLEM") {
    await tx.problem.updateMany({
      where: { id: feedback.sourceId },
      data: { status: "ARCHIVED" },
    });
  }
  if (feedback.sourceType === "QUESTION") {
    await tx.question.updateMany({
      where: { id: feedback.sourceId },
      data: { status: "CLOSED" },
    });
  }
}

export async function promoteSourceFeedback(input: PromoteInput): Promise<void> {
  const id = `${input.sourceType.toLowerCase()}-${input.sourceId}`;
  await db.$transaction(async (tx) => {
    const [existing, originalAuthorId] = await Promise.all([
      tx.productFeedback.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          authorId: true,
          sourceType: true,
          sourceId: true,
        },
      }),
      sourceAuthorId(tx, input.sourceType, input.sourceId),
    ]);
    const analysis = analyzeFeedback(input.title, input.description);
    const feedback = await tx.productFeedback.upsert({
      where: { id },
      create: {
        id,
        title: input.title,
        description: input.description,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceUrl: input.sourceUrl,
        authorId: originalAuthorId,
        ...analysis,
      },
      update: {
        title: input.title,
        description: input.description,
        sourceUrl: input.sourceUrl,
        authorId: originalAuthorId ?? existing?.authorId ?? null,
        ...analysis,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: existing ? "UPDATE" : "CREATE",
        entityType: "PRODUCT_FEEDBACK",
        entityId: feedback.id,
        before: existing ?? undefined,
        after: {
          title: feedback.title,
          status: feedback.status,
          authorId: feedback.authorId,
          sourceType: feedback.sourceType,
          sourceId: feedback.sourceId,
        },
      },
    });
  });
}

export async function triageFeedback(
  id: string,
  decision: "review" | "reject" | "convert",
  actorId: string,
): Promise<void> {
  const result = await db.$transaction(async (tx) => {
    const feedback = await tx.productFeedback.findUnique({ where: { id } });
    if (!feedback) return null;

    if (decision === "review") {
      await tx.productFeedback.update({
        where: { id },
        data: { status: "REVIEWING" },
      });
    } else if (decision === "reject") {
      await tx.productFeedback.update({
        where: { id },
        data: { status: "REJECTED", developmentGoalId: null },
      });
      await closeRejectedSource(tx, feedback);
    } else {
      if (feedback.developmentGoalId) return null;
      const goal = await tx.developmentGoal.create({
        data: {
          title: feedback.title,
          summary: feedback.description,
          priority: feedback.priorityScore,
          createdById: actorId,
        },
      });
      await tx.productFeedback.update({
        where: { id },
        data: { status: "CONVERTED", developmentGoalId: goal.id },
      });
      await syncSourceForGoal(tx, feedback, "PLANNED");
      await tx.auditLog.create({
        data: {
          actorId,
          action: "CREATE",
          entityType: "DEVELOPMENT_GOAL",
          entityId: goal.id,
          after: {
            title: goal.title,
            status: goal.status,
            feedbackIds: [feedback.id],
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "PRODUCT_FEEDBACK",
        entityId: feedback.id,
        before: { status: feedback.status, developmentGoalId: feedback.developmentGoalId },
        after: { decision },
      },
    });
    return {
      authorId: feedback.authorId,
      title: feedback.title,
      link: feedback.sourceUrl ?? "/updates#roadmap",
    };
  });

  if (!result) return;
  const copy = decision === "review"
    ? {
        title: "Ta proposition est en cours d’analyse",
        body: `L’équipe étudie maintenant « ${result.title} ».`,
      }
    : decision === "reject"
      ? {
          title: "Décision concernant ta proposition",
          body: `« ${result.title} » ne sera pas retenue dans sa forme actuelle.`,
        }
      : {
          title: "Ta proposition rejoint la feuille de route 🎯",
          body: `« ${result.title} » est maintenant un objectif public d’AfroCodeurs.`,
        };
  await notify({
    userId: result.authorId,
    actorId,
    type: "FEEDBACK_STATUS",
    title: copy.title,
    body: copy.body,
    link: result.link,
  });
}

export async function linkFeedbackToGoal(
  feedbackId: string,
  goalId: string,
  actorId: string,
): Promise<void> {
  const result = await db.$transaction(async (tx) => {
    const [feedback, goal] = await Promise.all([
      tx.productFeedback.findUnique({ where: { id: feedbackId } }),
      tx.developmentGoal.findUnique({
        where: { id: goalId },
        include: { platformUpdate: { select: { id: true, requestedBy: true } } },
      }),
    ]);
    if (!feedback || !goal) return null;
    const status = feedbackStatusForGoal(goal.status);
    await tx.productFeedback.update({
      where: { id: feedbackId },
      data: { developmentGoalId: goalId, status },
    });
    const priorities = await tx.productFeedback.aggregate({
      where: { developmentGoalId: goalId },
      _max: { priorityScore: true },
    });
    await tx.developmentGoal.update({
      where: { id: goalId },
      data: { priority: priorities._max.priorityScore ?? goal.priority },
    });
    if (goal.platformUpdate) {
      const creditedFeedback = await tx.productFeedback.findMany({
        where: { developmentGoalId: goalId },
        include: { author: { select: { username: true, name: true } } },
        orderBy: { createdAt: "asc" },
      });
      const requestedBy = feedbackAttribution(creditedFeedback);
      await tx.platformUpdate.update({
        where: { id: goal.platformUpdate.id },
        data: { requestedBy },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "UPDATE",
          entityType: "PLATFORM_UPDATE",
          entityId: goal.platformUpdate.id,
          before: { requestedBy: goal.platformUpdate.requestedBy },
          after: { requestedBy },
          metadata: { creditedFeedbackId: feedback.id },
        },
      });
    }
    await syncSourceForGoal(tx, feedback, goal.status);
    await tx.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "PRODUCT_FEEDBACK",
        entityId: feedback.id,
        before: {
          status: feedback.status,
          developmentGoalId: feedback.developmentGoalId,
        },
        after: { status, developmentGoalId: goal.id },
        metadata: { mergedIntoGoal: goal.title },
      },
    });
    return {
      authorId: feedback.authorId,
      feedbackTitle: feedback.title,
      goalTitle: goal.title,
      link: feedback.sourceUrl ?? "/updates#roadmap",
    };
  });

  if (!result) return;
  await notify({
    userId: result.authorId,
    actorId,
    type: "FEEDBACK_STATUS",
    title: "Ta proposition rejoint un objectif existant",
    body: `« ${result.feedbackTitle} » est maintenant rattachée à « ${result.goalTitle} ». Ton crédit est conservé.`,
    link: result.link,
  });
}

function goalNotification(status: DevelopmentGoalStatus, title: string) {
  if (status === "PLANNED") {
    return {
      title: "Objectif planifié",
      body: `« ${title} » est maintenant planifié dans la feuille de route.`,
    };
  }
  if (status === "IN_PROGRESS") {
    return {
      title: "Développement commencé 🚧",
      body: `L’équipe travaille maintenant sur « ${title} ».`,
    };
  }
  if (status === "SHIPPED") {
    return {
      title: "Ta proposition est en ligne 🎉",
      body: `« ${title} » vient d’être livrée sur AfroCodeurs.`,
    };
  }
  return {
    title: "Objectif arrêté",
    body: `Le développement de « ${title} » a été arrêté.`,
  };
}

export async function updateGoalStatus(
  id: string,
  status: DevelopmentGoalStatus,
  actorId: string,
): Promise<void> {
  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    const goal = await tx.developmentGoal.findUnique({
      where: { id },
      include: {
        feedback: {
          include: {
            author: { select: { username: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        platformUpdate: true,
      },
    });
    if (!goal || goal.status === status) return null;

    const feedbackStatus = feedbackStatusForGoal(status);
    await tx.developmentGoal.update({ where: { id }, data: { status } });
    await tx.productFeedback.updateMany({
      where: { developmentGoalId: id },
      data: { status: feedbackStatus },
    });
    for (const feedback of goal.feedback) {
      await syncSourceForGoal(tx, feedback, status);
    }

    let publishedUpdate = goal.platformUpdate;
    let shouldAnnounce = false;
    if (status === "SHIPPED") {
      const requestedBy = feedbackAttribution(goal.feedback);
      const sourceUrl = goal.feedback.find((item) => item.sourceUrl)?.sourceUrl ?? null;
      const data = {
        version: releaseVersion(now),
        title: goal.title,
        summary: releaseSummary(goal.summary),
        content: `## Livré grâce à la communauté\n\n${goal.summary}`,
        category: "DEMANDE COMMUNAUTAIRE",
        requestedBy,
        sourceUrl,
        published: true,
        publishedAt: goal.platformUpdate?.publishedAt ?? now,
      };
      if (goal.platformUpdate) {
        shouldAnnounce = !goal.platformUpdate.published;
        publishedUpdate = await tx.platformUpdate.update({
          where: { id: goal.platformUpdate.id },
          data,
        });
      } else {
        shouldAnnounce = true;
        publishedUpdate = await tx.platformUpdate.create({
          data: { ...data, developmentGoalId: goal.id },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId,
          action: goal.platformUpdate ? "UPDATE" : "CREATE",
          entityType: "PLATFORM_UPDATE",
          entityId: publishedUpdate.id,
          before: goal.platformUpdate
            ? { published: goal.platformUpdate.published }
            : undefined,
          after: { published: true, developmentGoalId: goal.id },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "DEVELOPMENT_GOAL",
        entityId: goal.id,
        before: { status: goal.status },
        after: { status },
        metadata: { feedbackIds: goal.feedback.map((item) => item.id) },
      },
    });

    return { goal, publishedUpdate, shouldAnnounce };
  });

  if (!result) return;
  const authorIds = [
    ...new Set(
      result.goal.feedback
        .map((feedback) => feedback.authorId)
        .filter((authorId): authorId is string => Boolean(authorId)),
    ),
  ];
  const copy = goalNotification(status, result.goal.title);
  await Promise.all(
    authorIds.map((userId) =>
      notify({
        userId,
        actorId,
        type: "FEEDBACK_STATUS",
        title: copy.title,
        body: copy.body,
        link: status === "SHIPPED" ? "/updates" : "/updates#roadmap",
      }),
    ),
  );
  if (result.shouldAnnounce && result.publishedUpdate) {
    await notifyPublishedUpdate(result.publishedUpdate, actorId, authorIds);
  }
}
