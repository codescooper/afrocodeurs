import Link from "next/link";

import { Avatar } from "@/components/shared/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MembersRowMember = {
  id: string;
  role: string;
  user: { username: string; name: string | null; image: string | null };
};

/** Rangée d'avatars cliquables vers les profils, badge « +N » ouvrant la liste complète en modale. */
export function MembersRow({
  members,
  rowMax = 8,
}: {
  members: MembersRowMember[];
  rowMax?: number;
}) {
  const visible = members.slice(0, rowMax);
  const overflow = members.length - visible.length;

  const row = (
    <TooltipProvider>
      <span className="flex items-center">
        {visible.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <Link
                href={`/u/${member.user.username}`}
                className="relative -ml-3 inline-flex rounded-full ring-2 ring-background first:ml-0 hover:z-10"
              >
                <Avatar
                  image={member.user.image}
                  name={member.user.name ?? member.user.username}
                  size={40}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              {member.user.name ?? `@${member.user.username}`}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Voir les ${members.length} membres`}
              className="relative -ml-3 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background hover:z-10"
            >
              +{overflow}
            </button>
          </DialogTrigger>
        )}
      </span>
    </TooltipProvider>
  );

  if (overflow === 0) {
    return <div className="flex">{row}</div>;
  }

  return (
    <Dialog>
      {row}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Membres ({members.length})</DialogTitle>
        </DialogHeader>
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm"
            >
              <span className="flex items-center gap-3">
                <Avatar
                  image={member.user.image}
                  name={member.user.name ?? member.user.username}
                  size={32}
                />
                <Link
                  href={`/u/${member.user.username}`}
                  className="font-medium hover:underline"
                >
                  {member.user.name ?? `@${member.user.username}`}
                </Link>
              </span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
