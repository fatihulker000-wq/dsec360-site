"use client";

import FormTemplateLayout from "./FormTemplateLayout";
import type { TemplateComponentProps } from "./types";

export default function ReturnToWorkTemplate({
  record,
  mode,
}: TemplateComponentProps) {
  return (
    <FormTemplateLayout
      record={record}
      mode={mode}
      formId="return-to-work-form"
      badge="Sağlık Formu"
      description="İş kazası, hastalık, ameliyat veya uzun süreli rapor sonrasında çalışanın işe dönüş uygunluğunun işyeri hekimi tarafından değerlendirilmesi için kullanılır."
    >
      <div className="standardPaper">
        <h2 className="formTitle">İŞE DÖNÜŞ MUAYENE FORMU</h2>
        <p className="formSubTitle">Çalışanın işe dönüş uygunluk değerlendirmesi</p>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">İŞYERİ BİLGİLERİ</th></tr>
            <tr><td className="labelCell">İşyeri Ünvanı</td><td colSpan={3} /></tr>
            <tr><td className="labelCell">SGK Sicil No</td><td /><td className="labelCell">Değerlendirme Tarihi</td><td /></tr>
            <tr><td className="labelCell">İşyeri Adresi</td><td colSpan={3} className="blankCell" /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">ÇALIŞAN BİLGİLERİ</th></tr>
            <tr><td className="labelCell">Adı Soyadı</td><td /><td className="labelCell">T.C. Kimlik No</td><td /></tr>
            <tr><td className="labelCell">Bölüm / Birim</td><td /><td className="labelCell">Görevi / Mesleği</td><td /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">İŞE ARA VERME BİLGİLERİ</th></tr>
            <tr><td className="labelCell">İşe Ara Verme Nedeni</td><td colSpan={3} className="check">☐ İş Kazası &nbsp; ☐ Hastalık &nbsp; ☐ Ameliyat &nbsp; ☐ Uzun Süreli Rapor &nbsp; ☐ Diğer</td></tr>
            <tr><td className="labelCell">Başlangıç Tarihi</td><td /><td className="labelCell">Toplam Süre (Gün)</td><td /></tr>
            <tr><td className="labelCell">Tanı / Tedavi / Rapor Özeti</td><td colSpan={3} className="largeBlank" /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={2} className="sectionTitle">TIBBİ DEĞERLENDİRME</th></tr>
            <tr><td className="labelCell">Mevcut Yakınmalar</td><td className="largeBlank" /></tr>
            <tr><td className="labelCell">Fizik Muayene Bulguları</td><td className="largeBlank" /></tr>
            <tr><td className="labelCell">İstenen Tetkikler</td><td className="blankCell" /></tr>
            <tr><td className="labelCell">Tetkik Sonuçları</td><td className="largeBlank" /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={2} className="sectionTitle">İŞE DÖNÜŞ KANAATİ</th></tr>
            <tr><td colSpan={2} className="check">☐ Eski işinde çalışabilir &nbsp; ☐ Kısıtlı/şartlı çalışabilir &nbsp; ☐ Geçici olarak çalışamaz &nbsp; ☐ Başka işte çalışabilir &nbsp; ☐ İleri değerlendirme gerekli</td></tr>
            <tr><td className="labelCell">Kısıtlama / Şart / Öneri</td><td className="largeBlank" /></tr>
            <tr><td className="labelCell">Kontrol Tarihi</td><td /></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={3} className="sectionTitle">ONAY</th></tr>
            <tr><td className="signatureBox center">Çalışan<br/><br/>Ad Soyad / İmza</td><td className="signatureBox center">İşyeri Hekimi<br/><br/>Ad Soyad / Kaşe / İmza</td><td className="signatureBox center">Tarih</td></tr>
          </tbody>
        </table>
      </div>
    </FormTemplateLayout>
  );
}
