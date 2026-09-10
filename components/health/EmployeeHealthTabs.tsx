"use client";

type Props = { activeTab:string; setActiveTab:(tab:string)=>void };

const tabs = [
  ["Genel","⌂"],["EK-2","▣"],["Muayeneler","◉"],["Reçeteler","✚"],
  ["Laboratuvar","⌁"],["Odyometri","◌"],["Solunum","≈"],["Aşılar","✦"],
  ["İş Kazaları","!"],["Dosyalar","▤"],["Geçmiş","↺"],
] as const;

export default function EmployeeHealthTabs({activeTab,setActiveTab}:Props){
  return <div className="health-tabbar">
    <style jsx>{`
      .health-tabbar{display:flex;gap:7px;overflow-x:auto;background:#fff;border:1px solid #e4e7ec;border-radius:16px;padding:8px;margin:0 0 16px;box-shadow:0 8px 22px rgba(16,24,40,.04);scrollbar-width:thin}
      button{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid transparent;background:#fff;color:#475467;border-radius:10px;padding:9px 11px;font-size:12px;font-weight:850;cursor:pointer;transition:.15s ease}
      button:hover{background:#f9fafb;border-color:#eaecf0}
      button.active{background:#fff1f2;border-color:#f5c2c7;color:#9f1239;box-shadow:inset 0 0 0 1px rgba(159,18,57,.03)}
      .icon{font-size:13px;opacity:.85}
    `}</style>
    {tabs.map(([tab,icon])=><button key={tab} type="button" className={activeTab===tab?"active":""} onClick={()=>setActiveTab(tab)}><span className="icon">{icon}</span>{tab}</button>)}
  </div>;
}
