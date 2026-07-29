"use client";

import {
    AlertCircle,
    CheckCircle2,
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    Loader2,
    Trash2,
    UploadCloud
} from "lucide-react";

import {
    ChangeEvent,
    DragEvent,
    useCallback,
    useRef,
    useState
} from "react";

import {
    DEFAULT_DOCUMENT_MAX_SIZE_MB,
    DOCUMENT_UPLOAD_ACCEPT,
    DOCUMENT_UPLOAD_EXTENSIONS,
    DOCUMENT_UPLOAD_MIME_TYPES
} from "./constants";

import type {
    DocumentUploaderProps,
    UploadResult
} from "./types";

interface UploadApiFileData {
    storagePath?: string;
    filePath?: string;
    path?: string;

    fileUrl?: string;
    publicUrl?: string;
    url?: string;

    originalFileName?: string;
    originalName?: string;
    fileName?: string;
    name?: string;

    storedFileName?: string;
    uploadedFileName?: string;

    mimeType?: string;
    type?: string;

    fileSize?: number;
    size?: number;

    extension?: string;
}

interface UploadApiResponse {
    success?: boolean;
    data?: UploadApiFileData;
    file?: UploadApiFileData;
    error?: string;
    message?: string;
}

function getExtension(fileName: string) {

    return fileName
        .split(".")
        .pop()
        ?.toLowerCase()
        .trim() || "";
}

function formatSize(size: number) {

    if (size < 1024)
        return `${size} B`;

    if (size < 1024 * 1024)
        return `${Math.round(size / 1024)} KB`;

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildUploadResult(
    response: UploadApiResponse,
    selectedFile: File
): UploadResult {
    const uploaded = response.data ?? response.file ?? {};

    const storagePath =
        uploaded.storagePath ??
        uploaded.filePath ??
        uploaded.path ??
        "";

    const fileUrl =
        uploaded.fileUrl ??
        uploaded.publicUrl ??
        uploaded.url ??
        "";

    const originalFileName =
        uploaded.originalFileName ??
        uploaded.originalName ??
        uploaded.name ??
        selectedFile.name;

    const storedFileName =
        uploaded.storedFileName ??
        uploaded.uploadedFileName ??
        uploaded.fileName ??
        storagePath.split("/").pop() ??
        selectedFile.name;

    const mimeType =
        uploaded.mimeType ??
        uploaded.type ??
        selectedFile.type ??
        "application/octet-stream";

    const fileSize =
        uploaded.fileSize ??
        uploaded.size ??
        selectedFile.size;

    const extension =
        uploaded.extension ??
        getExtension(originalFileName);

    if (!storagePath) {
        throw new Error(
            "Dosya yüklendi ancak depolama yolu API tarafından döndürülmedi."
        );
    }

    if (!fileUrl) {
        throw new Error(
            "Dosya yüklendi ancak dosya adresi API tarafından döndürülmedi."
        );
    }

    return {
        storagePath,
        fileUrl,
        originalFileName,
        storedFileName,
        mimeType,
        fileSize,
        extension
    };
}

function getIcon(
    mimeType: string,
    extension: string
) {

    if (
        mimeType.startsWith("image/")
    ) {

        return <FileImage size={28} />;
    }

    if (
        extension === "pdf"
    ) {

        return <FileText size={28} />;
    }

    if (
        extension === "xls" ||
        extension === "xlsx"
    ) {

        return <FileSpreadsheet size={28} />;
    }

    if (
        extension === "doc" ||
        extension === "docx"
    ) {

        return <FileText size={28} />;
    }

    return <File size={28} />;
}

export default function DocumentUploader({

    firmId,

    value,

    onChange,

    disabled = false,

    required = false,

    error,

    maxSizeMb = DEFAULT_DOCUMENT_MAX_SIZE_MB

}: DocumentUploaderProps) {

    const inputRef =
        useRef<HTMLInputElement>(null);

    const [dragging, setDragging] =
        useState(false);

    const [uploading, setUploading] =
        useState(false);

    const [progress, setProgress] =
        useState(0);

    const [localError, setLocalError] =
        useState("");

    const validateFile = useCallback(

        (file: File) => {

            const extension =
                getExtension(file.name);

            if (
                !DOCUMENT_UPLOAD_EXTENSIONS.includes(
                    extension as any
                )
            ) {

                throw new Error(
                    "Desteklenmeyen dosya uzantısı."
                );
            }

            if (

                file.type &&

                !DOCUMENT_UPLOAD_MIME_TYPES.includes(
                    file.type as any
                )

            ) {

                throw new Error(
                    "Dosya tipi desteklenmiyor."
                );
            }

            const maxSize =
                maxSizeMb * 1024 * 1024;

            if (
                file.size > maxSize
            ) {

                throw new Error(
                    `Dosya en fazla ${maxSizeMb} MB olabilir.`
                );
            }

            if (!firmId) {

                throw new Error(
                    "Önce firma seçiniz."
                );
            }

        },

        [
            firmId,
            maxSizeMb
        ]
    );
        const uploadFile = useCallback(

        async (file: File) => {

            try {

                validateFile(file);

                setUploading(true);

                setProgress(5);

                setLocalError("");

                const formData = new FormData();

                formData.append(
                    "file",
                    file
                );

                formData.append(
                    "firmId",
                    firmId
                );

                const timer = window.setInterval(() => {

                    setProgress((current) => {

                        if (current >= 90)
                            return current;

                        return current + 5;

                    });

                }, 180);

                try {

                    const response =
                        await fetch(

                            "/api/admin/documentation/upload",

                            {

                                method: "POST",

                                credentials: "include",

                                body: formData

                            }

                        );

                    const json: UploadApiResponse =
                        await response
                            .json()
                            .catch(() => ({}));

                    if (
                        !response.ok ||
                        json.success === false
                    ) {

                        throw new Error(

                            json.error ||

                            json.message ||

                            "Dosya yüklenemedi."

                        );
                    }

                    const uploadResult =
                        buildUploadResult(
                            json,
                            file
                        );

                    setProgress(100);

                    onChange(uploadResult);

                } finally {

                    clearInterval(timer);

                }

            }

            catch (err) {

                console.error(err);

                setProgress(0);

                setLocalError(

                    err instanceof Error

                        ? err.message

                        : "Dosya yüklenemedi."

                );

            }

            finally {

                setUploading(false);

            }

        },

        [

            firmId,

            onChange,

            validateFile

        ]

    );

    const handleInput = async (

        e: ChangeEvent<HTMLInputElement>

    ) => {

        const file =

            e.target.files?.[0];

        e.target.value = "";

        if (!file)
            return;

        await uploadFile(file);

    };

    const handleDrop = async (

        e: DragEvent<HTMLDivElement>

    ) => {

        e.preventDefault();

        e.stopPropagation();

        setDragging(false);

        if (
            disabled ||
            uploading
        ) return;

        const file =
            e.dataTransfer.files?.[0];

        if (!file)
            return;

        await uploadFile(file);

    };

    const removeFile = () => {

        if (
            disabled ||
            uploading
        ) return;

        setProgress(0);

        setLocalError("");

        onChange(null);

    };

    const visibleError =

        localError ||

        error ||

        "";

const safeExtension =
    value?.extension?.trim() ||
    getExtension(
        value?.originalFileName ?? ""
    );

const icon =
    value
        ? getIcon(
              value.mimeType,
              safeExtension
          )
        : null;

    const extension =
    value?.extension ??
    getExtension(value?.originalFileName ?? "");
                return (
        <div className="documentUploader">

            <input
                ref={inputRef}
                type="file"
                accept={DOCUMENT_UPLOAD_ACCEPT}
                style={{ display: "none" }}
                disabled={disabled || uploading}
                onChange={handleInput}
            />

            {!value ? (

                <div
                    className={`dropZone ${dragging ? "dragging" : ""} ${visibleError ? "error" : ""}`}
                    onClick={() => {
                        if (!disabled && !uploading) {
                            inputRef.current?.click();
                        }
                    }}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        if (!disabled) setDragging(true);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled) setDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setDragging(false);
                    }}
                    onDrop={handleDrop}
                >

                    <div className="uploadIcon">

                        {uploading ? (
                            <Loader2
                                size={34}
                                className="spin"
                            />
                        ) : (
                            <UploadCloud
                                size={34}
                            />
                        )}

                    </div>

                    <h3>

                        {uploading
                            ? "Dosya yükleniyor..."
                            : "Dosyayı buraya bırakın"}

                    </h3>

                    <p>

                        veya tıklayarak seçin

                    </p>

                    <small>

                        PDF • WORD • EXCEL • JPG • PNG

                    </small>

                    {required && (
                        <div className="required">
                            *
                        </div>
                    )}

                    {uploading && (

                        <>

                            <div className="progress">

                                <div
                                    style={{
                                        width: `${progress}%`
                                    }}
                                />

                            </div>

                            <b>

                                %{progress}

                            </b>

                        </>

                    )}

                </div>

            ) : (

                <div className="fileCard">

                    <div className="icon">

                        {icon}

                    </div>

                    <div className="content">

                        <strong>

                            {value.originalFileName}

                        </strong>

                        <span>

                            {safeExtension
    ? safeExtension.toUpperCase()
    : "DOSYA"}{" "}
• {formatSize(value.fileSize)}

                        </span>

                        <small>

                            <CheckCircle2
                                size={14}
                            />

                            Dosya yüklendi

                        </small>

                    </div>

                    <button

                        type="button"

                        onClick={removeFile}

                        disabled={
                            disabled ||
                            uploading
                        }

                    >

                        <Trash2
                            size={18}
                        />

                    </button>

                </div>

            )}

            {visibleError && (

                <div className="errorBox">

                    <AlertCircle
                        size={16}
                    />

                    {visibleError}

                </div>

            )}

            <style jsx>{`

.documentUploader{
display:grid;
gap:12px;
width:100%;
}

.dropZone{
min-height:220px;
border:2px dashed #d1d5db;
border-radius:20px;
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
background:#fafafa;
cursor:pointer;
transition:.25s;
padding:24px;
text-align:center;
}

.dropZone:hover{
border-color:#991b1b;
background:#fff5f5;
}

.dragging{
border-color:#991b1b;
background:#fff1f2;
}

.error{
border-color:#dc2626;
}

.uploadIcon{
width:64px;
height:64px;
border-radius:18px;
background:#ffe4e6;
display:flex;
justify-content:center;
align-items:center;
color:#991b1b;
margin-bottom:14px;
}

.progress{
width:320px;
height:8px;
margin-top:16px;
border-radius:50px;
overflow:hidden;
background:#e5e7eb;
}

.progress div{
height:100%;
background:linear-gradient(90deg,#991b1b,#ea580c);
transition:.2s;
}

.fileCard{
display:grid;
grid-template-columns:60px 1fr 44px;
gap:14px;
padding:16px;
border-radius:18px;
border:1px solid #e5e7eb;
background:#fff;
align-items:center;
}

.icon{
width:52px;
height:52px;
display:flex;
justify-content:center;
align-items:center;
border-radius:14px;
background:#fff1f2;
color:#991b1b;
}

.content strong{
display:block;
font-size:15px;
font-weight:700;
overflow:hidden;
white-space:nowrap;
text-overflow:ellipsis;
}

.content span{
display:block;
font-size:13px;
margin-top:5px;
color:#6b7280;
}

.content small{
display:flex;
align-items:center;
gap:6px;
margin-top:8px;
color:#16a34a;
font-weight:600;
}

.fileCard button{
width:40px;
height:40px;
border:none;
border-radius:12px;
background:#fee2e2;
color:#b91c1c;
cursor:pointer;
}

.fileCard button:hover{
background:#fecaca;
}

.errorBox{
display:flex;
align-items:center;
gap:8px;
font-size:13px;
color:#dc2626;
font-weight:600;
}

.required{
margin-top:8px;
font-size:18px;
font-weight:700;
color:#dc2626;
}

.spin{
animation:spin .8s linear infinite;
}

@keyframes spin{
to{
transform:rotate(360deg);
}

}

            `}</style>

        </div>

    );

}