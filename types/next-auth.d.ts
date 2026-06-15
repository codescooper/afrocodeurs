import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    role?: UserRole;
    isEmailVerified?: boolean;
  }
}
