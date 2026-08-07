import { randomBytes } from "node:crypto";

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "./db";
import { normalizeUsername } from "./utils";
import type { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Génère un username unique (3–30 caractères, `[a-z0-9_]` — cf. usernameSchema)
 * pour les comptes OAuth, qui n'en fournissent jamais. Base : nom → local-part
 * de l'email → "user". Collision-safe : suffixe aléatoire puis retry.
 */
export async function generateUniqueUsername(user: {
  name?: string | null;
  email?: string | null;
}): Promise<string> {
  let base = "user";
  for (const candidate of [user.name, user.email?.split("@")[0]]) {
    if (!candidate) continue;
    const normalized = normalizeUsername(candidate);
    if (normalized.length >= 3) {
      base = normalized;
      break;
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const username =
      attempt === 0
        ? base
        : `${base.slice(0, 25)}_${randomBytes(2).toString("hex")}`;
    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!existing) return username;
  }
  throw new Error("Impossible de générer un nom d'utilisateur unique.");
}

/**
 * Adaptateur enveloppé : Auth.js crée les comptes OAuth via `createUser({ ...
 * profile })` sans username, or `User.username` est NOT NULL sans défaut. On
 * génère donc un username ici, avant l'insertion en base.
 */
const prismaAdapter = PrismaAdapter(db);

const adapter: Adapter = {
  ...prismaAdapter,
  async createUser(user) {
    const username = await generateUniqueUsername(user);
    return prismaAdapter.createUser!({ ...user, username });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Credentials impose la stratégie JWT ; l'adapter Prisma reste utilisé
  // pour le linking des comptes OAuth (Account/User).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Auth.js v5 ne lit que AUTH_GOOGLE_ID/SECRET depuis l'env — on passe ici
    // explicitement les clés GOOGLE_CLIENT_ID/SECRET documentées par le projet
    // (cf. .env.example), sinon le provider n'aurait jamais de clientId.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    // Google et GitHub vérifient déjà l'email de leurs comptes : on considère
    // donc l'email comme vérifié dès la liaison OAuth — que ce soit un nouveau
    // compte ou le linking d'un compte existant (le callback `signIn` ne voit
    // pas l'id utilisateur au premier sign-in, `linkAccount` oui).
    // Best-effort : ne doit jamais bloquer la connexion.
    async linkAccount({ user }) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      } catch {
        /* le pont d'identité ne doit pas bloquer la connexion */
      }
    },
  },
  callbacks: {
    // À la connexion GitHub, on mémorise le login GitHub sur le profil
    // AfroMaker (pont d'identité pour la réputation des tâches de roadmap).
    // Best-effort : n'empêche jamais la connexion.
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && user?.id) {
        const login = (profile as { login?: string } | null)?.login;
        if (login) {
          try {
            await db.profile.upsert({
              where: { userId: user.id },
              create: { userId: user.id, githubLogin: login },
              update: { githubLogin: login },
            });
          } catch {
            /* le pont d'identité ne doit pas bloquer la connexion */
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "USER";
        token.username = (user as { username?: string }).username;
      }
      // À chaque résolution : vérifier que l'utilisateur existe encore et
      // rafraîchir rôle/username (un changement de rôle se propage aussitôt).
      // S'il a disparu (compte supprimé, base reseedée…), on invalide la
      // session — évite des erreurs de clé étrangère sur session.user.id.
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, role: true, emailVerified: true },
        });
        if (!dbUser) return null;
        token.username = dbUser.username;
        token.role = dbUser.role;
        token.isEmailVerified = Boolean(dbUser.emailVerified);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
      }
      return session;
    },
  },
});
