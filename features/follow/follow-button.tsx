"use client";

import { useState, useTransition } from "react";

import { toggleFollowAction } from "./actions";

export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setFollowing(await toggleFollowAction(userId));
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={
        following
          ? "rounded-md border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-50"
          : "rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
      }
    >
      {following ? "Suivi·e ✓" : "Suivre"}
    </button>
  );
}
