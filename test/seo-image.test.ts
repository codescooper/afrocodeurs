import { expect, it } from "vitest";
import Image from "../app/opengraph-image";

it("renders a valid 1200 by 630 PNG for link previews", async () => {
  const response = Image();
  expect(response.headers.get("content-type")).toContain("image/png");
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  expect(view.getUint32(16)).toBe(1200);
  expect(view.getUint32(20)).toBe(630);
  expect(bytes.length).toBeGreaterThan(1000);
}, 30000);
