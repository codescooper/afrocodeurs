import { describe, it, expect } from "vitest";

import { deriveTaskStatus, isIndependent } from "@/features/projects/roadmap";

describe("deriveTaskStatus", () => {
  it("DONE dès que la tâche est fermée, quels que soient les prérequis", () => {
    expect(
      deriveTaskStatus({ state: "CLOSED", assignees: [] }, ["OPEN"]),
    ).toBe("DONE");
    expect(
      deriveTaskStatus({ state: "CLOSED", assignees: ["alice"] }, []),
    ).toBe("DONE");
  });

  it("BLOCKED si au moins un prérequis n'est pas terminé", () => {
    expect(
      deriveTaskStatus({ state: "OPEN", assignees: [] }, ["OPEN"]),
    ).toBe("BLOCKED");
    expect(
      deriveTaskStatus({ state: "OPEN", assignees: ["bob"] }, ["CLOSED", "OPEN"]),
    ).toBe("BLOCKED");
  });

  it("CLAIMED si prête (prérequis terminés) et déjà assignée", () => {
    expect(
      deriveTaskStatus({ state: "OPEN", assignees: ["bob"] }, ["CLOSED"]),
    ).toBe("CLAIMED");
    expect(
      deriveTaskStatus({ state: "OPEN", assignees: ["bob"] }, []),
    ).toBe("CLAIMED");
  });

  it("READY si prête et sans assignee", () => {
    expect(deriveTaskStatus({ state: "OPEN", assignees: [] }, [])).toBe("READY");
    expect(
      deriveTaskStatus({ state: "OPEN", assignees: [] }, ["CLOSED", "CLOSED"]),
    ).toBe("READY");
  });
});

describe("isIndependent", () => {
  it("vrai uniquement sans aucun lien de dépendance", () => {
    expect(isIndependent(0, 0)).toBe(true);
    expect(isIndependent(1, 0)).toBe(false);
    expect(isIndependent(0, 2)).toBe(false);
  });
});
