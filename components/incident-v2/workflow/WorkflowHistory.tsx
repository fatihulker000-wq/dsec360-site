"use client";

import { IncidentWorkflowEvent } from "./types";

interface Props {
    events: IncidentWorkflowEvent[];
}

export default function WorkflowHistory({
    events,
}: Props) {

    const sorted = [...events].sort(
        (a,b)=>
            new Date(b.createdAt).getTime()-
            new Date(a.createdAt).getTime()
    );

    return(

        <section
            style={{
                background:"#fff",
                borderRadius:20,
                border:"1px solid #e5e7eb",
                padding:22,
            }}
        >

            <div
                style={{
                    marginBottom:20,
                }}
            >

                <div
                    style={{
                        fontSize:12,
                        fontWeight:900,
                        color:"#64748b",
                    }}
                >
                    HISTORY
                </div>

                <h2
                    style={{
                        marginTop:6,
                        fontSize:24,
                        fontWeight:900,
                    }}
                >
                    Workflow Geçmişi
                </h2>

            </div>

            <table
                style={{
                    width:"100%",
                    borderCollapse:"collapse",
                }}
            >

                <thead>

                <tr>

                    <Head>Tarih</Head>

                    <Head>Adım</Head>

                    <Head>Durum</Head>

                    <Head>Kullanıcı</Head>

                    <Head>Mesaj</Head>

                </tr>

                </thead>

                <tbody>

                {sorted.map(item=>(

                    <tr key={item.id}>

                        <Cell>{format(item.createdAt)}</Cell>

                        <Cell>{item.stepType}</Cell>

                        <Cell>{item.status}</Cell>

                        <Cell>{item.createdBy||"-"}</Cell>

                        <Cell>{item.message}</Cell>

                    </tr>

                ))}

                </tbody>

            </table>

        </section>

    )

}

function Head({children}:any){

    return(

        <th
            style={{
                textAlign:"left",
                padding:12,
                borderBottom:"1px solid #e5e7eb",
            }}
        >
            {children}
        </th>

    )

}

function Cell({children}:any){

    return(

        <td
            style={{
                padding:12,
                borderBottom:"1px solid #f1f5f9",
            }}
        >
            {children}
        </td>

    )

}

function format(date:string){

    return new Date(date).toLocaleString("tr-TR")

}