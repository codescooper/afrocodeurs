import { beforeAll, describe, expect, it } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Le PoW ne s'active que si demandé + secret présent : on simule la prod.
process.env.AUTH_SECRET = "test-secret-pour-le-pow-aaaaaaaaaaaaaaaa";
process.env.POW_ENABLED = "true";

import {
  issueChallenge,
  leadingZeroBits,
  solveChallenge,
  verifyPoW,
} from "@/lib/pow";

const SECRET = process.env.AUTH_SECRET!;
const D = 12; // difficulté basse → résolution quasi instantanée en test

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

describe("leadingZeroBits", () => {
  it("compte les bits de zéro en tête", () => {
    expect(leadingZeroBits(new Uint8Array([0xff]))).toBe(0);
    expect(leadingZeroBits(new Uint8Array([0x0f]))).toBe(4);
    expect(leadingZeroBits(new Uint8Array([0x00, 0x80]))).toBe(8);
    expect(leadingZeroBits(new Uint8Array([0x00, 0x00, 0x01]))).toBe(23);
  });
});

describe("verifyPoW", () => {
  it("accepte une preuve valide", () => {
    const { challenge } = issueChallenge(D);
    const nonce = solveChallenge(challenge);
    expect(verifyPoW(challenge, String(nonce))).toEqual({ ok: true });
  });

  it("rejette un challenge falsifié (signature invalide)", () => {
    const { challenge } = issueChallenge(D);
    const nonce = solveChallenge(challenge);
    const tampered = challenge.slice(0, -1) + (challenge.endsWith("a") ? "b" : "a");
    expect(verifyPoW(tampered, String(nonce)).ok).toBe(false);
  });

  it("rejette une preuve insuffisante (mauvais nonce)", () => {
    const { challenge } = issueChallenge(D);
    const res = verifyPoW(challenge, "0"); // nonce 0 ne résout quasi jamais d=12
    expect(res.ok).toBe(false);
  });

  it("rejette un challenge expiré", () => {
    const salt = "deadbeefdeadbeefdeadbeefdeadbeef";
    const exp = Date.now() - 1000; // déjà expiré
    const payload = `${salt}:${exp}:${D}`;
    const challenge = `${payload}:${sign(payload)}`;
    const nonce = solveChallenge(challenge);
    const res = verifyPoW(challenge, String(nonce));
    expect(res).toEqual({ ok: false, reason: "challenge expiré" });
  });

  it("rejette le rejeu d'une preuve déjà utilisée", () => {
    const { challenge } = issueChallenge(D);
    const nonce = solveChallenge(challenge);
    expect(verifyPoW(challenge, String(nonce)).ok).toBe(true); // 1ʳᵉ fois : ok
    expect(verifyPoW(challenge, String(nonce))).toEqual({
      ok: false,
      reason: "preuve déjà utilisée",
    }); // 2ᵉ fois : rejeté
  });

  it("est un no-op quand le PoW est désactivé", () => {
    const previous = process.env.POW_ENABLED;
    delete process.env.POW_ENABLED;
    try {
      expect(verifyPoW("nimporte", "quoi")).toEqual({ ok: true });
      expect(verifyPoW(null, null)).toEqual({ ok: true });
    } finally {
      process.env.POW_ENABLED = previous;
    }
  });
});

// Garantit que le SHA-256 du Web Worker (navigateur) produit le MÊME condensat
// que node:crypto — sinon une preuve calculée côté client serait rejetée côté
// serveur. On charge le vrai fichier servi au navigateur et on l'exécute.
describe("contrat client ↔ serveur (public/pow-worker.js)", () => {
  let client: {
    sha256: (b: Uint8Array) => Uint8Array;
    solve: (challenge: string, difficulty: number) => number;
  };

  beforeAll(() => {
    const src = readFileSync(
      path.join(process.cwd(), "public", "pow-worker.js"),
      "utf8",
    );
    const sandbox: { self: { __pow?: typeof client }; TextEncoder: typeof TextEncoder } = {
      self: {},
      TextEncoder,
    };
    vm.runInNewContext(src, sandbox);
    client = sandbox.self.__pow!;
  });

  it("calcule le même SHA-256 que node:crypto", () => {
    for (const input of ["", "abc", "afrocodeurs:42", "x".repeat(200)]) {
      const fromClient = Buffer.from(
        client.sha256(new TextEncoder().encode(input)),
      ).toString("hex");
      const fromNode = createHash("sha256").update(input).digest("hex");
      expect(fromClient).toBe(fromNode);
    }
  });

  it("produit une preuve que le serveur accepte", () => {
    const { challenge } = issueChallenge(D);
    const nonce = client.solve(challenge, D); // résolu par le code DU navigateur
    expect(verifyPoW(challenge, String(nonce))).toEqual({ ok: true });
  });
});
