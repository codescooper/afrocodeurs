import { db } from "@/lib/db";
export const BRAND_DEFAULTS = {
 version:"1.0", tagline:"Des problèmes aux solutions, ensemble.", mantra:"Build Before Consume.",
 intro:"Une identité panafricaine contemporaine pour celles et ceux qui construisent.",
 gold:"#F5B800", black:"#111111", green:"#22C55E", ivory:"#FAFAF8", night:"#0D0C0A", stone:"#5C5C54",
 visualPrinciple:"Signal + Structure + Humain",
 visualGuidance:"Grilles, blocs, lignes, nœuds, code et personnes réelles. Les références africaines doivent avoir du sens, jamais servir de remplissage folklorique.",
 graphicGuidance:"Grille, hiérarchie, photo, illustration, exports et fichiers sources.",
 motionGuidance:"Mouvement, lower thirds, transitions, titres, sous-titres et safe areas.",
 devGuidance:"Tokens, composants, accessibilité, responsive, dark mode et reduced motion.",
 socialGuidance:"Déclinaisons par canal, lisibilité mobile, CTA, alt text et campagne.",
 webinarLabel:"WEBINAR #01", webinarTitle:"COMPRENDRE.\nCONSTRUIRE.\nPARTAGER.", webinarMeta:"15 OCT · 18:30 GMT · EN LIGNE",
 figmaUrl:null,canvaUrl:null,assetsUrl:null
} as const;
export async function getBrandSettings(){
 const row=await db.brandSettings.findUnique({where:{id:"main"}});
 return row ?? BRAND_DEFAULTS;
}
