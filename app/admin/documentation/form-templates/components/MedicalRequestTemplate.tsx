"use client";

import FormTemplateLayout from "./FormTemplateLayout";
import type { TemplateComponentProps } from "./types";

export default function MedicalRequestTemplate({
  record,
  mode,
}: TemplateComponentProps) {
  return (
    <FormTemplateLayout
      record={record}
      mode={mode}
      formId="medical-request-form"
      badge="Sağlık Formu"
      description="İşyeri hekiminin çalışan için gerekli laboratuvar, radyolojik ve fizyolojik tetkikleri talep etmesi amacıyla kullanılır."
    >
      <div className="standardPaper">
        <h2 className="formTitle">TETKİK İSTEK FORMU</h2>
        <p className="formSubTitle">İşyeri hekimi sağlık gözetimi tetkik talebi</p>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">İŞYERİ VE ÇALIŞAN BİLGİLERİ</th></tr>
            <tr><td className="labelCell">İşyeri Ünvanı</td><td colSpan={3} /></tr>
            <tr><td className="labelCell">Çalışanın Adı Soyadı</td><td /><td className="labelCell">T.C. Kimlik No</td><td /></tr>
            <tr><td className="labelCell">Bölüm / Birim</td><td /><td className="labelCell">Görevi / Mesleği</td><td /></tr>
            <tr><td className="labelCell">İstek Tarihi</td><td /><td className="labelCell">Öncelik</td><td className="check">☐ Rutin &nbsp; ☐ Öncelikli &nbsp; ☐ Acil</td></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">İSTENEN TETKİKLER</th></tr>
            <tr><td className="check">☐ Hemogram</td><td className="check">☐ Biyokimya</td><td className="check">☐ Tam İdrar Tetkiki</td><td className="check">☐ Karaciğer Fonksiyonları</td></tr>
            <tr><td className="check">☐ Böbrek Fonksiyonları</td><td className="check">☐ Hepatit Tetkikleri</td><td className="check">☐ Akciğer Grafisi</td><td className="check">☐ EKG</td></tr>
            <tr><td className="check">☐ Odyometri</td><td className="check">☐ Solunum Fonksiyon Testi</td><td className="check">☐ Göz Muayenesi</td><td className="check">☐ Psikolojik Değerlendirme</td></tr>
            <tr><td className="labelCell">Diğer Tetkikler</td><td colSpan={3} className="largeBlank" /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={2} className="sectionTitle">KLİNİK BİLGİLER</th></tr>
            <tr><td className="labelCell">Ön Tanı / İstek Nedeni</td><td className="xLargeBlank" /></tr>
            <tr><td className="labelCell">Klinik Bilgi / Açıklama</td><td className="xLargeBlank" /></tr>
            <tr><td className="labelCell">Özel Not / Dikkat Edilecek Husus</td><td className="largeBlank" /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={3} className="sectionTitle">TALEP EDEN İŞYERİ HEKİMİ</th></tr>
            <tr><td className="labelCell">Adı Soyadı</td><td /><td rowSpan={3} className="signatureBox center">Kaşe / İmza</td></tr>
            <tr><td className="labelCell">Belge No</td><td /></tr>
            <tr><td className="labelCell">Tarih</td><td /></tr>
          </tbody>
        </table>

        <p className="footerNote">Tetkik sonuçları, çalışanın sağlık dosyasında gizlilik kurallarına uygun biçimde muhafaza edilir.</p>
      </div>
    </FormTemplateLayout>
  );
}
