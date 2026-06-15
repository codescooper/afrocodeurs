import { describe, it, expect } from "vitest";

import { can, hasRank } from "@/lib/permissions";

describe("hasRank", () => {
  it("respecte la hiérarchie des rôles", () => {
    expect(hasRank("ADMIN", "USER")).toBe(true);
    expect(hasRank("USER", "ADMIN")).toBe(false);
    expect(hasRank("MODERATOR", "MODERATOR")).toBe(true);
    expect(hasRank("VISITOR", "USER")).toBe(false);
  });
});

describe("can", () => {
  it("autorise selon le rôle minimal requis", () => {
    expect(can("USER", "question:create")).toBe(true);
    expect(can("USER", "knowledge:create")).toBe(false); // CONTRIBUTOR requis
    expect(can("CONTRIBUTOR", "knowledge:create")).toBe(true);
    expect(can("MODERATOR", "report:handle")).toBe(true);
    expect(can("USER", "report:handle")).toBe(false);
    expect(can("ADMIN", "user:manage")).toBe(true);
  });

  it("traite l'absence de rôle comme VISITOR", () => {
    expect(can(null, "content:read")).toBe(true);
    expect(can(undefined, "question:create")).toBe(false);
  });
});
