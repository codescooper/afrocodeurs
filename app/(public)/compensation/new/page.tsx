import { CompensationForm } from "@/features/compensation/compensation-form";
export const metadata={title:"Contribuer à l’observatoire"};
export default function NewCompensationPage(){return <div className="mx-auto w-full max-w-3xl px-4 py-12"><h1 className="text-3xl font-bold">Partager une rémunération</h1><p className="mt-2 mb-8 text-muted-foreground">Une donnée anonyme pour aider toute la communauté à mieux se positionner.</p><CompensationForm/></div>}
