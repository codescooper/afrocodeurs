import { countryName } from "./constants";
import "flag-icons/css/flag-icons.min.css";
export function VentureMark({ name, country, logoUrl, large = false }: { name: string; country: string; logoUrl: string | null; large?: boolean }) {
  return <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full border border-white/20 font-semibold ${large ? "size-20 text-2xl" : "size-14 text-lg"}`} style={{ backgroundColor: "#202b27", color: "#f4f7f4", ...(logoUrl ? { backgroundImage: `url(${JSON.stringify(logoUrl)})`, backgroundPosition: "center", backgroundSize: "cover" } : {}) }}>
    {!logoUrl && <span aria-hidden="true">{name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>}
    <span className="absolute -bottom-0.5 -right-1 flex h-5 w-7 items-center justify-center overflow-hidden rounded-sm border border-white/70 bg-white" title={countryName(country)} role="img" aria-label={`Pays de lancement : ${countryName(country)}`}><span className={`fi fi-${country.toLowerCase()}`} aria-hidden="true" /></span>
  </span>;
}
