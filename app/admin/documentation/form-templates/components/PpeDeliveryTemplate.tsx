"use client";

import FormTemplateLayout from "./FormTemplateLayout";
import type { TemplateComponentProps } from "./types";

export default function PpeDeliveryTemplate({
  record,
  mode,
}: TemplateComponentProps) {
  return (
    <FormTemplateLayout
      record={record}
      mode={mode}
      formId="ppe-delivery-form"
      badge="İSG Formu"
      description="Çalışana teslim edilen kişisel koruyucu donanımların tür, özellik, miktar ve teslim tarihleriyle kayıt altına alınması için kullanılır."
    >
      <div className="standardPaper">
        <h2 className="formTitle">KİŞİSEL KORUYUCU DONANIM ZİMMET FORMU</h2>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">İŞYERİ VE ÇALIŞAN BİLGİLERİ</th></tr>
            <tr><td className="labelCell">İşyeri Ünvanı</td><td colSpan={3} /></tr>
            <tr><td className="labelCell">Çalışanın Adı Soyadı</td><td /><td className="labelCell">T.C. Kimlik No</td><td /></tr>
            <tr><td className="labelCell">Bölüm / Birim</td><td /><td className="labelCell">Görevi / Mesleği</td><td /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <thead>
            <tr>
              <th className="center">Sıra</th>
              <th>KKD Adı</th>
              <th>Standart / Özellik</th>
              <th>Marka / Model</th>
              <th className="center">Miktar</th>
              <th>Seri / Sicil No</th>
              <th>Teslim Tarihi</th>
              <th>Teslim Durumu</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index}>
                <td className="center">{index + 1}</td>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={2} className="sectionTitle">TESLİM VE KULLANIM BEYANI</th></tr>
            <tr><td className="labelCell">KKD Kullanım Eğitimi</td><td className="check">☐ Verildi &nbsp;&nbsp; ☐ Verilmedi</td></tr>
            <tr><td className="labelCell">Kullanım Talimatı</td><td className="check">☐ Teslim edildi &nbsp;&nbsp; ☐ Teslim edilmedi</td></tr>
            <tr>
              <td colSpan={2} className="largeBlank smallText">
                Yukarıda belirtilen kişisel koruyucu donanımları eksiksiz ve kullanıma uygun olarak teslim aldım. Donanımları eğitim ve talimatlara uygun kullanacağımı, koruyacağımı; kayıp, hasar veya uygunsuzluk durumunda işverene derhal bildireceğimi kabul ve beyan ederim.
              </td>
            </tr>
            <tr><td className="labelCell">Açıklama / Not</td><td className="largeBlank" /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={2} className="sectionTitle">TESLİM ONAYI</th></tr>
            <tr><td className="signatureBox center">TESLİM ALAN ÇALIŞAN<br/><br/>Ad Soyad / Tarih / İmza</td><td className="signatureBox center">TESLİM EDEN<br/><br/>Ad Soyad / Görev / Tarih / İmza</td></tr>
          </tbody>
        </table>

        <p className="footerNote">Teslim edilen KKD’nin yenilenmesi, bakım ve değişim gerekliliği işyerindeki risk değerlendirmesi, üretici talimatları ve kullanım koşullarına göre takip edilir.</p>
      </div>
    </FormTemplateLayout>
  );
}
