import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

import { extForType, saveImage } from "@/lib/storage";

const created: string[] = [];

afterEach(async () => {
  for (const p of created.splice(0)) {
    await fs.rm(p, { force: true });
  }
});

describe("extForType", () => {
  it("mappe les types image supportés", () => {
    expect(extForType("image/png")).toBe("png");
    expect(extForType("image/jpeg")).toBe("jpg");
    expect(extForType("image/webp")).toBe("webp");
    expect(extForType("image/gif")).toBe("gif");
  });

  it("rejette les types non supportés", () => {
    expect(extForType("application/pdf")).toBeNull();
    expect(extForType("text/plain")).toBeNull();
  });
});

describe("saveImage (repli local)", () => {
  it("écrit le fichier et renvoie une URL publique absolue", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // entête PNG
    const url = await saveImage(bytes, "image/png");

    expect(url).toMatch(
      /^https?:\/\/.+\/uploads\/\d{4}\/\d{2}\/[0-9a-f-]+\.png$/,
    );

    const key = new URL(url).pathname.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", key);
    created.push(filePath);

    const data = await fs.readFile(filePath);
    expect(data).toEqual(Buffer.from(bytes));
  });

  it("refuse un type non supporté", async () => {
    await expect(saveImage(new Uint8Array([1]), "application/pdf")).rejects.toThrow();
  });
});
