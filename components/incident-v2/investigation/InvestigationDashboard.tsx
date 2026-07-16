"use client";

import { InvestigationReport } from "./types";

interface Props {

    reports: InvestigationReport[];

    onOpen(
        report: InvestigationReport
    ): void;

    onCreate(): void;

}

export default function InvestigationDashboard({

    reports,

    onOpen,

    onCreate,

}: Props) {

    const total = reports.length;

    const open =
        reports.filter(
            x => x.status !== "CLOSED"
        ).length;

    const completed =
        reports.filter(
            x => x.status === "COMPLETED"
        ).length;

    const critical =
        reports.filter(
            x => x.priority === "CRITICAL"
        ).length;

    return (

        <div
            style={{
                display: "grid",
                gap: 24,
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >

                <div>

                    <h2>

                        Investigation Center

                    </h2>

                    <div
                        style={{
                            color:"#64748b"
                        }}
                    >

                        Olay Soruşturma Yönetimi

                    </div>

                </div>

                <button
                    onClick={onCreate}
                >

                    + Yeni Soruşturma

                </button>

            </div>

            <div
                style={{
                    display:"grid",
                    gridTemplateColumns:
                        "repeat(4,1fr)",
                    gap:20
                }}
            >

                <Card
                    title="Toplam"
                    value={total}
                />

                <Card
                    title="Açık"
                    value={open}
                />

                <Card
                    title="Tamamlanan"
                    value={completed}
                />

                <Card
                    title="Kritik"
                    value={critical}
                />

            </div>

            <table
                style={{
                    width:"100%",
                    borderCollapse:"collapse"
                }}
            >

                <thead>

                    <tr>

                        <Header>No</Header>

                        <Header>Araştırmacı</Header>

                        <Header>Öncelik</Header>

                        <Header>Durum</Header>

                        <Header>AI</Header>

                        <Header>&nbsp;</Header>

                    </tr>

                </thead>

                <tbody>

                    {reports.map(report=>(

                        <tr key={report.id}>

                            <Cell>

                                {report.investigationNo}

                            </Cell>

                            <Cell>

                                {report.investigator}

                            </Cell>

                            <Cell>

                                {report.priority}

                            </Cell>

                            <Cell>

                                {report.status}

                            </Cell>

                            <Cell>

                                {report.aiScore}

                            </Cell>

                            <Cell>

                                <button

                                    onClick={()=>

                                        onOpen(report)

                                    }

                                >

                                    Aç

                                </button>

                            </Cell>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

function Card({

    title,

    value,

}:{

    title:string;

    value:number;

}){

    return(

        <div
            style={{
                background:"#fff",
                borderRadius:16,
                padding:20,
                border:"1px solid #e5e7eb"
            }}
        >

            <div
                style={{
                    color:"#64748b",
                    fontSize:13
                }}
            >

                {title}

            </div>

            <div
                style={{
                    marginTop:8,
                    fontSize:34,
                    fontWeight:800
                }}
            >

                {value}

            </div>

        </div>

    );

}

function Header({

    children,

}:{

    children:React.ReactNode;

}){

    return(

        <th
            style={{
                textAlign:"left",
                padding:14
            }}
        >

            {children}

        </th>

    );

}

function Cell({

    children,

}:{

    children:React.ReactNode;

}){

    return(

        <td
            style={{
                padding:14,
                borderTop:"1px solid #eee"
            }}
        >

            {children}

        </td>

    );

}