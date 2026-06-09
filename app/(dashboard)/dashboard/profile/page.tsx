import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/features/profile/profile-form";

export const metadata = { title: "Mon profil" };

/** Page profil AfroMaker (Sprint 1) : affichage + édition. */
export default async function ProfilePage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    include: { profile: true },
  });

  const p = user?.profile;
  const defaultValues = {
    bio: p?.bio ?? "",
    country: p?.country ?? "",
    city: p?.city ?? "",
    languages: p?.languages.join(", ") ?? "",
    skills: p?.skills.join(", ") ?? "",
    githubUrl: p?.githubUrl ?? "",
    linkedinUrl: p?.linkedinUrl ?? "",
    websiteUrl: p?.websiteUrl ?? "",
    portfolioUrl: p?.portfolioUrl ?? "",
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          @{user?.username} · Renseignez votre profil public AfroMaker.
        </p>
      </header>

      <ProfileForm defaultValues={defaultValues} />
    </div>
  );
}
