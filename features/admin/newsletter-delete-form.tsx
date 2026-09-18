"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteNewsletterSubscriberAction } from "./newsletter-actions";

export function NewsletterDeleteForm({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  return (
    <form
      action={deleteNewsletterSubscriberAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Désinscrire définitivement ${email} de la newsletter ?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-destructive"
      >
        <Trash2 />
        Désinscrire
      </Button>
    </form>
  );
}
