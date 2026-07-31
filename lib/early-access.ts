import { createHmac, timingSafeEqual } from "node:crypto";

export const EARLY_ACCESS_SYMBOLS = ["baobab", "laptop", "sun", "logo"] as const;
export type EarlyAccessSymbol = (typeof EARLY_ACCESS_SYMBOLS)[number];

type RiddleState = {
  step: number;
  failures: number;
  windowStartedAt: number;
};

type RiddleResult = {
  status: "progress" | "reset" | "unlocked" | "locked";
  progress: number;
  token?: string;
  retryAfter?: number;
};

const ATTEMPT_WINDOW_MS = 60 * 60 * 1000;
const MAX_FAILURES = 5;

function signingSecret() {
  const secret = process.env.EARLY_ACCESS_SECRET ?? process.env.AUTH_SECRET;
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
    return Number.isInteger(state.step) && Number.isInteger(state.failures) && Number.isFinite(state.windowStartedAt)
      ? state
      : null;
  } catch {
    return null;
  }
}

export function advanceEarlyAccess(symbol: EarlyAccessSymbol, token?: string): RiddleResult {
  const now = Date.now();
  const sequence = configuredSequence();
  let state = decode(token) ?? { step: 0, failures: 0, windowStartedAt: now };

  if (now - state.windowStartedAt >= ATTEMPT_WINDOW_MS) {
    state = { step: 0, failures: 0, windowStartedAt: now };
  }

  if (state.failures >= MAX_FAILURES) {
    return {
      status: "locked",
      progress: 0,
      token: encode(state),
      retryAfter: Math.ceil((ATTEMPT_WINDOW_MS - (now - state.windowStartedAt)) / 1000),
    };
  }

  if (symbol !== sequence[state.step]) {
    const resetState = { ...state, step: 0, failures: state.failures + 1 };
    return { status: "reset", progress: 0, token: encode(resetState) };
  }

  const nextStep = state.step + 1;
  if (nextStep === sequence.length) return { status: "unlocked", progress: nextStep };
  const nextState = { ...state, step: nextStep };
  return { status: "progress", progress: nextStep, token: encode(nextState) };
}
