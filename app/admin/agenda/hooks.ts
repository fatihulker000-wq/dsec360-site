"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAgenda, getCompanies, getEmployees } from "./api";
import type { AgendaTask, AgendaViewer, CompanyItem, EmployeeItem, TaskFilter } from "./types";

function startOfToday(){const d=new Date();d.setHours(0,0,0,0);return d}
function endOfToday(){const d=new Date();d.setHours(23,59,59,999);return d}

export function isOpen(t:AgendaTask){return t.status===0&&!t.is_deleted&&!t.is_archived}
export function isOverdue(t:AgendaTask){return isOpen(t)&&!!t.due_at&&new Date(t.due_at).getTime()<Date.now()}
export function isToday(v:string|null){if(!v)return false;const d=new Date(v);return d>=startOfToday()&&d<=endOfToday()}
export function isUpcoming(t:AgendaTask){if(!isOpen(t)||!t.due_at)return false;const from=endOfToday(),to=new Date(from);to.setDate(to.getDate()+7);const due=new Date(t.due_at);return due>from&&due<=to}

// Kritik ile gecikmiş birbirinden ayrıldı. Gecikmiş kayıt artık otomatik kritik sayılmaz.
export function isCritical(t:AgendaTask){return isOpen(t)&&Number(t.priority)>=2}

export function useAgendaData(webFirmId:string){
 const[tasks,setTasks]=useState<AgendaTask[]>([]);const[viewer,setViewer]=useState<AgendaViewer|null>(null);const[loading,setLoading]=useState(false);const[loadError,setLoadError]=useState("");
 const refresh=useCallback(async()=>{if(!webFirmId){setTasks([]);setViewer(null);setLoadError("");return}setLoading(true);setLoadError("");try{const r=await getAgenda(webFirmId);setTasks(Array.isArray(r.records)?r.records:[]);setViewer(r.viewer??null)}catch(e){setTasks([]);setViewer(null);setLoadError(e instanceof Error?e.message:"Ajanda yüklenemedi.")}finally{setLoading(false)}},[webFirmId]);
 useEffect(()=>{void refresh()},[refresh]);return{tasks,viewer,loading,loadError,refresh}
}

export function useCompanyData(){const[companies,setCompanies]=useState<CompanyItem[]>([]);const[loading,setLoading]=useState(true);const refresh=useCallback(async()=>{setLoading(true);try{const r=await getCompanies();setCompanies((r.data??[]).filter(x=>x.is_active!==false).map(x=>({...x,id:String(x.id||"").trim(),name:String(x.name||"").trim(),localId:x.localId??x.local_firm_id??null})).filter(x=>x.id&&x.name))}finally{setLoading(false)}},[]);useEffect(()=>{void refresh()},[refresh]);return{companies,loading,refresh}}

export function useEmployeeData(webFirmId:string){const[employees,setEmployees]=useState<EmployeeItem[]>([]);const[loading,setLoading]=useState(false);const refresh=useCallback(async()=>{if(!webFirmId){setEmployees([]);return}setLoading(true);try{const r=await getEmployees(webFirmId);setEmployees((r.data??[]).filter(x=>x.active!==false).map(x=>({...x,id:String(x.id||"").trim(),full_name:String(x.full_name||"").trim()})).filter(x=>x.id&&x.full_name))}finally{setLoading(false)}},[webFirmId]);useEffect(()=>{void refresh()},[refresh]);return{employees,loading,refresh}}

export function useAgendaStats(tasks:AgendaTask[]){return useMemo(()=>{const a=tasks.filter(t=>!t.is_deleted&&!t.is_archived),open=a.filter(t=>t.status===0);return{total:a.length,open:open.length,done:a.filter(t=>t.status===1).length,today:open.filter(t=>isToday(t.due_at)).length,upcoming:open.filter(isUpcoming).length,overdue:open.filter(isOverdue).length,critical:open.filter(isCritical).length}},[tasks])}

export function useFilteredAgenda(tasks:AgendaTask[],filter:TaskFilter,typeFilter:string,search:string){return useMemo(()=>{const q=search.trim().toLocaleLowerCase("tr-TR");return tasks.filter(t=>!t.is_deleted&&!t.is_archived).filter(t=>filter==="OPEN"?t.status===0:filter==="DONE"?t.status===1:filter==="TODAY"?t.status===0&&isToday(t.due_at):filter==="UPCOMING"?isUpcoming(t):filter==="OVERDUE"?isOverdue(t):filter==="CRITICAL"?isCritical(t):true).filter(t=>typeFilter==="ALL"||t.type===typeFilter).filter(t=>!q||[t.title,t.note,t.location,t.assigned_to,t.assigned_by,t.participants_csv,t.category,t.module_ref].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR").includes(q)).sort((a,b)=>Number(isCritical(b))-Number(isCritical(a))||Number(isOverdue(b))-Number(isOverdue(a))||b.priority-a.priority||a.status-b.status||((a.due_at?new Date(a.due_at).getTime():Number.MAX_SAFE_INTEGER)-(b.due_at?new Date(b.due_at).getTime():Number.MAX_SAFE_INTEGER)))},[tasks,filter,typeFilter,search])}