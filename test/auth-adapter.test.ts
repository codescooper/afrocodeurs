import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { AfroCodeursAdapter } from "../lib/auth-adapter";
import { usernameSchema } from "../lib/validators";

const create = vi.fn();
const findFirst = vi.fn();
const adapter = AfroCodeursAdapter({ user: { create, findFirst } } as unknown as PrismaClient);
const data = { id: "untrusted-id", email: " User@Example.org ", emailVerified: new Date(), name: "Amina", image: null };
const collision = (field: string) => new Prisma.PrismaClientKnownRequestError("duplicate", {
  code: "P2002", clientVersion: "test", meta: { target: [field] },
});

beforeEach(() => vi.resetAllMocks());

describe("AfroCodeurs OAuth adapter", () => {
  it("creates the required valid username without exposing the email", async () => {
    create.mockResolvedValue({ id: "db-id" });
    await adapter.createUser!(data);
    const saved = create.mock.calls[0][0].data;
    expect(saved.email).toBe("user@example.org");
    expect(usernameSchema.safeParse(saved.username).success).toBe(true);
    expect(saved.username).not.toContain("user");
    expect(saved).not.toHaveProperty("id");
    expect(saved).not.toHaveProperty("role");
    expect(saved.emailVerified).toBeNull();
  });
  it("retries an actual username collision with another candidate", async () => {
    create.mockRejectedValueOnce(collision("username")).mockResolvedValue({ id: "db-id" });
    await adapter.createUser!(data);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].data.username).not.toBe(create.mock.calls[1][0].data.username);
  });
  it("does not merge an email collision or retry arbitrary failures", async () => {
    const error = collision("email");
    create.mockRejectedValue(error);
    await expect(adapter.createUser!(data)).rejects.toBe(error);
    expect(create).toHaveBeenCalledTimes(1);
  });
  it("bounds allocation attempts", async () => {
    create.mockRejectedValue(collision("username"));
    await expect(adapter.createUser!(data)).rejects.toMatchObject({ code: "P2002" });
    expect(create).toHaveBeenCalledTimes(3);
  });
  it("rejects missing email before any write", async () => {
    await expect(adapter.createUser!({ ...data, email: "" })).rejects.toThrow("email required");
    expect(create).not.toHaveBeenCalled();
  });
  it("finds existing mixed-case email accounts", async () => {
    await adapter.getUserByEmail!(" Amina@Example.org ");
    expect(findFirst).toHaveBeenCalledWith({ where: { email: { equals: "Amina@Example.org", mode: "insensitive" } } });
  });
});
