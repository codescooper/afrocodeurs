import type { DerivedStatus } from "./roadmap";

/** Tâche en entrée du graphe (dérivée d'une `RoadmapTaskView`). */
export type GraphTask = {
  id: string;
  githubNumber: number;
  title: string;
  url: string;
  derived: DerivedStatus;
  prerequisiteIds: string[];
};

/** Nœud positionné : `col` = niveau topologique, `row` = rang dans la colonne. */
export type GraphNode = {
  id: string;
  githubNumber: number;
  title: string;
  derived: DerivedStatus;
  col: number;
  row: number;
};

export type GraphEdge = { fromId: string; toId: string };

export type DependencyGraphLayout = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cols: number;
  rows: number;
};

/**
 * Positionne le DAG des dépendances en couches :
 * - `col` = plus long chemin depuis une racine (tâche sans prérequis) ;
 * - `row` = rang stable dans la colonne (trié par numéro d'issue).
 *
 * Fonction pure (testée). Ignore les prérequis manquants et l'auto-référence,
 * et tolère un cycle éventuel sans boucler (arête arrière ignorée pour le niveau).
 */
export function layoutDependencyGraph(
  tasks: GraphTask[],
): DependencyGraphLayout {
  const byId = new Map(tasks.map((t) => [t.id, t]));

  // Prérequis valides par tâche (présents dans le set, hors auto-référence).
  const prereqs = new Map<string, string[]>();
  for (const t of tasks) {
    prereqs.set(
      t.id,
      t.prerequisiteIds.filter((p) => p !== t.id && byId.has(p)),
    );
  }

  // Niveau = plus long chemin depuis une racine ; mémoïsé, avec garde anti-cycle.
  const level = new Map<string, number>();
  const visiting = new Set<string>();
  const levelOf = (id: string): number => {
    const cached = level.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const ps = prereqs.get(id) ?? [];
    const lvl = ps.length ? 1 + Math.max(...ps.map(levelOf)) : 0;
    visiting.delete(id);
    level.set(id, lvl);
    return lvl;
  };
  for (const t of tasks) levelOf(t.id);

  const cols = tasks.length
    ? Math.max(...tasks.map((t) => level.get(t.id) ?? 0)) + 1
    : 0;

  // Regroupe par colonne, ordonne par numéro d'issue (layout stable).
  const nodes: GraphNode[] = [];
  let rows = 0;
  for (let c = 0; c < cols; c++) {
    const column = tasks
      .filter((t) => (level.get(t.id) ?? 0) === c)
      .sort((a, b) => a.githubNumber - b.githubNumber);
    column.forEach((t, row) => {
      nodes.push({
        id: t.id,
        githubNumber: t.githubNumber,
        title: t.title,
        derived: t.derived,
        col: c,
        row,
      });
    });
    rows = Math.max(rows, column.length);
  }

  // Arêtes : prérequis -> tâche (sens « débloque »).
  const edges: GraphEdge[] = [];
  for (const t of tasks) {
    for (const p of prereqs.get(t.id) ?? []) {
      edges.push({ fromId: p, toId: t.id });
    }
  }

  return { nodes, edges, cols, rows };
}
