"use client";

interface Props {
    value: any;
    onChange(value: any): void;
}

export default function IncidentPhotoTab({

    value,

    onChange,

}: Props) {

    const photos = value.photos ?? [];

    function add(files: FileList | null) {

        if (!files) return;

        const list = [...photos];

        Array.from(files).forEach(file => {

            list.push({

                id: crypto.randomUUID(),

                name: file.name,

                size: file.size,

                type: file.type,

                file,

                preview: URL.createObjectURL(file),

                uploadedAt: new Date().toISOString()

            });

        });

        onChange({

            ...value,

            photos: list

        });

    }

    function remove(id: string) {

        onChange({

            ...value,

            photos: photos.filter((x: any) => x.id !== id)

        });

    }

    return (

        <div>

            <label
                style={{
                    display: "inline-block",
                    padding: "12px 20px",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: 10,
                    cursor: "pointer"
                }}
            >
                Fotoğraf Yükle

                <input
                    hidden
                    multiple
                    accept="image/*"
                    type="file"
                    onChange={(e) => add(e.target.files)}
                />

            </label>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                    gap: 16,
                    marginTop: 24
                }}
            >

                {photos.map((photo: any) => (

                    <div
                        key={photo.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            overflow: "hidden"
                        }}
                    >

                        <img
                            src={photo.preview}
                            style={{
                                width: "100%",
                                height: 150,
                                objectFit: "cover"
                            }}
                        />

                        <div style={{ padding: 10 }}>

                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    wordBreak: "break-word"
                                }}
                            >
                                {photo.name}
                            </div>

                            <div
                                style={{
                                    marginTop: 6,
                                    color: "#666",
                                    fontSize: 12
                                }}
                            >
                                {(photo.size / 1024).toFixed(1)} KB
                            </div>

                            <button
                                style={{
                                    marginTop: 10
                                }}
                                onClick={() => remove(photo.id)}
                            >
                                Sil
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}