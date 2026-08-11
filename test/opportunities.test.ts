import { describe, expect, it } from "vitest";
import { opportunityResponseSchema, opportunitySchema } from "@/features/opportunities/validators";

const validOpportunity = {
  title: "Développeur Next.js à Abidjan",
  organization: "AfroCodeurs",
  type: "JOB",
  summary: "Une mission utile pour construire des produits numériques locaux.",
  description: "Nous recherchons une personne autonome pour contribuer au produit, documenter son travail et collaborer avec la communauté.",
  isRemote: true,
  externalUrl: "",
  deadline: "2026-09-30",
};

describe("opportunity validators", () => {
  it("accepte une opportunité complète", () => {
    expect(opportunitySchema.safeParse(validOpportunity).success).toBe(true);
  });

  it("rejette une description trop courte et un mauvais lien", () => {
    expect(opportunitySchema.safeParse({ ...validOpportunity, description: "Trop court", externalUrl: "pas-un-lien" }).success).toBe(false);
  });

  it("accepte un intérêt sans message mais exige un message pour candidater", () => {
    expect(opportunityResponseSchema.safeParse({ opportunityId: "opp-1", kind: "INTEREST" }).success).toBe(true);
    expect(opportunityResponseSchema.safeParse({ opportunityId: "opp-1", kind: "APPLICATION", message: "Court" }).success).toBe(false);
    expect(opportunityResponseSchema.safeParse({ opportunityId: "opp-1", kind: "APPLICATION", message: "Je souhaite contribuer avec mon expérience de développeur." }).success).toBe(true);
  });
});
