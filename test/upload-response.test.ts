import { afterEach, beforeEach, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { uploadResponse } from "../lib/upload-response";

let root: string;
beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), "afro-media-test-")); });
afterEach(async () => {
  if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith("afro-media-test-")) throw new Error("Unexpected fixture directory");
  await fs.rm(root, { recursive: true, force: true });
});
it("serves an image created after the first request without a server restart", async () => {
  expect((await uploadResponse(["logo.png"], false, root)).status).toBe(404);
  await fs.writeFile(path.join(root, "logo.png"), new Uint8Array([137, 80, 78, 71]));
  const response = await uploadResponse(["logo.png"], false, root);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
  const head = await uploadResponse(["logo.png"], true, root);
  expect(head.headers.get("content-length")).toBe("4");
  expect(await head.text()).toBe("");
});
it("rejects traversal, encoded paths and non-image files", async () => {
  for (const parts of [["..", "logo.png"], ["%2e%2e", "logo.png"], ["a/b.png"], ["a\\b.png"], [".env"], ["file.svg"], ["script.html"], []]) {
    const response = await uploadResponse(parts, false, root);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  }
});
it("rejects a directory symlink escaping the uploads root", async () => {
  const inside = path.join(root, "inside");
  await fs.mkdir(inside);
  await fs.writeFile(path.join(root, "outside.png"), "outside");
  await fs.symlink(root, path.join(inside, "escape"), process.platform === "win32" ? "junction" : "dir");
  try { expect((await uploadResponse(["escape", "outside.png"], false, inside)).status).toBe(404); }
  finally { await fs.unlink(path.join(inside, "escape")); }
});
