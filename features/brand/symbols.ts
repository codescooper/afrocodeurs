export type SymbolFamily="knowledge"|"cosmos"|"nature"|"math"|"tech"|"texture";
export type BrandSymbol={id:string;slug:string;name:string;family:SymbolFamily;meaning:string;svg:string;uses:string[]};
const raw:[string,string,SymbolFamily,string,string,string[]][]=[
["knowledge","Knowledge","knowledge","Information mise en contexte",'<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="9"/>',["UI","badge"]],
["memory","Memory","knowledge","Mémoire en couches",'<path d="M5 6l7-3 7 3-7 3zM5 11l7 3 7-3M5 16l7 3 7-3"/>',["UI","éditorial"]],
["insight","Insight","knowledge","Compréhension et découverte",'<circle cx="12" cy="10" r="5"/><path d="M9 17h6M10 20h4M12 2v2M4 5l2 2M20 5l-2 2"/>',["UI","contenu"]],
["transmit","Transmit","knowledge","Transmission du savoir",'<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12h4l6-5M11 12l6 5"/>',["UI","communauté"]],
["solar-cycle","Solar Cycle","cosmos","Cycle, énergie et repère",'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',["display","motion"]],
["orbit","Orbit","cosmos","Systèmes et trajectoires",'<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',["display","data"]],
["seed","Seed","nature","Potentiel et apprentissage",'<path d="M12 20V9M12 13c-5 0-7-3-7-6 5 0 7 2 7 6zM12 10c4 0 6-3 6-6-4 0-6 2-6 6z"/>',["UI","éditorial"]],
["roots","Roots","nature","Héritage et fondations",'<path d="M12 3v8M12 11l-6 4M12 11l6 4M8 14l-3 6M8 14l2 7M16 14l3 6M16 14l-2 7"/>',["display","éditorial"]],
["recursion","Recursion","math","Récursion et profondeur",'<path d="M12 2l10 10-10 10L2 12zM12 6l6 6-6 6-6-6zM12 10l2 2-2 2-2-2z"/>',["UI","texture"]],
["sequence","Sequence","math","Progression",'<circle cx="4" cy="12" r="1"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="2"/><circle cx="21" cy="12" r="2.5"/>',["data","motion"]],
["node","Node","tech","Nœud numérique",'<circle cx="12" cy="12" r="3"/><path d="M12 2v7M12 15v7M2 12h7M15 12h7"/>',["UI","data"]],
["network","Network","tech","Réseau distribué",'<circle cx="12" cy="12" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 7l4 4M17 7l-4 4M7 17l4-4M17 17l-4-4"/>',["UI","communauté"]],
["knowledge-field","Knowledge Field","texture","Champ de connaissances",'<circle cx="4" cy="4" r=".7"/><circle cx="12" cy="4" r=".7"/><circle cx="20" cy="4" r=".7"/><circle cx="4" cy="12" r=".7"/><circle cx="12" cy="12" r=".7"/><circle cx="20" cy="12" r=".7"/><circle cx="4" cy="20" r=".7"/><circle cx="12" cy="20" r=".7"/><circle cx="20" cy="20" r=".7"/><path d="M4 4l8 8 8-8M4 20l8-8 8 8"/>',["texture","hero"]],
["data-weave","Data Weave","texture","Données tissées",'<path d="M2 6h20M2 12h20M2 18h20M6 2v20M12 2v20M18 2v20M2 9c5-5 15 5 20 0M2 15c5 5 15-5 20 0"/>',["texture","motion"]],
];
export const brandSymbols:BrandSymbol[]=raw.map((x,i)=>({id:`AC-SYM-${String(i+1).padStart(3,"0")}`,slug:x[0],name:x[1],family:x[2],meaning:x[3],svg:x[4],uses:x[5]}));
