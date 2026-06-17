import type { UserRole } from "@prisma/client";

/**
 * RBAC AfroCodeurs (cf. SDD §7).
 * Hiérarchie : VISITOR < USER < CONTRIBUTOR < MODERATOR < ADMIN.
 * VISITOR n'est pas un rôle stocké : c'est l'absence de session.
 */
export type Role = "VISITOR" | UserRole;

const RANK: Record<Role, number> = {
  VISITOR: 0,
  USER: 1,
  CONTRIBUTOR: 2,
  MODERATOR: 3,
  ADMIN: 4,
};

export const PERMISSIONS = {
  // Visitor
  "content:read": "VISITOR",
  "content:search": "VISITOR",
  "profile:view": "VISITOR",
  // User
  "content:comment": "USER",
  "content:vote": "USER",
  "question:create": "USER",
  "answer:create": "USER",
  "community:join": "USER",
  "community:create": "USER",
  "problem:propose": "USER",
  "solution:propose": "USER",
  "relation:create": "USER",
  // Contributor
  "knowledge:create": "CONTRIBUTOR",
  "knowledge:submit": "CONTRIBUTOR",
  "knowledge:editOwn": "CONTRIBUTOR",
  "project:create": "CONTRIBUTOR",
  "roadmap:edit": "CONTRIBUTOR",
  // Moderator
  "content:validate": "MODERATOR",
  "forum:moderate": "MODERATOR",
  "report:handle": "MODERATOR",
  // Admin
  "user:manage": "ADMIN",
  "content:manage": "ADMIN",
  "community:manage": "ADMIN",
  "system:manage": "ADMIN",
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof PERMISSIONS;

/** Le rôle `role` satisfait-il le rang minimal `required` ? */
export function hasRank(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}

/** Le rôle `role` dispose-t-il de la permission `permission` ? */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  return hasRank(role ?? "VISITOR", PERMISSIONS[permission]);
}

/** Message renvoyé quand un compte non vérifié tente de publier. */
export const VERIFY_EMAIL_MESSAGE =
  "Confirme ton adresse email pour publier — un bandeau sur ton tableau de bord permet de renvoyer l'email.";
