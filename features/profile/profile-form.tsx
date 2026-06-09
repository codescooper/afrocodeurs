"use client";

import { useActionState } from "react";

import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";

export type ProfileFormValues = {
  bio: string;
  country: string;
  city: string;
  languages: string;
  skills: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  portfolioUrl: string;
};

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

/** Formulaire d'édition du profil AfroMaker (Sprint 1). */
export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Field label="Bio">
        <textarea
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={defaultValues.bio}
          placeholder="Présentez-vous en quelques mots…"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pays">
          <input
            name="country"
            type="text"
            defaultValue={defaultValues.country}
            className={inputClass}
          />
        </Field>
        <Field label="Ville">
          <input
            name="city"
            type="text"
            defaultValue={defaultValues.city}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Langues (séparées par des virgules)">
        <input
          name="languages"
          type="text"
          defaultValue={defaultValues.languages}
          placeholder="Français, English, Kiswahili"
          className={inputClass}
        />
      </Field>

      <Field label="Compétences (séparées par des virgules)">
        <input
          name="skills"
          type="text"
          defaultValue={defaultValues.skills}
          placeholder="React, Python, UX Design"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GitHub">
          <input
            name="githubUrl"
            type="url"
            defaultValue={defaultValues.githubUrl}
            placeholder="https://github.com/…"
            className={inputClass}
          />
        </Field>
        <Field label="LinkedIn">
          <input
            name="linkedinUrl"
            type="url"
            defaultValue={defaultValues.linkedinUrl}
            placeholder="https://linkedin.com/in/…"
            className={inputClass}
          />
        </Field>
        <Field label="Site web">
          <input
            name="websiteUrl"
            type="url"
            defaultValue={defaultValues.websiteUrl}
            className={inputClass}
          />
        </Field>
        <Field label="Portfolio">
          <input
            name="portfolioUrl"
            type="url"
            defaultValue={defaultValues.portfolioUrl}
            className={inputClass}
          />
        </Field>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-primary">Profil mis à jour.</p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
