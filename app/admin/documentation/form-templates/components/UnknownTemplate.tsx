"use client";

import FormTemplateLayout from "./FormTemplateLayout";
import type { TemplateComponentProps } from "./types";

export default function UnknownTemplate({
  record,
  mode,
}: TemplateComponentProps) {
  return (
    <FormTemplateLayout
      record={record}
      mode={mode}
      formId="unknown-template-form"
      badge="Form Şablonu"
      description="Bu şablon için özel A4 görünümü henüz tanımlanmadı."
    >
      <div className="standardPaper">
        <h2 className="formTitle">{record.title}</h2>
        <table className="formTable">
          <tbody>
            <tr><th className="sectionTitle">ŞABLON BİLGİSİ</th></tr>
            <tr><td className="xLargeBlank center">Bu formun özel görünümü hazırlanacaktır.</td></tr>
          </tbody>
        </table>
      </div>
    </FormTemplateLayout>
  );
}
