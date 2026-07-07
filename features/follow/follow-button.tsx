"use client";

import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFollowAction } from "./actions";

export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setFollowing(await toggleFollowAction(userId));
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        buttonVariants({
          variant: following ? "outline" : "primary",
          size: "sm",
          shape: "pill",
        }),
        "disabled:opacity-50",
      )}
    >
      {following ? "Suivi·e ✓" : "Suivre"}
    </button>
  );
}
