import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { advanceEarlyAccess } from "@/lib/early-access";

describe("early access riddle", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-that-never-leaves-the-test";
    process.env.EARLY_ACCESS_SEQUENCE = "sun,baobab,laptop,logo";
  });

  afterEach(() => {
    delete process.env.AUTH_SECRET;
    delete process.env.EARLY_ACCESS_SECRET;
    delete process.env.EARLY_ACCESS_SEQUENCE;
  });

  it("unlocks only after the configured sequence", () => {
    const first = advanceEarlyAccess("sun");
    const second = advanceEarlyAccess("baobab", first.token);
    const third = advanceEarlyAccess("laptop", second.token);
    const fourth = advanceEarlyAccess("logo", third.token);

    expect([first.progress, second.progress, third.progress, fourth.progress]).toEqual([1, 2, 3, 4]);
    expect(fourth.status).toBe("unlocked");
  });

  it("resets progress after a wrong symbol", () => {
    const first = advanceEarlyAccess("sun");
    const wrong = advanceEarlyAccess("logo", first.token);

    expect(wrong.status).toBe("reset");
    expect(wrong.progress).toBe(0);
  });

  it("rejects a modified progress token", () => {
    const first = advanceEarlyAccess("sun");
    const tampered = `${first.token}x`;
    const result = advanceEarlyAccess("baobab", tampered);

    expect(result.status).toBe("reset");
  });

  it("allows another try after repeated mistakes", () => {
    let token: string | undefined;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      token = advanceEarlyAccess("logo", token).token;
    }

    const retry = advanceEarlyAccess("sun", token);
    expect(retry.status).toBe("progress");
    expect(retry.progress).toBe(1);
  });

  it("falls back to AUTH_SECRET when EARLY_ACCESS_SECRET is an empty string", () => {
    process.env.EARLY_ACCESS_SECRET = "";

    const first = advanceEarlyAccess("sun");
    expect(first.status).toBe("progress");
  });
});
