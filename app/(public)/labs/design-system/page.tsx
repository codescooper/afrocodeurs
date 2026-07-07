import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** Aperçu des primitifs shadcn/ui posés sur la charte AfroCodeurs (or/noir/vert). */
export default function DesignSystemLabPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-8">
      <div>
        <p className="text-sm font-medium text-accent">Labs · Design system</p>
        <h1 className="text-2xl font-bold">Primitifs UI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Composants shadcn/ui posés sur les tokens existants (
          <code>--primary</code>, <code>--accent</code>, <code>--card</code>…).
          Rien ici n&apos;est branché à une page réelle — c&apos;est un aperçu.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Validé</Badge>
          <Badge variant="secondary">Agriculture</Badge>
          <Badge variant="outline">Brouillon</Badge>
          <Badge variant="destructive">Signalé</Badge>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Boutons — pilule vs formulaire
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button shape="pill">Rejoindre</Button>
          <Button variant="outline" shape="pill">
            Suivre
          </Button>
          <Button variant="primary">Publier</Button>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Traçabilité des produits agricoles locaux</CardTitle>
            <CardDescription>
              Difficile de tracer l&apos;origine des produits sur les marchés.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge variant="secondary">Agriculture</Badge>
            <Badge variant="outline">Impact 4/5</Badge>
          </CardContent>
          <CardFooter>
            <Button size="sm">Voir le problème</Button>
          </CardFooter>
        </Card>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Formulaire</h2>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demo-title">Titre</Label>
              <Input id="demo-title" placeholder="Quel problème veux-tu poser ?" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demo-body">Description</Label>
              <Textarea id="demo-body" placeholder="Décris le contexte…" rows={4} />
            </div>
            <div className="flex gap-2">
              <Button>Publier</Button>
              <Button variant="outline">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
