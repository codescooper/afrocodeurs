import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const mocks = vi.hoisted(() => ({ create: vi.fn(), readFile: vi.fn(), after: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { kitDownloadEvent: { create: mocks.create } } }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("next/server", () => ({ after: mocks.after }));
import { GET, HEAD, POST } from "@/app/api/kits/premier-agent-ia/route";
const request = (origin = "https://afrocodeurs.org") => new Request("https://afrocodeurs.org/api/kits/premier-agent-ia?source=mail", { method: "POST", headers: { origin } });
beforeEach(() => { vi.resetAllMocks(); mocks.create.mockResolvedValue({ id: "test" }); mocks.readFile.mockResolvedValue(Buffer.from("ZIP test bytes")); });
describe("tracked kit download", () => {
  it("GET previews and HEAD never create events", async () => {
    expect((await GET()).status).toBe(303);
    expect((await HEAD()).status).toBe(204);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects cross-origin submissions before reading or recording", async () => {
    expect((await POST(request("https://elsewhere.example"))).status).toBe(403);
    expect(mocks.readFile).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("serves exact bytes, records their checksum and prevents response caching", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ZIP test bytes");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toContain('filename="premier-agent-ia.zip"');
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ source: "mail", status: "SERVED", bytes: 14, version: createHash("sha256").update("ZIP test bytes").digest("hex") }) });
    expect(mocks.after).toHaveBeenCalledOnce();
  });
  it("records a missing asset as an error, never a served download", async () => {
    mocks.readFile.mockRejectedValue(new Error("not found"));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "ERROR", bytes: 0 }) });
  });
  it("does not claim a tracked success when persistence fails", async () => {
    mocks.create.mockRejectedValue(new Error("db unavailable"));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
