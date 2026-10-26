import { LIFECYCLES, SECTORS } from "./catalog";

type Values = { repositoryUrl?: string | null; sector?: string; lifecycle?: string; countriesServed?: string[]; languages?: string[]; contributionNeeds?: string; africanContext?: string };
const style = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

export function CatalogFields({ values = {} }: { values?: Values }) {
  return <fieldset className="space-y-4 border-t border-border pt-5">
    <legend className="font-semibold">Usages et contribution</legend>
    <label className="block text-sm">Dépôt source<input name="repositoryUrl" type="url" maxLength={500} defaultValue={values.repositoryUrl ?? ""} placeholder="https://github.com/equipe/projet" className={style} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm">Secteur<select name="sector" defaultValue={values.sector ?? "OTHER"} className={style}>{Object.entries(SECTORS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="block text-sm">État de la solution<select name="lifecycle" defaultValue={values.lifecycle ?? "EXPERIMENTAL"} className={style}>{Object.entries(LIFECYCLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="block text-sm">Pays d’utilisation, séparés par des virgules<input name="countriesServed" maxLength={500} defaultValue={values.countriesServed?.join(", ")} className={style} /></label>
      <label className="block text-sm">Langues disponibles, séparées par des virgules<input name="languages" maxLength={500} defaultValue={values.languages?.join(", ")} className={style} /></label>
    </div>
    <label className="block text-sm">Équipe et ancrage africain<textarea name="africanContext" rows={3} maxLength={2000} defaultValue={values.africanContext} placeholder="Présentez les liens documentés ou déclarés avec les réalités africaines, sans déduire l’origine des personnes." className={style} /></label>
    <label className="block text-sm">Besoins de contribution<textarea name="contributionNeeds" rows={3} maxLength={2000} defaultValue={values.contributionNeeds} placeholder="Tests terrain, traduction, documentation… Précisez aussi les contraintes techniques et les éventuels coûts." className={style} /></label>
  </fieldset>;
}
