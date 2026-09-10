import * as soap from "soap";
import {medulaConfig} from "./config";
import type {MedulaCredentials,MedulaResult} from "./types";

function text(v:any){return String(v??"").trim()}
function findDeep(obj:any,key:string):any{
  if(!obj||typeof obj!=="object")return undefined;
  if(Object.prototype.hasOwnProperty.call(obj,key))return obj[key];
  for(const v of Object.values(obj)){const x=findDeep(v,key);if(x!==undefined)return x}
}
export async function createMedulaClient(credentials:MedulaCredentials){
  const cfg=medulaConfig(credentials.environment);
  const client=await soap.createClientAsync(cfg.RECETE_WSDL,{
    endpoint:cfg.RECETE_ENDPOINT,
    wsdl_options:{timeout:20000},
  });
  client.setSecurity(new soap.BasicAuthSecurity(credentials.username,credentials.password));
  client.setEndpoint(cfg.RECETE_ENDPOINT);
  return client;
}
export function normalizeMedulaResult(raw:any):MedulaResult<any>{
  const code=text(findDeep(raw,"sonucKodu"));
  const msg=text(findDeep(raw,"sonucMesaji"));
  const warn=text(findDeep(raw,"uyariMesaji"));
  return {ok:code==="0000"||code==="0",resultCode:code,resultMessage:msg,warningMessage:warn,data:raw};
}
export async function callMedula(credentials:MedulaCredentials,method:string,args:any){
  const client:any=await createMedulaClient(credentials);
  const fn=client[`${method}Async`];
  if(typeof fn!=="function")throw new Error(`MEDULA WSDL içinde ${method} metodu bulunamadı.`);
  const result=await fn.call(client,args);
  return normalizeMedulaResult(Array.isArray(result)?result[0]:result);
}
