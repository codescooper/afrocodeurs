import { forceSimulation, forceCollide, forceX, forceY, type SimulationNodeDatum } from "d3-force";
type Node = SimulationNodeDatum & { id: string };
export function constellationHeight(count: number, width: number) {
  return Math.max(640, Math.ceil(count / Math.max(1, Math.floor(width / 120))) * 132);
}
export function constellationLayout(ids: string[], width: number, height: number) {
  const marginX = 48, marginY = 58;
  const nodes: Node[] = ids.map((id, index) => ({ id, x: marginX + ((index * 137.508) % 100) / 100 * (width - 2 * marginX), y: marginY + (index + 0.5) / ids.length * (height - 2 * marginY) }));
  const simulation = forceSimulation(nodes).force("x", forceX(width / 2).strength(0.045)).force("y", forceY(height / 2).strength(0.045)).force("collide", forceCollide(53).iterations(5)).stop();
  simulation.tick(220);
  simulation.stop();
  const positions = nodes.map((node) => ({ id: node.id, x: Math.max(marginX, Math.min(width - marginX, node.x ?? width / 2)), y: Math.max(marginY, Math.min(height - marginY, node.y ?? height / 2)) }));
  const overlaps = positions.some((a, index) => positions.slice(index + 1).some((b) => Math.abs(a.x - b.x) < 110 && Math.abs(a.y - b.y) < 120));
  if (!overlaps) return positions;
  // Dense screens use collision-free cells, including room for two-line labels.
  const columns = Math.max(1, Math.min(Math.floor(width / 120), Math.ceil(Math.sqrt(ids.length * width / height))));
  const rows = Math.ceil(ids.length / columns);
  const jitterX = Math.min(12, Math.max(0, (width / columns - 112) / 2));
  const jitterY = Math.min(22, Math.max(0, (height / rows - 124) / 2));
  return ids.map((id, index) => ({ id,
    x: (index % columns + 0.5) * width / columns + Math.sin(index * 2.4) * jitterX,
    y: (Math.floor(index / columns) + 0.5) * height / rows + Math.cos(index * 1.7) * jitterY,
  }));
}
