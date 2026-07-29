"use client";

import { useEffect, useMemo, useState } from "react";

import {
    Save,
    Loader2,
    FileText,
    Building2,
    Calendar,
    User,
    ClipboardList
} from "lucide-react";

import DocumentUploader from "./DocumentUploader";

import {
    DOCUMENTATION_CATEGORIES,
    DOCUMENTATION_STATUSES,
    createEmptyDocumentForm
} from "./constants";

import type {
    DocumentFormData,
    DocumentFormErrors,
    UploadResult
} from "./types";

interface Props {

    firmId: string;

    initialData?: Partial<DocumentFormData>;

    loading?: boolean;

    onSubmit: (
        data: DocumentFormData
    ) => Promise<void>;

    onCancel: () => void;
}

export default function DocumentForm({

    firmId,

    initialData,

    loading = false,

    onSubmit,

    onCancel

}: Props) {

    const [form, setForm] =
        useState<DocumentFormData>(

            createEmptyDocumentForm(firmId)

        );

    const [errors, setErrors] =
        useState<DocumentFormErrors>({});

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {

        const base =
            createEmptyDocumentForm(firmId);

        setForm({

            ...base,

            ...initialData,

            firmId

        });

    }, [

        firmId,

        initialData

    ]);

    const updateField = <K extends keyof DocumentFormData>(

        key: K,

        value: DocumentFormData[K]

    ) => {

        setForm(prev => ({

            ...prev,

            [key]: value

        }));

    };

    const validate = () => {

        const e: DocumentFormErrors = {};

        if (!form.title.trim())
            e.title = "Doküman adı zorunlu.";

        if (!form.documentNo.trim())
            e.documentNo = "Doküman numarası zorunlu.";

        if (!form.category)
            e.category = "Kategori seçiniz.";

        if (!form.preparedBy.trim())
            e.preparedBy = "Hazırlayan bilgisi zorunlu.";

        if (!form.approvedBy.trim())
            e.approvedBy = "Onaylayan bilgisi zorunlu.";

        if (!form.publishedAt)
            e.publishedAt = "Yayın tarihi seçiniz.";

        if (

            form.validUntil &&

            form.publishedAt &&

            form.validUntil < form.publishedAt

        ) {

            e.validUntil =
                "Geçerlilik tarihi yayın tarihinden önce olamaz.";

        }

        if (!form.file) {

            e.file =
                "Doküman dosyası yüklenmelidir.";

        }

        setErrors(e);

        return Object.keys(e).length === 0;

    };

    const categoryOptions = useMemo(

        () => DOCUMENTATION_CATEGORIES,

        []

    );

    const statusOptions = useMemo(

        () => DOCUMENTATION_STATUSES,

        []

    );
        const handleFileChange = (
        file: UploadResult | null
    ) => {

        updateField("file", file);

        if (file) {

            setErrors(prev => ({

                ...prev,

                file: undefined

            }));

        }

    };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (saving || loading)
            return;

        if (!validate())
            return;

        try {

            setSaving(true);

            await onSubmit(form);

        }

        catch (err) {

            console.error(err);

            setErrors(prev => ({

                ...prev,

                general:

                    err instanceof Error
                        ? err.message
                        : "Doküman kaydedilemedi."

            }));

        }

        finally {

            setSaving(false);

        }

    };

    const handleInput = (

        key: keyof DocumentFormData

    ) => (

        e: React.ChangeEvent<

            HTMLInputElement |

            HTMLTextAreaElement

        >

    ) => {

        updateField(

            key,

            e.target.value as any

        );

        setErrors(prev => ({

            ...prev,

            [key]: undefined,

            general: undefined

        }));

    };

    const handleSelect = (

        key: keyof DocumentFormData

    ) => (

        e: React.ChangeEvent<HTMLSelectElement>

    ) => {

        updateField(

            key,

            e.target.value as any

        );

        setErrors(prev => ({

            ...prev,

            [key]: undefined,

            general: undefined

        }));

    };

    const submitDisabled =

        saving ||

        loading;

    const saveText =

        saving

            ? "Kaydediliyor..."

            : "Dokümanı Kaydet";
                return (
        <form
            onSubmit={handleSubmit}
            className="documentForm"
        >

            {errors.general && (
                <div className="alert error">
                    {errors.general}
                </div>
            )}

            {/* GENEL BİLGİLER */}

            <section className="card">

                <div className="cardTitle">
                    <Building2 size={20} />
                    Genel Bilgiler
                </div>

                <div className="grid2">

                    <div className="field">
                        <label>Doküman Adı *</label>

                        <input
                            value={form.title}
                            onChange={handleInput("title")}
                        />

                        {errors.title && (
                            <small>{errors.title}</small>
                        )}
                    </div>

                    <div className="field">
                        <label>Doküman No *</label>

                        <input
                            value={form.documentNo}
                            onChange={handleInput("documentNo")}
                        />

                        {errors.documentNo && (
                            <small>{errors.documentNo}</small>
                        )}
                    </div>

                    <div className="field">
                        <label>Kategori *</label>

                        <select
                            value={form.category}
                            onChange={handleSelect("category")}
                        >
                            {categoryOptions.map(item => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label>Departman</label>

                        <input
                            value={form.department}
                            onChange={handleInput("department")}
                        />
                    </div>

                </div>

            </section>

            {/* REVİZYON */}

            <section className="card">

                <div className="cardTitle">
                    <ClipboardList size={20} />
                    Revizyon Bilgileri
                </div>

                <div className="grid2">

                    <div className="field">
                        <label>Revizyon No</label>

                        <input
                            value={form.revisionNo}
                            onChange={handleInput("revisionNo")}
                        />
                    </div>

                    <div className="field">
                        <label>Revizyon Nedeni</label>

                        <input
                            value={form.revisionReason}
                            onChange={handleInput("revisionReason")}
                        />
                    </div>

                    <div className="field">
                        <label>Yayın Tarihi *</label>

                        <input
                            type="date"
                            value={form.publishedAt}
                            onChange={handleInput("publishedAt")}
                        />

                        {errors.publishedAt && (
                            <small>{errors.publishedAt}</small>
                        )}
                    </div>

                    <div className="field">
                        <label>Geçerlilik Tarihi</label>

                        <input
                            type="date"
                            value={form.validUntil}
                            onChange={handleInput("validUntil")}
                        />

                        {errors.validUntil && (
                            <small>{errors.validUntil}</small>
                        )}
                    </div>

                </div>

            </section>

            {/* SORUMLULAR */}

            <section className="card">

                <div className="cardTitle">
                    <User size={20} />
                    Sorumlular
                </div>

                <div className="grid3">

                    <div className="field">
                        <label>Hazırlayan *</label>

                        <input
                            value={form.preparedBy}
                            onChange={handleInput("preparedBy")}
                        />

                        {errors.preparedBy && (
                            <small>{errors.preparedBy}</small>
                        )}
                    </div>

                    <div className="field">
                        <label>Kontrol Eden</label>

                        <input
                            value={form.controlledBy}
                            onChange={handleInput("controlledBy")}
                        />
                    </div>

                    <div className="field">
                        <label>Onaylayan *</label>

                        <input
                            value={form.approvedBy}
                            onChange={handleInput("approvedBy")}
                        />

                        {errors.approvedBy && (
                            <small>{errors.approvedBy}</small>
                        )}
                    </div>

                </div>

            </section>

            {/* DOSYA */}

            <section className="card">

                <div className="cardTitle">
                    <FileText size={20} />
                    Doküman Dosyası
                </div>

                <DocumentUploader
                    firmId={firmId}
                    value={form.file}
                    onChange={handleFileChange}
                    error={errors.file}
                    required
                />

            </section>

            {/* AÇIKLAMA */}

            <section className="card">

                <div className="cardTitle">
                    <Calendar size={20} />
                    Açıklama
                </div>

                <textarea
                    rows={5}
                    value={form.description}
                    onChange={handleInput("description")}
                />

            </section>

            {/* BUTONLAR */}

            <div className="actions">

                <button
                    type="button"
                    className="cancel"
                    onClick={onCancel}
                    disabled={submitDisabled}
                >
                    İptal
                </button>

                <button
                    type="submit"
                    className="save"
                    disabled={submitDisabled}
                >
                    {saving ? (
                        <Loader2
                            size={18}
                            className="spin"
                        />
                    ) : (
                        <Save size={18} />
                    )}

                    {saveText}
                </button>

            </div>

            <style jsx>{`
                .documentForm{
                    display:grid;
                    gap:20px;
                }

                .card{
                    background:#fff;
                    border:1px solid #e5e7eb;
                    border-radius:16px;
                    padding:22px;
                }

                .cardTitle{
                    display:flex;
                    align-items:center;
                    gap:8px;
                    margin-bottom:18px;
                    font-weight:700;
                    color:#111827;
                }

                .grid2{
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:18px;
                }

                .grid3{
                    display:grid;
                    grid-template-columns:repeat(3,1fr);
                    gap:18px;
                }

                .field{
                    display:flex;
                    flex-direction:column;
                    gap:6px;
                }

                label{
                    font-size:13px;
                    font-weight:600;
                    color:#374151;
                }

                input,
                select,
                textarea{
                    border:1px solid #d1d5db;
                    border-radius:10px;
                    padding:11px 14px;
                    font-size:14px;
                    outline:none;
                }

                input:focus,
                select:focus,
                textarea:focus{
                    border-color:#991b1b;
                }

                small{
                    color:#dc2626;
                    font-size:12px;
                    font-weight:600;
                }

                .actions{
                    display:flex;
                    justify-content:flex-end;
                    gap:12px;
                }

                .cancel{
                    padding:12px 22px;
                    border-radius:10px;
                    border:1px solid #d1d5db;
                    background:#fff;
                    cursor:pointer;
                }

                .save{
                    display:flex;
                    align-items:center;
                    gap:8px;
                    padding:12px 22px;
                    border:none;
                    border-radius:10px;
                    background:#991b1b;
                    color:#fff;
                    font-weight:700;
                    cursor:pointer;
                }

                .alert.error{
                    padding:12px;
                    border-radius:10px;
                    background:#fee2e2;
                    color:#991b1b;
                    font-weight:600;
                }

                .spin{
                    animation:spin .8s linear infinite;
                }

                @keyframes spin{
                    to{
                        transform:rotate(360deg);
                    }
                }

                @media(max-width:900px){
                    .grid2,
                    .grid3{
                        grid-template-columns:1fr;
                    }
                }
            `}</style>

        </form>
    );
}