"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
const HEX=/^#[0-9A-Fa-f]{6}$/;
const text=(f:FormData,k:string,max=1000)=>String(f.get(k)??"").trim().slice(0,max);
const url=(f:FormData,k:string)=>{const v=text(f,k,500);if(!v)return null;try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)?v:null}catch{return null}};
export async function updateBrandSettingsAction(formData:FormData){
 const session=await auth(); if(!session?.user || !can(session.user.role,"system:manage")) throw new Error("Non autorisé");
 const color=(k:string,fallback:string)=>{const v=text(formData,k,7);return HEX.test(v)?v.toUpperCase():fallback};
 const data={
  version:text(formData,"version",30)||"1.0",tagline:text(formData,"tagline",160),mantra:text(formData,"mantra",120),intro:text(formData,"intro",500),
  gold:color("gold","#F5B800"),black:color("black","#111111"),green:color("green","#22C55E"),ivory:color("ivory","#FAFAF8"),night:color("night","#0D0C0A"),stone:color("stone","#5C5C54"),
  visualPrinciple:text(formData,"visualPrinciple",160),visualGuidance:text(formData,"visualGuidance",1000),
  graphicGuidance:text(formData,"graphicGuidance",1000),motionGuidance:text(formData,"motionGuidance",1000),devGuidance:text(formData,"devGuidance",1000),socialGuidance:text(formData,"socialGuidance",1000),
  webinarLabel:text(formData,"webinarLabel",80),webinarTitle:text(formData,"webinarTitle",300),webinarMeta:text(formData,"webinarMeta",160),
  figmaUrl:url(formData,"figmaUrl"),canvaUrl:url(formData,"canvaUrl"),assetsUrl:url(formData,"assetsUrl"),updatedById:session.user.id
 };
 await db.brandSettings.upsert({where:{id:"main"},create:{id:"main",...data},update:data});
 revalidatePath("/brand");revalidatePath("/admin/brand");
}
