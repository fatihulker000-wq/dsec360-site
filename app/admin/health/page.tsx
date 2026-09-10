"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BRAND } from "@/components/dashboard/styles";

import HealthKpiCards from "@/components/health/HealthKpiCards";
import HealthListsSection from "@/components/health/HealthListsSection";

import type {
  HealthDashboardResponse,
  HealthKpiSummary,
  UpcomingHealthExam,
  RecentPrescription,
  RecentEk2,
  HealthAlert,
  RecentHealthExam,
} from "@/components/health/types";

import { emptyHealthSummary } from "@/components/health/healthHelpers";

type CompanyOption = { id:string; name:string };

export default function HealthDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [companies,setCompanies] = useState<CompanyOption[]>([]);
  const [companyId,setCompanyId] = useState<string>("ALL");
  const [companyLoading,setCompanyLoading] = useState(true);
  const [error,setError] = useState<string>("");

  const [summary, setSummary] =
    useState<HealthKpiSummary>(emptyHealthSummary());

  const [upcomingExams, setUpcomingExams] =
    useState<UpcomingHealthExam[]>([]);

  const [recentPrescriptions, setRecentPrescriptions] =
    useState<RecentPrescription[]>([]);

  const [recentEk2, setRecentEk2] =
    useState<RecentEk2[]>([]);

    const [recentExaminations, setRecentExaminations] =
  useState<RecentHealthExam[]>([]);

  const [alerts, setAlerts] =
    useState<HealthAlert[]>([]);

  useEffect(() => {
    let alive=true;
    (async()=>{
      try{
        setCompanyLoading(true);
        const res=await fetch("/api/admin/companies",{cache:"no-store",credentials:"include"});
        const json=await res.json();
        if(!res.ok) throw new Error(json?.error||"Firmalar alınamadı.");
        const rows=Array.isArray(json?.data)?json.data:Array.isArray(json?.companies)?json.companies:Array.isArray(json)?json:[];
        const opts=rows.map((x:any)=>({id:String(x.id),name:String(x.name||"Firma")})).filter((x:any)=>x.id);
        if(!alive)return;
        setCompanies(opts);

        // company_admin/demo_user endpoint only returns their firm. Global admin gets ALL.
        if(opts.length===1) setCompanyId(opts[0].id);
        else setCompanyId("ALL");
      }catch(e:any){
        if(alive)setError(e?.message||"Firmalar yüklenemedi.");
      }finally{
        if(alive)setCompanyLoading(false);
      }
    })();
    return()=>{alive=false};
  },[]);

  useEffect(() => {
    if(companyLoading)return;
    let alive=true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const qs=companyId && companyId!=="ALL" ? `?companyId=${encodeURIComponent(companyId)}` : "";
        const res = await fetch(`/api/admin/health-dashboard${qs}`, {
          cache: "no-store",
          credentials: "include",
        });

        const json: HealthDashboardResponse = await res.json();
        if (!res.ok) throw new Error(json?.error||"Sağlık dashboard alınamadı.");
        if(!alive)return;

        setSummary(json.summary || emptyHealthSummary());
        setUpcomingExams(json.upcomingExams || []);
        setRecentPrescriptions(json.recentPrescriptions || []);
        setRecentEk2(json.recentEk2 || []);
        setRecentExaminations(json.recentExaminations || []);
        setAlerts(json.alerts || []);
      } catch(e:any) {
        if(alive)setError(e?.message||"Sağlık dashboard alınamadı.");
      } finally {
        if(alive)setLoading(false);
      }
    }

    void load();
    return()=>{alive=false};
  }, [companyId,companyLoading]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 28,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            Sağlık Dashboard
          </h1>

          <div
            style={{
              marginTop: 8,
              color: BRAND.muted,
            }}
          >
            İşyeri hekimi yönetim ekranı
          </div>
        </div>

        {/* Firma filtresi */}
        <section
          style={{
            marginBottom: 18,
            padding: 18,
            borderRadius: 18,
            background: "#fff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,.05)",
            display: "grid",
            gridTemplateColumns: "minmax(220px,420px) minmax(0,1fr)",
            gap: 18,
            alignItems: "end",
          }}
        >
          <label style={{display:"grid",gap:7,fontSize:12,fontWeight:900,color:"#334155"}}>
            FİRMA FİLTRESİ
            <select
              value={companyId}
              onChange={(e)=>setCompanyId(e.target.value)}
              disabled={companyLoading||companies.length<=1}
              style={{
                width:"100%",
                minHeight:44,
                padding:"0 12px",
                borderRadius:12,
                border:"1px solid #d0d5dd",
                background:"#fff",
                color:"#101828",
                fontWeight:800,
                outline:"none",
              }}
            >
              {companies.length>1 && <option value="ALL">Tüm Firmalar</option>}
              {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>
            {companyLoading
              ? "Firmalar yükleniyor…"
              : companyId==="ALL"
                ? "Dashboard tüm erişilebilir firmaların aktif çalışan ve sağlık kayıtlarını birlikte gösteriyor."
                : <>Dashboard yalnızca <b style={{color:"#101828"}}>{companies.find(c=>c.id===companyId)?.name||"seçili firma"}</b> için hesaplanıyor.</>}
          </div>
        </section>

        {error && (
          <div style={{marginBottom:18,padding:"12px 14px",borderRadius:12,background:"#fef2f2",border:"1px solid #fecaca",color:"#b91c1c",fontWeight:800,fontSize:12}}>
            {error}
          </div>
        )}

        {/* Çalışan Sağlık Kartları */}
        <Link
          href={companyId==="ALL"?"/admin/health/employees":`/admin/health/employees?companyId=${encodeURIComponent(companyId)}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
            padding: 28,
            borderRadius: 22,
            background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
            color: "#fff",
            textDecoration: "none",
            boxShadow: "0 18px 40px rgba(127,29,29,.20)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                opacity: .85,
              }}
            >
              HEKİM ÇALIŞMA ALANI
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              Çalışan Sağlık Kartları
            </div>

            <div
              style={{
                marginTop: 10,
                opacity: .9,
                fontSize: 15,
              }}
            >
              Muayene, EK-2, reçete, laboratuvar, odyometri,
              SFT, aşı ve tüm sağlık geçmişini tek ekrandan yönetin.
            </div>
          </div>

          <div
            style={{
              padding: "14px 22px",
              borderRadius: 14,
              background: "rgba(255,255,255,.18)",
              border: "1px solid rgba(255,255,255,.25)",
              fontWeight: 900,
              whiteSpace: "nowrap",
              fontSize: 18,
            }}
          >
            Aç →
          </div>
        </Link>

        {loading && (
          <div style={{marginBottom:14,padding:"10px 12px",borderRadius:10,background:"#eff6ff",color:"#1d4ed8",fontSize:12,fontWeight:800}}>
            Sağlık verileri hesaplanıyor…
          </div>
        )}

        <HealthKpiCards
          summary={summary}
          isMobile={false}
        />

        <HealthListsSection
  isMobile={false}
  upcomingExams={upcomingExams}
  recentExaminations={recentExaminations}
  recentPrescriptions={recentPrescriptions}
  recentEk2={recentEk2}
  alerts={alerts}
/>
      </div>
    </main>
  );
}