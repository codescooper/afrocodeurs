"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createKnowledgeAction } from "./actions";
import {
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_TYPE_LABELS,
  KNOWLEDGE_TYPES,
} from "./constants";
import { Markdown } from "@/components/shared/markdown";
import { ImageUploadButton } from "@/features/media/image-upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire communautaire pour partager une ressource avec aperçu Markdown. */
export function KnowledgeForm({ community, defaultType = "ARTICLE" }: { community?: { id: string; name: string } | null; defaultType?: (typeof KNOWLEDGE_TYPES)[number] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createKnowledgeAction,
    undefined,
  );
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.createdSlug) router.push(`/knowledge/${state.createdSlug}`);
  }, [router, state?.createdSlug]);

  /** Insère le Markdown d'une image uploadée à la position du curseur. */
  function insertImage(url: string, name: string) {
    const snippet = `![${name}](${url})\n`;
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + snippet);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    setContent(content.slice(0, start) + snippet + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {community && <><input type="hidden" name="communityId" value={community.id} /><p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">Publié depuis la communauté <strong>{community.name}</strong>. La ressource restera visible dans le Knowledge Hub général.</p></>}
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
          <select name="type" defaultValue={defaultType} className={inputClass}>
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

      <fieldset className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">Accès à la ressource</legend>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Lien externe (optionnel)
          <input
            name="externalUrl"
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
          <span className="text-xs font-normal text-muted-foreground">
            Pour un cours, une vidéo, un outil ou un article hébergé ailleurs.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Auteur, organisme ou plateforme (optionnel)
          <input
            name="provider"
            type="text"
            maxLength={120}
            placeholder="Ex. OpenClassrooms"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Durée estimée en minutes (optionnel)
          <input
            name="durationMinutes"
            type="number"
            min={1}
            max={100000}
            placeholder="Ex. 45"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tarif
          <select name="isFree" defaultValue="true" className={inputClass}>
            <option value="true">Gratuit</option>
            <option value="false">Payant</option>
          </select>
        </label>
      </fieldset>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Présentation ou astuce (Markdown)</span>
          <span className="flex items-center gap-4">
            <ImageUploadButton
              onUploaded={insertImage}
              label="Insérer une image"
            />
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="text-xs font-medium text-muted-foreground underline"
            >
              {preview ? "Éditer" : "Aperçu"}
            </button>
          </span>
        </div>
        <textarea
          ref={textareaRef}
          name="content"
          required
          minLength={20}
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Expliquez ce que la ressource apporte, à qui elle s'adresse et comment bien l'utiliser."
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
        <Button type="submit" name="intent" value="submit" disabled={pending}>
          Soumettre à validation
        </Button>
      </div>
    </form>
  );
}
