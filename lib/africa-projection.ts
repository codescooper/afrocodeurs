import { geoMercator } from "d3-geo";

export const AFRICA_MAP_WIDTH = 720;
export const AFRICA_MAP_HEIGHT = 750;

export function createAfricaProjection() {
  return geoMercator()
    .center([17, 0])
    .scale(470)
    .translate([AFRICA_MAP_WIDTH / 2, 360]);
}
