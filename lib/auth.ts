import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "./db";
import type { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Credentials impose la stratégie JWT ; l'adapter Prisma reste utilisé
  // pour le linking des comptes OAuth (Account/User).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
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
