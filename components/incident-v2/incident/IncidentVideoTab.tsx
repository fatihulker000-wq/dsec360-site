"use client";

interface Props {
    value: any;
    onChange(value: any): void;
}

export default function IncidentVideoTab({

    value,

    onChange,

}: Props) {

    const videos = value.videos ?? [];

    function add(files: FileList | null) {

        if (!files) return;

        const list = [...videos];

        Array.from(files).forEach(file => {

            list.push({

                id: crypto.randomUUID(),

                name: file.name,

                size: file.size,

                type: file.type,

                preview: URL.createObjectURL(file),

                file,

                uploadedAt: new Date().toISOString()

            });

        });

        onChange({

            ...value,

            videos: list

        });

    }

    function remove(id: string) {

        onChange({

            ...value,

            videos: videos.filter((x: any) => x.id !== id)

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

                Video Yükle

                <input
                    hidden
                    multiple
                    type="file"
                    accept="video/*"
                    onChange={(e) => add(e.target.files)}
                />

            </label>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fill,minmax(260px,1fr))",
                    gap: 20,
                    marginTop: 24
                }}
            >

                {videos.map((video: any) => (

                    <div
                        key={video.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            overflow: "hidden"
                        }}
                    >

                        <video
                            src={video.preview}
                            controls
                            style={{
                                width: "100%",
                                height: 180,
                                background: "#000"
                            }}
                        />

                        <div style={{ padding: 12 }}>

                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    wordBreak: "break-word"
                                }}
                            >
                                {video.name}
                            </div>

                            <div
                                style={{
                                    marginTop: 6,
                                    color: "#666",
                                    fontSize: 12
                                }}
                            >
                                {(video.size / 1024 / 1024).toFixed(2)} MB
                            </div>

                            <button
                                style={{
                                    marginTop: 12
                                }}
                                onClick={() => remove(video.id)}
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