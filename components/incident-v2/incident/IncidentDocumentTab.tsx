"use client";

interface Props {
    value: any;
    onChange(value: any): void;
}

export default function IncidentDocumentTab({

    value,

    onChange,

}: Props) {

    const documents = value.documents ?? [];

    function add(files: FileList | null) {

        if (!files) return;

        const list = [...documents];

        Array.from(files).forEach(file => {

            list.push({

                id: crypto.randomUUID(),

                name: file.name,

                type: file.type,

                size: file.size,

                uploadedAt: new Date().toISOString(),

                file

            });

        });

        onChange({

            ...value,

            documents: list

        });

    }

    function remove(id: string) {

        onChange({

            ...value,

            documents:

                documents.filter(
                    (x: any) => x.id !== id
                )

        });

    }

    return (

        <div>

            <label
                style={{

                    display:"inline-block",

                    padding:"12px 22px",

                    background:"#2563eb",

                    color:"#fff",

                    borderRadius:10,

                    cursor:"pointer"

                }}
            >

                Belge Yükle

                <input

                    hidden

                    multiple

                    type="file"

                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"

                    onChange={(e)=>

                        add(e.target.files)

                    }

                />

            </label>

            <table

                style={{

                    width:"100%",

                    marginTop:24,

                    borderCollapse:"collapse"

                }}

            >

                <thead>

                    <tr>

                        <th>Dosya</th>

                        <th>Tür</th>

                        <th>Boyut</th>

                        <th>Tarih</th>

                        <th></th>

                    </tr>

                </thead>

                <tbody>

                    {documents.map((doc:any)=>(

                        <tr key={doc.id}>

                            <td>{doc.name}</td>

                            <td>{doc.type}</td>

                            <td>

                                {(doc.size/1024).toFixed(1)} KB

                            </td>

                            <td>

                                {new Date(doc.uploadedAt)
                                    .toLocaleString("tr-TR")}

                            </td>

                            <td>

                                <button

                                    onClick={()=>

                                        remove(doc.id)

                                    }

                                >

                                    Sil

                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}