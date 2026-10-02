export type HeritageValidation = "documented" | "review" | "community-review";
export type HeritageUsage = "citation" | "documentation" | "restricted";

export type HeritageEntry = {
  id:string; name:string; system:string; people:string; geography:string;
  kind:string; meaning:string; validation:HeritageValidation; usage:HeritageUsage;
  sourceLabel:string; sourceUrl:string; note?:string;
};

export const heritageEntries:HeritageEntry[] = [
{id:"AC-HER-001",name:"Mate Masie",system:"Adinkra",people:"Akan / Asante",geography:"Ghana · Côte d’Ivoire",kind:"Idéogramme",meaning:"« What I hear, I keep » : sagesse et prudence.",validation:"documented",usage:"citation",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art"},
{id:"AC-HER-002",name:"Aban",system:"Adinkra",people:"Akan / Asante",geography:"Ghana",kind:"Idéogramme",meaning:"Maison à deux étages / palais : force et autorité.",validation:"documented",usage:"citation",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art"},
{id:"AC-HER-003",name:"Compatibilité",system:"Nsibidi",people:"Ejagham et peuples voisins",geography:"Nigeria · Cameroun",kind:"Système idéographique",meaning:"Symbole documenté de compatibilité.",validation:"documented",usage:"restricted",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art",note:"Le Smithsonian indique que les niveaux profonds de connaissance nsibidi peuvent être restreints."},
{id:"AC-HER-004",name:"Lettre « lou »",system:"Bamum",people:"Bamum",geography:"Cameroun",kind:"Syllabaire",meaning:"Caractère pour la syllabe « lou ».",validation:"documented",usage:"documentation",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art"},
{id:"AC-HER-005",name:"Lettre « teh »",system:"Vai",people:"Vai / traditions mandé",geography:"Liberia · Sierra Leone",kind:"Syllabaire",meaning:"Caractère pour la syllabe « teh ».",validation:"documented",usage:"documentation",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art"},
{id:"AC-HER-006",name:"Son « eh »",system:"Tifinagh",people:"Touareg / Amazigh",geography:"Sahara · Afrique du Nord-Ouest",kind:"Alphabet",meaning:"Lettre documentée pour le son « eh ».",validation:"documented",usage:"documentation",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art"},
{id:"AC-HER-007",name:"Syllabe « gua »",system:"Ge’ez / Ethiopic",people:"Traditions éthiopiennes",geography:"Éthiopie · Corne de l’Afrique",kind:"Syllabaire",meaning:"Caractère documenté pour la syllabe « gua ».",validation:"documented",usage:"documentation",sourceLabel:"Smithsonian NMAfA",sourceUrl:"https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art"},
{id:"AC-HER-008",name:"Sona / Lusona",system:"Sona",people:"Lunda Cokwe et peuples voisins",geography:"Est de l’Angola",kind:"Dessin géométrique sur sable",meaning:"Transmission de croyances, pensées, histoires, connaissances et mémoire collective.",validation:"documented",usage:"restricted",sourceLabel:"UNESCO ICH",sourceUrl:"https://ich.unesco.org/fr/RL/sona-dessins-et-figures-geometriques-sur-le-sable-01994",note:"Certaines étapes avancées des rites d’initiation comportent des restrictions d’accès."},
];

export const heritagePipeline=["Proposé","À documenter","En vérification","Validé","Publié"] as const;
