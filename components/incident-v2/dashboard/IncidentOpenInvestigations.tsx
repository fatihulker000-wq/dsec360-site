"use client";

import { IncidentInvestigationItem } from "./types";

type Props = {
  investigations: IncidentInvestigationItem[];
};

export default function IncidentOpenInvestigations({
  investigations,
}: Props) {

  return (

    <section
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 22,
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 28px rgba(15,23,42,.05)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >

        <div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#6b7280",
            }}
          >
            INVESTIGATIONS
          </div>

          <h3
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Açık Soruşturmalar
          </h3>

        </div>

      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >

        <thead>

          <tr>

            <Header>ID</Header>

            <Header>Olay</Header>

            <Header>Departman</Header>

            <Header>Sorumlu</Header>

            <Header>Durum</Header>

            <Header>İlerleme</Header>

            <Header>Gün</Header>

          </tr>

        </thead>

        <tbody>

          {investigations.map((item) => (

            <tr
              key={item.id}
              style={{
                borderTop:
                  "1px solid #edf2f7",
              }}
            >

              <Cell>{item.id}</Cell>

              <Cell>{item.title}</Cell>

              <Cell>{item.department}</Cell>

              <Cell>{item.owner}</Cell>

              <Cell>

                <StatusBadge
                  status={item.status}
                />

              </Cell>

              <Cell>

                <ProgressBar
                  value={item.progress}
                />

              </Cell>

              <Cell>

                {item.day}

              </Cell>

            </tr>

          ))}

        </tbody>

      </table>

    </section>

  );

}

function StatusBadge({
  status,
}: {
  status: string;
}) {

  const color =
    status === "OPEN"
      ? "#dc2626"
      : status === "IN_PROGRESS"
      ? "#ea580c"
      : "#16a34a";

  return (

    <span
      style={{
        color,
        fontWeight: 900,
      }}
    >
      {status}
    </span>

  );

}

function ProgressBar({
  value,
}: {
  value: number;
}) {

  return (

    <div
      style={{
        width: 120,
        height: 10,
        borderRadius: 999,
        background: "#edf2f7",
        overflow: "hidden",
      }}
    >

      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background:
            value >= 80
              ? "#16a34a"
              : value >= 50
              ? "#ca8a04"
              : "#dc2626",
        }}
      />

    </div>

  );

}

function Header({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <th
      style={{
        textAlign: "left",
        paddingBottom: 14,
        fontSize: 13,
        color: "#64748b",
      }}
    >
      {children}
    </th>

  );

}

function Cell({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <td
      style={{
        padding: "14px 0",
        fontSize: 14,
      }}
    >
      {children}
    </td>

  );

}