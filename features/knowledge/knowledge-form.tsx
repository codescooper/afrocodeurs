"use client";

import { useActionState, useState } from "react";

import { createKnowledgeAction } from "./actions";
import {
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_TYPE_LABELS,
  KNOWLEDGE_TYPES,
} from "./constants";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Éditeur Markdown — création d'une ressource avec aperçu (Sprint 4). */
export function KnowledgeForm() {
  const [state, formAction, pending] = useActionState(
    createKnowledgeAction,
    undefined,
  );
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Titre
        <input
          name="title"
          type="text"
          required
          minLength={5}
          maxLength={160}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Type
          <select name="type" defaultValue="ARTICLE" className={inputClass}>
            {KNOWLEDGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {KNOWLEDGE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Niveau
          <select name="level" defaultValue="" className={inputClass}>
            <option value="">—</option>
            {KNOWLEDGE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Langue
          <select name="language" defaultValue="fr" className={inputClass}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Résumé (optionnel)
        <input
          name="summary"
          type="text"
          maxLength={300}
          placeholder="Une phrase pour situer la ressource."
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Contenu (Markdown)</span>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="text-xs font-medium text-muted-foreground underline"
          >
            {preview ? "Éditer" : "Aperçu"}
          </button>
        </div>
        <textarea
          name="content"
          required
          minLength={50}
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Titre&#10;&#10;Rédigez en Markdown : **gras**, listes, ```code```, [liens](https://…)…"
          className={cn(inputClass, "font-mono", preview && "hidden")}
        />
        {preview && (
          <div className="min-h-[200px] rounded-md border border-border p-4">
            {content.trim() ? (
              <Markdown>{content}</Markdown>
            ) : (
              <p className="text-sm text-muted-foreground">
                Rien à prévisualiser.
              </p>
            )}
          </div>
        )}
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={pending}
        >
          Enregistrer le brouillon
        </Button>
        <Button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
        >
          Soumettre à validation
        </Button>
      </div>
    </form>
  );
}
