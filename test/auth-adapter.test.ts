import { describe, expect, it, vi } from "vitest";

import { isUsernameConflict, withUsernameRetry } from "@/lib/utils";

type TestUser = { id: string; email: string; username?: string | null };

const p2002 = (target: string | string[]) => ({
  code: "P2002",
  meta: { target },
});

describe("isUsernameConflict", () => {
  it("reconnaît un P2002 ciblant username (cible tableau)", () => {
    expect(isUsernameConflict(p2002(["username"]))).toBe(true);
  });

  it("reconnaît un P2002 ciblant username (cible simple)", () => {
    expect(isUsernameConflict(p2002("username"))).toBe(true);
  });

  it("ignore un P2002 ciblant un autre champ", () => {
    expect(isUsernameConflict(p2002(["email"]))).toBe(false);
    expect(isUsernameConflict(p2002("email"))).toBe(false);
  });

  it("ignore les erreurs hors P2002 et les valeurs invalides", () => {
    expect(isUsernameConflict({ code: "P2011", meta: { target: ["username"] } })).toBe(false);
    expect(isUsernameConflict(new Error("boom"))).toBe(false);
    expect(isUsernameConflict(null)).toBe(false);
    expect(isUsernameConflict("P2002")).toBe(false);
    expect(isUsernameConflict({})).toBe(false);
  });
});

describe("withUsernameRetry", () => {
  it("conserve un username déjà fourni à la première tentative", async () => {
    const createUser = vi.fn(async (user: TestUser) => user);
    const generate = vi.fn(async () => "generated");

    const wrapped = withUsernameRetry<TestUser>(createUser, generate);
    const result = await wrapped({ id: "u1", email: "a@b.c", username: "kebe" });

    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith({ id: "u1", email: "a@b.c", username: "kebe" });
    expect(generate).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "u1", email: "a@b.c", username: "kebe" });
  });

  it("génère un username pour un compte sans username (OAuth)", async () => {
    const createUser = vi.fn(async (user: TestUser) => user);
    const generate = vi.fn(async () => "generated");

    const wrapped = withUsernameRetry<TestUser>(createUser, generate);
    const result = await wrapped({ id: "u1", email: "a@b.c" });

    expect(generate).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith({ id: "u1", email: "a@b.c", username: "generated" });
    expect(result).toEqual({ id: "u1", email: "a@b.c", username: "generated" });
  });

  it("retente avec un nouveau username après un conflit P2002", async () => {
    const createUser = vi.fn(async (user: TestUser) => user);
    // Premier appel : échoue sur la contrainte unique username.
    createUser.mockRejectedValueOnce(p2002(["username"]));

    const generate = vi
      .fn()
      .mockResolvedValueOnce("kebe")
      .mockResolvedValueOnce("kebe_a1b2");

    const wrapped = withUsernameRetry<TestUser>(createUser, generate);
    const result = await wrapped({ id: "u1", email: "a@b.c" });

    expect(createUser).toHaveBeenCalledTimes(2);
    expect(createUser.mock.calls[0]![0]).toEqual({ id: "u1", email: "a@b.c", username: "kebe" });
    expect(createUser.mock.calls[1]![0]).toEqual({ id: "u1", email: "a@b.c", username: "kebe_a1b2" });
    expect(result).toEqual({ id: "u1", email: "a@b.c", username: "kebe_a1b2" });
  });

  it("relance immédiatement un P2002 ciblant un autre champ", async () => {
    const conflict = p2002(["email"]);
    const createUser = vi.fn(async () => {
      throw conflict;
    });

    const wrapped = withUsernameRetry<TestUser>(createUser, vi.fn(async () => "kebe"));
    await expect(wrapped({ id: "u1", email: "a@b.c" })).rejects.toBe(conflict);
    expect(createUser).toHaveBeenCalledTimes(1);
  });

  it("relance immédiatement une erreur non-P2002", async () => {
    const boom = new Error("db down");
    const createUser = vi.fn(async () => {
      throw boom;
    });

    const wrapped = withUsernameRetry<TestUser>(createUser, vi.fn(async () => "kebe"));
    await expect(wrapped({ id: "u1", email: "a@b.c" })).rejects.toBe(boom);
    expect(createUser).toHaveBeenCalledTimes(1);
  });

  it("relance la dernière erreur après épuisement des tentatives", async () => {
    const conflict = p2002(["username"]);
    const createUser = vi.fn(async () => {
      throw conflict;
    });

    const wrapped = withUsernameRetry<TestUser>(createUser, vi.fn(async () => "kebe"));
    await expect(wrapped({ id: "u1", email: "a@b.c" })).rejects.toBe(conflict);
    expect(createUser).toHaveBeenCalledTimes(5);
  });
});
