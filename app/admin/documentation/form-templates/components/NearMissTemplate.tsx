"use client";

import FormTemplateLayout from "./FormTemplateLayout";
import type { TemplateComponentProps } from "./types";

export default function NearMissTemplate({
  record,
  mode,
}: TemplateComponentProps) {
  return (
    <FormTemplateLayout
      record={record}
      mode={mode}
      formId="near-miss-form"
      badge="İSG Formu"
      description="Yaralanma veya hasar meydana gelmeden atlatılan olayların bildirilmesi, nedenlerinin değerlendirilmesi ve aksiyonların planlanması için kullanılır."
    >
      <div className="standardPaper">
        <h2 className="formTitle">RAMAK KALA BİLDİRİM FORMU</h2>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">BİLDİRİM BİLGİLERİ</th></tr>
            <tr><td className="labelCell">Bildirim No</td><td /><td className="labelCell">Bildirim Tarihi</td><td /></tr>
            <tr><td className="labelCell">Bildirimi Yapan</td><td /><td className="labelCell">Bölüm / Birim</td><td /></tr>
            <tr><td className="labelCell">Bildirim Türü</td><td colSpan={3} className="check">☐ İsimli Bildirim &nbsp;&nbsp; ☐ İsimsiz Bildirim</td></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">RAMAK KALA OLAY BİLGİLERİ</th></tr>
            <tr><td className="labelCell">Olay Tarihi</td><td /><td className="labelCell">Olay Saati</td><td /></tr>
            <tr><td className="labelCell">Olay Yeri</td><td colSpan={3} /></tr>
            <tr><td className="labelCell">Olayın Ayrıntılı Açıklaması</td><td colSpan={3} className="xLargeBlank" /></tr>
            <tr><td className="labelCell">Gerçekleşmesi Muhtemel Sonuç</td><td colSpan={3} className="largeBlank" /></tr>
            <tr><td className="labelCell">Fotoğraf / Ek</td><td colSpan={3} className="largeBlank center">Fotoğraf veya ek belge alanı</td></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">TEHLİKE VE RİSK DEĞERLENDİRMESİ</th></tr>
            <tr><td className="labelCell">Tehlike Kaynağı</td><td colSpan={3} /></tr>
            <tr><td className="labelCell">Güvensiz Durum</td><td colSpan={3} className="largeBlank" /></tr>
            <tr><td className="labelCell">Güvensiz Davranış</td><td colSpan={3} className="largeBlank" /></tr>
            <tr><td className="labelCell">Olası Kök Neden</td><td colSpan={3} className="largeBlank" /></tr>
            <tr><td className="labelCell">Risk Seviyesi</td><td colSpan={3} className="check">☐ Düşük &nbsp; ☐ Orta &nbsp; ☐ Yüksek &nbsp; ☐ Çok Yüksek</td></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={4} className="sectionTitle">AKSİYON PLANI</th></tr>
            <tr><td className="labelCell">Hemen Alınan Önlem</td><td colSpan={3} className="largeBlank" /></tr>
            <tr><td className="labelCell">Planlanan Düzeltici Faaliyet</td><td colSpan={3} className="largeBlank" /></tr>
            <tr><td className="labelCell">Sorumlu Kişi</td><td /><td className="labelCell">Hedef Tarih</td><td /></tr>
            <tr><td className="labelCell">Aksiyon Durumu</td><td colSpan={3} className="check">☐ Açık &nbsp; ☐ Devam Ediyor &nbsp; ☐ Tamamlandı</td></tr>
          </tbody>
        </table>

        <table className="formTable">
          <tbody>
            <tr><th colSpan={2} className="sectionTitle">İNCELEME VE ONAY</th></tr>
            <tr><td className="labelCell">İnceleyen / İnceleme Tarihi</td><td /></tr>
            <tr><td className="labelCell">İnceleme Notu</td><td className="largeBlank" /></tr>
            <tr><td className="signatureBox center">Bildirimi Yapan<br/><br/>Ad Soyad / İmza</td><td className="signatureBox center">İnceleyen / Onaylayan<br/><br/>Ad Soyad / İmza</td></tr>
          </tbody>
        </table>
      </div>
    </FormTemplateLayout>
  );
}
