"use client";

import { InvestigationEvidence } from "./types";

interface Props {

    evidences: InvestigationEvidence[];

    onChange(
        evidences: InvestigationEvidence[]
    ): void;

}

export default function EvidenceCenter({

    evidences,

    onChange,

}: Props) {

    function upload(

        files: FileList | null,

        type:
            | "PHOTO"
            | "VIDEO"
            | "DOCUMENT"
            | "AUDIO"

    ) {

        if (!files) return;

        const list = [...evidences];

        Array.from(files).forEach(file => {

            list.push({

                id: crypto.randomUUID(),

                type,

                fileName: file.name,

                url: URL.createObjectURL(file),

                uploadedBy: "Current User",

                uploadedAt:
                    new Date().toISOString(),

            });

        });

        onChange(list);

    }

    function remove(id: string) {

        onChange(

            evidences.filter(

                x => x.id !== id

            )

        );

    }

    return (

        <div
            style={{
                display:"grid",
                gap:24,
            }}
        >

            <div
                style={{
                    display:"flex",
                    gap:12,
                    flexWrap:"wrap",
                }}
            >

                <UploadButton
                    title="📷 Fotoğraf"
                    accept="image/*"
                    type="PHOTO"
                    onUpload={upload}
                />

                <UploadButton
                    title="🎥 Video"
                    accept="video/*"
                    type="VIDEO"
                    onUpload={upload}
                />

                <UploadButton
                    title="📄 Belge"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    type="DOCUMENT"
                    onUpload={upload}
                />

                <UploadButton
                    title="🎤 Ses"
                    accept="audio/*"
                    type="AUDIO"
                    onUpload={upload}
                />

            </div>

            <div
                style={{
                    display:"grid",
                    gridTemplateColumns:
                        "repeat(auto-fill,minmax(280px,1fr))",
                    gap:18,
                }}
            >

                {evidences.map(item=>(

                    <div
                        key={item.id}
                        style={{
                            border:"1px solid #e5e7eb",
                            borderRadius:16,
                            padding:18,
                            background:"#fff",
                        }}
                    >

                        <div
                            style={{
                                fontWeight:800,
                            }}
                        >
                            {icon(item.type)}
                            {" "}
                            {item.fileName}
                        </div>

                        <div
                            style={{
                                marginTop:10,
                                color:"#64748b",
                                fontSize:13,
                            }}
                        >
                            Tür:
                            {" "}
                            {item.type}
                        </div>

                        <div
                            style={{
                                marginTop:4,
                                color:"#64748b",
                                fontSize:13,
                            }}
                        >
                            Ekleyen:
                            {" "}
                            {item.uploadedBy}
                        </div>

                        <div
                            style={{
                                marginTop:4,
                                color:"#64748b",
                                fontSize:13,
                            }}
                        >
                            {new Date(
                                item.uploadedAt
                            ).toLocaleString("tr-TR")}
                        </div>

                        <button
                            style={{
                                marginTop:18,
                            }}
                            onClick={()=>
                                remove(item.id)
                            }
                        >
                            Sil
                        </button>

                    </div>

                ))}

            </div>

        </div>

    );

}

function UploadButton({

    title,

    accept,

    type,

    onUpload,

}:any){

    return(

        <label
            style={{
                cursor:"pointer",
                padding:"12px 20px",
                background:"#2563eb",
                color:"#fff",
                borderRadius:12,
                fontWeight:700,
            }}
        >

            {title}

            <input
                hidden
                multiple
                type="file"
                accept={accept}
                onChange={(e)=>
                    onUpload(
                        e.target.files,
                        type
                    )
                }
            />

        </label>

    );

}

function icon(type:string){

    switch(type){

        case "PHOTO":

            return "📷";

        case "VIDEO":

            return "🎥";

        case "DOCUMENT":

            return "📄";

        case "AUDIO":

            return "🎤";

        default:

            return "📎";

    }

}