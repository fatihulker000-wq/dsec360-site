import crypto from "node:crypto";
import {cookies} from "next/headers";
import type {MedulaCredentials} from "./types";

const COOKIE="dsec_medula_session";

function key(){
  const raw=process.env.MEDULA_SESSION_SECRET||"";
  if(raw.length<32) throw new Error("MEDULA_SESSION_SECRET en az 32 karakter olmalıdır.");
  return crypto.createHash("sha256").update(raw).digest();
}
function encrypt(value:MedulaCredentials){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.concat([iv,tag,encrypted]).toString("base64url");
}
function decrypt(token:string):MedulaCredentials{
  const b=Buffer.from(token,"base64url"),iv=b.subarray(0,12),tag=b.subarray(12,28),payload=b.subarray(28);
  const decipher=crypto.createDecipheriv("aes-256-gcm",key(),iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(payload),decipher.final()]).toString("utf8"));
}
export async function saveMedulaSession(v:MedulaCredentials){
  const c=await cookies();
  c.set(COOKIE,encrypt(v),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:15*60});
}
export async function readMedulaSession(){
  const c=await cookies();const token=c.get(COOKIE)?.value;if(!token)return null;
  try{return decrypt(token)}catch{return null}
}
export async function clearMedulaSession(){const c=await cookies();c.set(COOKIE,"",{httpOnly:true,path:"/",maxAge:0})}
