import { describe, it, expect } from "vitest";

import { layoutDependencyGraph, type GraphTask } from "@/features/projects/graph";

const t = (id: string, num: number, prerequisiteIds: string[] = []): GraphTask => ({
  id,
  githubNumber: num,
  title: `T${num}`,
  url: `https://github.com/x/y/issues/${num}`,
  derived: "READY",
  prerequisiteIds,
});

const colOf = (g: ReturnType<typeof layoutDependencyGraph>, id: string) =>
  g.nodes.find((n) => n.id === id)?.col;

describe("layoutDependencyGraph", () => {
  it("renvoie un graphe vide sans tâche", () => {
    expect(layoutDependencyGraph([])).toEqual({
      nodes: [],
      edges: [],
      cols: 0,
      rows: 0,
    });
  });

  it("place une chaîne linéaire en colonnes successives", () => {
    // C dépend de B, B dépend de A
    const g = layoutDependencyGraph([t("A", 1), t("B", 2, ["A"]), t("C", 3, ["B"])]);
    expect(g.cols).toBe(3);
    expect(g.rows).toBe(1);
    expect(colOf(g, "A")).toBe(0);
    expect(colOf(g, "B")).toBe(1);
    expect(colOf(g, "C")).toBe(2);
    expect(g.edges).toContainEqual({ fromId: "A", toId: "B" });
    expect(g.edges).toContainEqual({ fromId: "B", toId: "C" });
  });

  it("calcule les niveaux par plus long chemin (diamant)", () => {
    // B et C dépendent de A ; D dépend de B et C
    const g = layoutDependencyGraph([
      t("A", 1),
      t("B", 2, ["A"]),
      t("C", 3, ["A"]),
      t("D", 4, ["B", "C"]),
    ]);
    expect(colOf(g, "A")).toBe(0);
    expect(colOf(g, "B")).toBe(1);
    expect(colOf(g, "C")).toBe(1);
    expect(colOf(g, "D")).toBe(2);
    expect(g.rows).toBe(2); // B et C partagent la colonne 1
    expect(g.edges).toHaveLength(4);
  });

  it("ignore l'auto-référence et les prérequis absents", () => {
    const g = layoutDependencyGraph([t("A", 1, ["A", "MANQUANT"]), t("B", 2, ["A"])]);
    expect(colOf(g, "A")).toBe(0);
    expect(g.edges).toEqual([{ fromId: "A", toId: "B" }]);
  });

  it("ne boucle pas en présence d'un cycle", () => {
    const g = layoutDependencyGraph([t("A", 1, ["B"]), t("B", 2, ["A"])]);
    expect(g.nodes).toHaveLength(2);
    expect(g.edges).toHaveLength(2);
  });
});
