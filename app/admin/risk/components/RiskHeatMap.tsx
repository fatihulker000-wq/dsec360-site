"use client";

import React, { useMemo } from "react";

export interface HeatMapRisk {
  id: string;
  probability: number;
  severity: number;
  title?: string;
}

interface Props {
  risks: HeatMapRisk[];
  onCellClick?: (probability: number, severity: number) => void;
}

const COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  2: "bg-lime-100 text-lime-800",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-orange-100 text-orange-900",
  5: "bg-red-100 text-red-900",
};

export default function RiskHeatMap({
  risks,
  onCellClick,
}: Props) {
  const matrix = useMemo(() => {
    const m = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => 0)
    );

    risks.forEach((r) => {
      const p = Math.min(5, Math.max(1, r.probability));
      const s = Math.min(5, Math.max(1, r.severity));

      m[5 - p][s - 1]++;
    });

    return m;
  }, [risks]);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <h3 className="mb-4 text-lg font-semibold">
        Risk Heat Map
      </h3>

      <div className="grid grid-cols-6 gap-2">

        <div />

        {[1,2,3,4,5].map(s=>(
          <div
            key={s}
            className="text-center text-sm font-semibold"
          >
            {s}
          </div>
        ))}

        {[5,4,3,2,1].map((prob,row)=>(

          <React.Fragment key={prob}>

            <div className="flex items-center justify-center font-semibold">
              {prob}
            </div>

            {matrix[row].map((count,col)=>{

              const severity=col+1;

              const score=Math.max(prob,severity);

              return(

                <button
                  key={`${prob}-${severity}`}
                  onClick={()=>onCellClick?.(prob,severity)}
                  className={`h-16 rounded-lg border transition hover:scale-105 ${COLORS[score]}`}
                >

                  <div className="text-lg font-bold">
                    {count}
                  </div>

                </button>

              )

            })}

          </React.Fragment>

        ))}

      </div>

      <div className="mt-4 flex justify-between text-xs text-gray-500">

        <span>Olasılık ↑</span>

        <span>Şiddet →</span>

      </div>

    </div>
  );
}