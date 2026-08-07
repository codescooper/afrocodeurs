import { createHmac, timingSafeEqual } from "node:crypto";

export const EARLY_ACCESS_SYMBOLS = ["baobab", "laptop", "sun", "logo"] as const;
export type EarlyAccessSymbol = (typeof EARLY_ACCESS_SYMBOLS)[number];

type RiddleState = {
  step: number;
};

type RiddleResult = {
  status: "progress" | "reset" | "unlocked";
  progress: number;
  token?: string;
};

function signingSecret() {
  // `||` (et non `??`) : EARLY_ACCESS_SECRET peut être "" dans le .env —
  // le fallback doit se déclencher aussi sur une chaîne vide.
  const secret = process.env.EARLY_ACCESS_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("EARLY_ACCESS_SECRET ou AUTH_SECRET est requis");
  return secret;
}

function configuredSequence(): EarlyAccessSymbol[] {
  const raw = process.env.EARLY_ACCESS_SEQUENCE;
  if (!raw) throw new Error("EARLY_ACCESS_SEQUENCE est requis");
  const sequence = raw.split(",").map((value) => value.trim()) as EarlyAccessSymbol[];
  if (sequence.length < 4 || sequence.some((symbol) => !EARLY_ACCESS_SYMBOLS.includes(symbol))) {
    throw new Error("EARLY_ACCESS_SEQUENCE doit contenir au moins quatre symboles valides");
  }
  return sequence;
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function encode(state: RiddleState) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function decode(token: string | undefined): RiddleState | null {
  if (!token) return null;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return null;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as RiddleState;
    return Number.isInteger(state.step) ? { step: state.step } : null;
  } catch {
    return null;
  }
}

export function advanceEarlyAccess(symbol: EarlyAccessSymbol, token?: string): RiddleResult {
  const sequence = configuredSequence();
  const state = decode(token) ?? { step: 0 };

  if (symbol !== sequence[state.step]) {
    return { status: "reset", progress: 0, token: encode({ step: 0 }) };
  }

  const nextStep = state.step + 1;
  if (nextStep === sequence.length) return { status: "unlocked", progress: nextStep };
  const nextState = { ...state, step: nextStep };
  return { status: "progress", progress: nextStep, token: encode(nextState) };
}
