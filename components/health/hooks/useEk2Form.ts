"use client";

import { useState } from "react";

export type Ek2FormData = {
  examType: string;
  examDate: string;
  doctorName: string;
};

const initialForm: Ek2FormData = {
  examType: "İşe Giriş",
  examDate: "",
  doctorName: "",
};

export function useEk2Form() {
  const [form, setForm] = useState<Ek2FormData>(initialForm);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  function updateField<K extends keyof Ek2FormData>(
    field: K,
    value: Ek2FormData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSaved(false);
  }

  async function save() {
    try {
      setSaving(true);

      // Burada ileride API çağrısı yapılacak.

      await new Promise((resolve) => setTimeout(resolve, 500));

      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    updateField,
    save,
    saving,
    saved,
  };
}