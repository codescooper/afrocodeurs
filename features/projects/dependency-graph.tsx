import type { DerivedStatus } from "./roadmap";
import { layoutDependencyGraph, type GraphTask } from "./graph";

const NODE_W = 172;
const NODE_H = 46;
const COL_GAP = 60;
const ROW_GAP = 18;
const PAD = 14;

const STATUS_STROKE: Record<DerivedStatus, string> = {
  DONE: "stroke-emerald-500",
  READY: "stroke-amber-400",
  CLAIMED: "stroke-sky-500",
  BLOCKED: "stroke-zinc-300",
};

const STATUS_DOT: Record<DerivedStatus, string> = {
  DONE: "fill-emerald-500",
  READY: "fill-amber-400",
  CLAIMED: "fill-sky-500",
  BLOCKED: "fill-zinc-300",
};

const STATUS_LABEL: Record<DerivedStatus, string> = {
  DONE: "Fait",
  READY: "Prête",
  CLAIMED: "En cours",
  BLOCKED: "Bloquée",
};

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Graphe du DAG des dépendances : colonnes = niveaux topologiques, flèches du
 * prérequis vers la tâche qu'il débloque. Rendu serveur (SVG statique) ; layout
 * via `layoutDependencyGraph` (fonction pure testée). Ne rend rien sans arête.
 */
export function DependencyGraph({ tasks }: { tasks: GraphTask[] }) {
  const { nodes, edges, cols, rows } = layoutDependencyGraph(tasks);
  if (edges.length === 0) return null;

  const urlById = new Map(tasks.map((t) => [t.id, t.url]));
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const colX = (c: number) => PAD + c * (NODE_W + COL_GAP);
  const rowY = (r: number) => PAD + r * (NODE_H + ROW_GAP);
  const width = PAD * 2 + cols * NODE_W + Math.max(0, cols - 1) * COL_GAP;
  const height = PAD * 2 + rows * NODE_H + Math.max(0, rows - 1) * ROW_GAP;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="Graphe des dépendances entre les tâches"
        className="max-w-none"
      >
        <defs>
          <marker
            id="dep-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" className="fill-zinc-400" />
          </marker>
        </defs>

        {/* Arêtes : prérequis → tâche */}
        {edges.map((e) => {
          const a = nodeById.get(e.fromId);
          const b = nodeById.get(e.toId);
          if (!a || !b) return null;
          const x1 = colX(a.col) + NODE_W;
          const y1 = rowY(a.row) + NODE_H / 2;
          const x2 = colX(b.col);
          const y2 = rowY(b.row) + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={`${e.fromId}-${e.toId}`}
              d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
              fill="none"
              className="stroke-zinc-400"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              markerEnd="url(#dep-arrow)"
            />
          );
        })}

        {/* Nœuds : une tâche, cliquable vers son issue GitHub */}
        {nodes.map((n) => {
          const x = colX(n.col);
          const y = rowY(n.row);
          return (
            <a
              key={n.id}
              href={urlById.get(n.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <title>{`#${n.githubNumber} ${n.title} — ${STATUS_LABEL[n.derived]}`}</title>
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill="transparent"
                strokeWidth={1.5}
                className={STATUS_STROKE[n.derived]}
              />
              <circle
                cx={x + NODE_W - 14}
                cy={y + NODE_H / 2}
                r={4}
                className={STATUS_DOT[n.derived]}
              />
              <text
                x={x + 12}
                y={y + 19}
                fill="currentColor"
                className="text-foreground text-[11px] font-bold"
              >
                #{n.githubNumber}
              </text>
              <text
                x={x + 12}
                y={y + 34}
                fill="currentColor"
                className="text-muted-foreground text-[10px]"
              >
                {truncate(n.title, 22)}
              </text>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
