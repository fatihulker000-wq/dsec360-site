"use client";

import type {
  IncidentAuditFilters as IncidentAuditFilterState,
  IncidentAuditSeverity,
  IncidentAuditStatus,
  IncidentAuditAction,
} from "./types";

interface Props {
  filters: IncidentAuditFilterState;
  onChange(
    filters: IncidentAuditFilterState
  ): void;
  onReset(): void;
}

export default function IncidentAuditFilters({

  filters,

  onChange,

  onReset,

}: Props) {

  function update<
  K extends keyof IncidentAuditFilterState
>(
  key: K,
  value: IncidentAuditFilterState[K]
) {

    onChange({

      ...filters,

      [key]:
        value === ""
          ? undefined
          : value,

    });

  }

  return (

    <section
      style={{
        background:"#fff",
        border:"1px solid #e5e7eb",
        borderRadius:20,
        padding:22,
      }}
    >

      <div
        style={{
          display:"grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap:16,
        }}
      >

        <Field title="Arama">

          <input
            value={filters.search ?? ""}
            onChange={(e)=>
              update("search",e.target.value)
            }
            placeholder="Kullanıcı, olay..."
            style={input}
          />

        </Field>

        <Field title="Durum">

          <select
            value={filters.status ?? ""}
            onChange={(e)=>
              update(
                "status",
                e.target.value as IncidentAuditStatus
              )
            }
            style={input}
          >

            <option value="">
              Tümü
            </option>

            <option value="SUCCESS">
              Başarılı
            </option>

            <option value="INFO">
              Bilgi
            </option>

            <option value="WARNING">
              Uyarı
            </option>

            <option value="FAILED">
              Hata
            </option>

          </select>

        </Field>

        <Field title="Önem">

          <select
            value={filters.severity ?? ""}
            onChange={(e)=>
              update(
                "severity",
                e.target.value as IncidentAuditSeverity
              )
            }
            style={input}
          >

            <option value="">
              Tümü
            </option>

            <option value="LOW">
              LOW
            </option>

            <option value="MEDIUM">
              MEDIUM
            </option>

            <option value="HIGH">
              HIGH
            </option>

            <option value="CRITICAL">
              CRITICAL
            </option>

          </select>

        </Field>

        <Field title="İşlem">

          <select
            value={filters.action ?? ""}
            onChange={(e)=>
              update(
                "action",
                e.target.value as IncidentAuditAction
              )
            }
            style={input}
          >

            <option value="">
              Tümü
            </option>

            <option value="INCIDENT_CREATED">
              Incident Created
            </option>

            <option value="INCIDENT_UPDATED">
              Incident Updated
            </option>

            <option value="INVESTIGATION_STARTED">
              Investigation
            </option>

            <option value="ROOT_CAUSE_COMPLETED">
              Root Cause
            </option>

            <option value="CORRECTIVE_ACTION_CREATED">
              Corrective Action
            </option>

            <option value="SGK_PREPARED">
              SGK
            </option>

            <option value="IBYS_PREPARED">
              İBYS
            </option>

          </select>

        </Field>

        <Field title="Başlangıç">

          <input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e)=>
              update(
                "startDate",
                e.target.value
              )
            }
            style={input}
          />

        </Field>

        <Field title="Bitiş">

          <input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e)=>
              update(
                "endDate",
                e.target.value
              )
            }
            style={input}
          />

        </Field>

      </div>

      <div
        style={{
          marginTop:18,
          display:"flex",
          justifyContent:"flex-end",
        }}
      >

        <button
          onClick={onReset}
          style={{
            border:"none",
            padding:"10px 20px",
            borderRadius:10,
            background:"#111827",
            color:"#fff",
            cursor:"pointer",
            fontWeight:800,
          }}
        >
          Filtreleri Temizle
        </button>

      </div>

    </section>

  );

}

function Field({

  title,

  children,

}:{

  title:string;

  children:React.ReactNode;

}){

  return(

    <div>

      <div
        style={{
          fontSize:12,
          fontWeight:800,
          color:"#64748b",
          marginBottom:8,
        }}
      >
        {title}
      </div>

      {children}

    </div>

  )

}

const input:React.CSSProperties={

  width:"100%",

  height:42,

  borderRadius:10,

  border:"1px solid #d1d5db",

  padding:"0 12px",

  fontSize:14,

  background:"#fff",

};