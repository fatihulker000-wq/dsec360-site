"use client";

import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  Printer,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

type FormTemplate = {
  id: string;
  template_code: string;
  title: string;
  short_title: string | null;
  version_no: number;
  revision_no: number;
  status: string;
};

type ApiResponse = {
  success?: boolean;
  record?: FormTemplate | null;
  error?: string;
  detail?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export default function Ek2OfficialFormPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = clean(params?.id);
  const mode = clean(
    searchParams.get("mode")
  );

  const [record, setRecord] =
    useState<FormTemplate | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      setError(
        "Form şablonu kimliği bulunamadı."
      );
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/documentation/form-templates?id=${encodeURIComponent(
            id
          )}`,
          {
            cache: "no-store",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

        const json =
          (await response
            .json()
            .catch(() => ({}))) as ApiResponse;

        if (!response.ok || !json.success) {
          throw new Error(
            json.detail ||
              json.error ||
              "Form şablonu alınamadı."
          );
        }

        if (!json.record) {
          throw new Error(
            "Form şablonu bulunamadı."
          );
        }

        setRecord(json.record);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Form şablonu alınamadı."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const printBlankForm = () => {
    const previousTitle =
      document.title;

    document.title =
      "Ek-2_Ise_Giris_Periyodik_Muayene_Formu";

    window.setTimeout(() => {
      window.print();

      window.setTimeout(() => {
        document.title =
          previousTitle;
      }, 600);
    }, 150);
  };

  useEffect(() => {
    if (
      loading ||
      !record ||
      mode !== "download"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        printBlankForm,
        600
      );

    return () =>
      window.clearTimeout(timer);
  }, [loading, record, mode]);

  if (loading) {
    return (
      <main className="loadingPage">
        <Loader2
          size={32}
          className="spin"
        />
        <strong>
          Ek-2 formu hazırlanıyor...
        </strong>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="errorPage">
        <section className="errorCard">
          <h1>
            Ek-2 formu açılamadı
          </h1>
          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/documentation/form-templates"
              )
            }
          >
            Form Şablonlarına Dön
          </button>
        </section>
      </main>
    );
  }

  const previewOnly =
    mode === "preview" ||
    mode === "download";

  return (
    <main className="page">
      <div className="toolbar noPrint">
        <button
          type="button"
          className="secondaryButton"
          onClick={() =>
            router.push(
              "/admin/documentation/form-templates"
            )
          }
        >
          <ArrowLeft size={17} />
          Form Şablonları
        </button>

        <div className="toolbarActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={() =>
              document
                .getElementById(
                  "official-ek2-form"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }
          >
            <Eye size={17} />
            Görüntüle
          </button>

          <button
            type="button"
            className="primaryButton"
            onClick={printBlankForm}
          >
            <Download size={17} />
            Boş Formu İndir
          </button>
        </div>
      </div>

      {!previewOnly ? (
        <section className="intro noPrint">
          <div>
            <div className="introBadge">
              Resmî Ek-2 Şablonu
            </div>

            <h1>
              İŞE GİRİŞ / PERİYODİK
              MUAYENE FORMU
            </h1>

            <p>
              Gönderdiğiniz resmî formun
              iki sayfalık tablo düzeni
              korunmuştur. Aynı boş form
              hem işe giriş hem de
              periyodik muayenede
              kullanılır.
            </p>
          </div>

          <div className="introMeta">
            <span>
              {record.template_code}
            </span>
            <span>
              v{record.version_no}
            </span>
            <span>
              Rev. {record.revision_no}
            </span>
          </div>
        </section>
      ) : null}

      <section
        id="official-ek2-form"
        className="formArea"
      >
        <div className="paper pageOne">
          <header className="documentHeader">
            <h2>
              İŞE GİRİŞ / PERİYODİK
              MUAYENE FORMU
            </h2>
            <strong>Ek-2</strong>
          </header>

          <table className="officialTable workplaceTable">
            <colgroup>
              <col className="topLabelColumn" />
              <col className="topValueColumn" />
              <col className="topPhotoColumn" />
            </colgroup>

            <tbody>
              <tr>
                <th colSpan={2}>
                  İŞYERİNİN
                </th>

                <td
                  rowSpan={12}
                  className="photoOuter"
                >
                  <div className="photoBox">
                    Fotoğraf
                  </div>
                </td>
              </tr>

              <TopRow label="Ünvanı" />
              <TopRow label="SGK Sicil No." />
              <TopRow label="Adresi" />
              <TopRow label="Tel ve faks" />
              <TopRow label="E-Posta" />

              <tr>
                <td
                  colSpan={2}
                  className="consentCell"
                >
                  <p>
                    İşe giriş/periyodik muayene olmayı kabul ettiğimi ve
                    muayene sırasında verdiğim bilgilerin doğru ve eksiksiz
                    olduğunu beyan ederim.
                  </p>

                  <div className="signatureText">
                    Çalışanın Adı Soyadı
                    <br />
                    İMZA
                  </div>
                </td>
              </tr>

              <tr>
                <th
                  colSpan={2}
                  className="workerHeading"
                >
                  İŞÇİNİN
                </th>
              </tr>

              <TopRow label="Adı ve soyadı" />
              <TopRow label="T.C.Kimlik No" />
              <TopRow label="Doğum Yeri ve Tarihi" />
              <TopRow label="Cinsiyeti" />
            </tbody>
          </table>

          <table className="officialTable workerTable workerContinuation">
            <tbody>
              <SimpleRow label="Eğitim durumu" />

              <tr>
                <td className="labelCell">
                  Medeni durumu
                </td>
                <td />
                <td className="smallLabel">
                  Çocuk sayısı
                </td>
                <td />
              </tr>

              <SimpleRow label="Ev Adresi" />
              <SimpleRow label="Tel No." />
              <SimpleRow label="Mesleği" />
              <SimpleRow label="Yaptığı iş (Ayrıntılı olarak tanımlanacaktır.)" />
              <SimpleRow label="Çalıştığı bölüm" />
            </tbody>
          </table>

          <table className="officialTable workHistoryTable">
            <thead>
              <tr>
                <td className="historyTitle">
                  Daha önce çalıştığı
                  yerler
                  <br />
                  <small>
                    (Bu günden geçmişe
                    doğru)
                  </small>
                </td>
                <td>İşkolu</td>
                <td>Yaptığı iş</td>
                <td>
                  Giriş-çıkış tarihi
                </td>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(
                (number) => (
                  <tr key={number}>
                    <td>{number}.</td>
                    <td />
                    <td />
                    <td />
                  </tr>
                )
              )}
            </tbody>
          </table>

          <table className="officialTable historyTable">
            <tbody>
              <tr>
                <th colSpan={2}>
                  Özgeçmişi
                </th>
              </tr>
              <SimpleRow label="Kan grubu" />
              <SimpleRow label="Konjenital/kronik hastalık" />
              <tr>
                <td className="labelCell">
                  Bağışıklama
                </td>
                <td />
              </tr>
              <SimpleRow
                label="- Tetanoz"
                nested
              />
              <SimpleRow
                label="- Hepatit"
                nested
              />
              <SimpleRow
                label="- Diğer"
                nested
              />
            </tbody>
          </table>

          <table className="officialTable familyTable">
            <tbody>
              <tr>
                <th colSpan={4}>
                  Soygeçmişi
                </th>
              </tr>
              <tr>
                <td>Anne</td>
                <td>Baba</td>
                <td>Kardeş</td>
                <td>Çocuk</td>
              </tr>
              <tr className="familyBlank">
                <td />
                <td />
                <td />
                <td />
              </tr>
            </tbody>
          </table>

          <table className="officialTable anamnesisTable">
            <tbody>
              <tr>
                <th colSpan={3}>
                  TIBBİ ANAMNEZ
                </th>
              </tr>

              <QuestionHeader
                text="1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?"
              />

              {[
                "Balgamlı öksürük",
                "Nefes darlığı",
                "Göğüs ağrısı",
                "Çarpıntı",
                "Sırt ağrısı",
                "İshal veya kabızlık",
                "Eklemlerde ağrı",
              ].map((item) => (
                <YesNoRow
                  key={item}
                  label={`- ${item}`}
                />
              ))}

              <QuestionHeader
                text="2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?"
              />

              {[
                "Kalp hastalığı",
                "Şeker hastalığı",
                "Böbrek rahatsızlığı",
              ].map((item) => (
                <YesNoRow
                  key={item}
                  label={`- ${item}`}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="paper pageTwo">
          <table className="officialTable anamnesisTable secondAnamnesis">
            <tbody>
              {[
                "Sarılık",
                "Mide veya on iki parmak ülseri",
                "İşitme kaybı",
                "Görme bozukluğu",
                "Sinir sistemi hastalığı",
                "Deri hastalığı",
                "Besin zehirlenmesi",
              ].map((item) => (
                <YesNoRow
                  key={item}
                  label={`- ${item}`}
                />
              ))}
            </tbody>
          </table>

          <table className="officialTable detailedQuestions">
            <tbody>
              <DetailQuestion
                no="3."
                question="Hastanede yattınız mı?"
                detail="Evet ise tanı ?"
              />
              <DetailQuestion
                no="4."
                question="Ameliyat geçirdiniz mi?"
                detail="Evet ise neden ?"
              />
              <DetailQuestion
                no="5."
                question="İş kazası geçirdiniz mi?"
                detail="Evet ise ne oldu ?"
              />
              <DetailQuestion
                no="6."
                question="Meslek Hastalıkları şüphesi ile ilgili tetkik ve muayeneye tabi tutuldunuz mu?"
                detail="Evet ise sonuç ?"
              />
              <DetailQuestion
                no="7."
                question="Maluliyet aldınız mı?"
                detail="Evet ise nedir ve oranı ?"
              />
              <DetailQuestion
                no="8."
                question="Şu anda herhangi bir tedavi görüyor musunuz?"
                detail="Evet ise nedir ?"
              />
            </tbody>
          </table>

          <table className="officialTable habitTable">
            <tbody>
              <tr>
                <td
                  rowSpan={3}
                  className="habitQuestion"
                >
                  9. Sigara içiyor
                  musunuz?
                </td>
                <td>Hayır</td>
                <td colSpan={3} />
              </tr>
              <tr>
                <td>Bırakmış</td>
                <td>
                  ..........ay/yıl önce
                </td>
                <td>
                  .............ay/yıl
                  içmiş
                </td>
                <td>
                  ...........adet/gün
                  içmiş
                </td>
              </tr>
              <tr>
                <td>Evet</td>
                <td>
                  ..........yıldır
                </td>
                <td>
                  ..............adet/gün
                </td>
                <td />
              </tr>

              <tr>
                <td
                  rowSpan={3}
                  className="habitQuestion"
                >
                  10. Alkol alıyor
                  musunuz?
                </td>
                <td>Hayır</td>
                <td colSpan={3} />
              </tr>
              <tr>
                <td>Bırakmış</td>
                <td>
                  ..............yıl önce
                </td>
                <td>
                  ..............yıl içmiş
                </td>
                <td>
                  ................sıklıkla
                  içmiş
                </td>
              </tr>
              <tr>
                <td>Evet</td>
                <td>
                  ..........yıldır
                </td>
                <td>
                  ..............sıklıkla
                </td>
                <td />
              </tr>
            </tbody>
          </table>

          <table className="officialTable physicalTable">
            <tbody>
              <tr>
                <th colSpan={2}>
                  FİZİK MUAYENE SONUÇLARI
                </th>
              </tr>

              <ExamRow label="a) Duyu organları" />
              <ExamRow label="   - Göz" nested />
              <ExamRow label="   - Kulak-Burun-Boğaz" nested />
              <ExamRow label="   - Deri" nested />
              <ExamRow label="b) Kardiyovasküler sistem muayenesi" />
              <ExamRow label="c) Solunum sistemi muayenesi" />
              <ExamRow label="d) Sindirim sistemi muayenesi" />
              <ExamRow label="e) Ürogenital sistem muayenesi" />
              <ExamRow label="f) Kas-iskelet sistemi muayenesi" />
              <ExamRow label="g) Nörolojik muayene" />
              <ExamRow label="Ğ) Psikiyatrik muayene" />
              <ExamRow label="h) Diğer" />

              <tr>
                <td className="vitalLabel">
                  -TA :
                </td>
                <td>
                  <span className="vitalSpace">
                    /
                  </span>
                  mm-Hg
                </td>
              </tr>
              <tr>
                <td className="vitalLabel">
                  -Nb :
                </td>
                <td>
                  <span className="vitalSpace">
                    /
                  </span>
                  dk.
                </td>
              </tr>
              <tr>
                <td className="vitalLabel">
                  -Boy:
                </td>
                <td className="vitalComposite">
                  <span>Kilo:</span>
                  <span>
                    Vücut Kitle İndeksi :
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="officialTable laboratoryTable">
            <tbody>
              <tr>
                <th colSpan={2}>
                  LABORATUVAR BULGULARI
                </th>
              </tr>
              <ExamRow label="a) Biyolojik analizler" />
              <ExamRow label="- Kan" nested />
              <ExamRow label="- İdrar" nested />
              <ExamRow label="b) Radyolojik analizler" />
              <ExamRow label="c) Fizyolojik analizler" />
              <ExamRow label="- Odyometre" nested />
              <ExamRow label="- SFT" nested />
              <ExamRow label="d) Psikolojik testler" />
              <ExamRow label="e) Diğer" />
            </tbody>
          </table>

          <section className="opinionSection">
            <h3>
              KANAAT VE SONUÇ * :
            </h3>

            <p className="opinionLine">
              <strong>1-</strong>
              <span />
              <b>
                işinde bedenen ve ruhen
                çalışmaya elverişlidir.
              </b>
            </p>

            <p className="opinionLine">
              <strong>2-</strong>
              <span />
              <b>
                şartı ile çalışmaya
                elverişlidir
              </b>
            </p>

            <p className="opinionNote">
              (*Yapılan muayene sonucunda
              çalışanın gece veya vardiyalı
              çalışma koşullarında çalışıp
              çalışamayacağı ile vücut
              sağlığını ve bütünlüğünü
              tamamlayıcı uygun alet
              teçhizat vs... bulunması
              durumunda çalışan için bu
              koşullarla çalışmaya elverişli
              olup olmadığı kanaati
              belirtilecektir.)
            </p>

            <div className="dateLine">
              ……...... / ............. /
              20.............
            </div>

            <div className="doctorBlock">
              <strong>İMZA</strong>
              <strong>
                Adı ve Soyadı :
              </strong>
              <strong>
                Diploma Tarih ve No:
              </strong>
              <strong>
                Diploma Tescil Tarih ve No:
              </strong>
              <span>
                İşyeri Hekimliği Belgesi
                Tarih ve No:
              </span>
            </div>
          </section>
        </div>
      </section>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          padding: 18px;
          background:
            linear-gradient(
              180deg,
              #f8fafc 0%,
              #eef2f7 100%
            );
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .loadingPage,
        .errorPage {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f8fafc;
          color: #64748b;
        }

        .spin {
          animation: spin 0.9s
            linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .errorCard {
          width: min(700px, 92%);
          padding: 26px;
          border: 1px solid #fecaca;
          border-radius: 20px;
          background: #ffffff;
          text-align: center;
        }

        .errorCard button,
        .primaryButton,
        .secondaryButton {
          min-height: 42px;
          border-radius: 11px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .primaryButton {
          border: 0;
          background: #6b1020;
          color: #ffffff;
        }

        .secondaryButton {
          border: 1px solid #dbe3ec;
          background: #ffffff;
          color: #475569;
        }

        .toolbar {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          justify-content:
            space-between;
          gap: 10px;
          margin-bottom: 15px;
        }

        .toolbarActions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .intro {
          width: 100%;
          margin-bottom: 16px;
          padding: 22px;
          border-radius: 22px;
          color: #ffffff;
          background:
            linear-gradient(
              135deg,
              #4c0d1a 0%,
              #9f1239 52%,
              #ea580c 100%
            );
          display: flex;
          flex-wrap: wrap;
          justify-content:
            space-between;
          gap: 18px;
        }

        .introBadge {
          display: inline-flex;
          border-radius: 999px;
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .intro h1 {
          margin: 14px 0 7px;
          font-size:
            clamp(
              25px,
              3vw,
              38px
            );
          line-height: 1.08;
        }

        .intro p {
          max-width: 780px;
          margin: 0;
          color:
            rgba(
              255,
              255,
              255,
              0.84
            );
          line-height: 1.6;
        }

        .introMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          align-content: flex-start;
        }

        .introMeta span {
          border-radius: 999px;
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 900;
        }

        .formArea {
          width: 100%;
          overflow-x: auto;
          padding: 18px;
          scroll-behavior: smooth;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: #d7dce2;
        }

        .paper {
          width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
          overflow: hidden;
          margin: 0 auto 18px;
          padding:
            8mm 8mm 7mm;
          background: #ffffff;
          color: #111111;
          box-shadow:
            0 18px 48px
            rgba(
              15,
              23,
              42,
              0.2
            );
          font-family:
            "Times New Roman",
            Times,
            serif;
          font-size: 8.7pt;
        }

        .paper:last-child {
          margin-bottom: 0;
        }

        .documentHeader {
          position: relative;
          min-height: 32px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .documentHeader h2 {
          margin: 0;
          font-size: 12.2pt;
          line-height: 1.15;
          text-align: center;
          font-weight: 700;
        }

        .documentHeader strong {
          position: absolute;
          right: 15%;
          top: 1px;
          font-size: 9.3pt;
        }

        .officialTable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 0;
        }

        .officialTable td,
        .officialTable th {
          border: 1px dotted #555;
          padding: 1px 5px;
          min-height: 14px;
          line-height: 1;
          vertical-align: middle;
          font-weight: 400;
        }

        .officialTable th {
          text-align: left;
          font-weight: 700;
        }

        .workplaceTable {
          margin-top: 5px;
        }

        .topLabelColumn {
          width: 19%;
        }

        .topValueColumn {
          width: 57%;
        }

        .topPhotoColumn {
          width: 24%;
        }

        .workplaceTable .photoOuter {
          padding: 0;
          vertical-align: middle;
        }

        .photoBox {
          width: 61%;
          height: 30mm;
          margin: 0 auto;
          border: 1px solid #333;
          display: grid;
          place-items: center;
          font-size: 8pt;
        }

        .labelCell {
          white-space: nowrap;
        }

        .workplaceTable tr:not(:first-child) td {
          height: 14px;
        }

        .consentCell {
          height: 24mm !important;
          vertical-align: top !important;
          text-align: center;
          padding: 4px 8px 2px !important;
        }

        .consentCell p {
          margin: 0 auto 7px;
          max-width: 96%;
          line-height: 1.2;
        }

        .signatureText {
          text-align: center;
          line-height: 1.1;
        }

        .workerHeading {
          border-top: 2px dashed #333 !important;
          padding-top: 2px !important;
          padding-bottom: 1px !important;
        }

        .workerTable {
          width: 100%;
        }

        .workerContinuation {
          margin-top: 0;
        }

        .workerTable td:first-child {
          width: 31%;
        }

        .workerTable td:nth-child(2) {
          width: 19%;
        }

        .workerTable td:nth-child(3) {
          width: 16%;
        }

        .workerTable td:nth-child(4) {
          width: 34%;
        }

        .workerTable tr {
          height: 14px;
        }

        .smallLabel {
          white-space: nowrap;
        }

        .workHistoryTable td:nth-child(1) {
          width: 22%;
        }

        .workHistoryTable td:nth-child(2) {
          width: 15%;
          text-align: center;
        }

        .workHistoryTable td:nth-child(3) {
          width: 35%;
          text-align: center;
        }

        .workHistoryTable td:nth-child(4) {
          width: 28%;
          text-align: center;
        }

        .workHistoryTable tbody td {
          height: 14px;
          text-align: left;
        }

        .historyTitle {
          line-height: 1.02;
        }

        .historyTitle small {
          font-size: 8.8pt;
        }

        .historyTable td:first-child {
          width: 22%;
        }

        .historyTable .nestedLabel {
          padding-left: 19px;
        }

        .familyTable td {
          width: 25%;
        }

        .familyBlank td {
          height: 13px;
        }

        .anamnesisTable td:first-child {
          width: 63%;
        }

        .anamnesisTable td:nth-child(2),
        .anamnesisTable td:nth-child(3) {
          width: 18.5%;
          text-align: center;
        }

        .anamnesisTable td,
        .anamnesisTable th {
          height: 13px;
        }

        .questionHeader td:first-child {
          font-weight: 400;
        }

        .secondAnamnesis {
          margin-top: 0;
        }

        .detailedQuestions td:nth-child(1) {
          width: 42%;
        }

        .detailedQuestions td:nth-child(2) {
          width: 14%;
        }

        .detailedQuestions td:nth-child(3) {
          width: 16%;
        }

        .detailedQuestions td:nth-child(4) {
          width: 28%;
        }

        .detailedQuestions td {
          height: 19px;
        }

        .detailQuestionText {
          line-height: 1.05;
        }

        .habitTable td {
          height: 13px;
        }

        .habitTable td:nth-child(1) {
          width: 23%;
        }

        .habitTable td:nth-child(2) {
          width: 13%;
        }

        .habitTable td:nth-child(3),
        .habitTable td:nth-child(4),
        .habitTable td:nth-child(5) {
          width: 21.3%;
        }

        .habitQuestion {
          vertical-align: top !important;
        }

        .physicalTable td:first-child,
        .laboratoryTable td:first-child {
          width: 32%;
        }

        .physicalTable td,
        .laboratoryTable td {
          height: 13px;
        }

        .examNested {
          padding-left: 22px !important;
        }

        .vitalLabel {
          padding-left: 22px !important;
        }

        .vitalSpace {
          display: inline-block;
          min-width: 125px;
          text-align: center;
        }

        .vitalComposite {
          display: flex;
          justify-content:
            space-between;
          padding-right: 35% !important;
        }

        .opinionSection {
          margin-top: 4px;
          font-size: 8.7pt;
        }

        .opinionSection h3 {
          margin: 0 0 5px;
          font-size: 9pt;
        }

        .opinionLine {
          display: grid;
          grid-template-columns:
            22px 1fr auto;
          align-items: end;
          gap: 3px;
          margin: 6px 0;
        }

        .opinionLine span {
          border-bottom:
            1px dotted #333;
          min-width: 0;
        }

        .opinionLine b {
          font-size: 8.4pt;
          white-space: nowrap;
        }

        .opinionNote {
          margin: 4px 0 0;
          font-size: 7.2pt;
          font-style: italic;
          line-height: 1.2;
        }

        .dateLine {
          margin-top: 8px;
          text-align: right;
          padding-right: 8%;
          font-weight: 700;
        }

        .doctorBlock {
          margin-top: 2px;
          display: grid;
          gap: 1px;
          font-size: 9.3pt;
          line-height: 1.02;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #official-ek2-form,
          #official-ek2-form * {
            visibility: visible !important;
          }

          #official-ek2-form {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            border: 0 !important;
            background: #ffffff !important;
          }

          .paper {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding:
              8mm 8mm 7mm !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .pageOne,
          .pageTwo {
            display: block !important;
          }

          .officialTable,
          .officialTable tbody,
          .officialTable tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .paper:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .noPrint {
            display: none !important;
          }
        }

        @media (max-width: 850px) {
          .page {
            padding: 10px;
          }

          .formArea {
            padding: 8px;
          }
        }
      `}</style>
    </main>
  );
}

function TopRow({
  label,
}: {
  label: string;
}) {
  return (
    <tr>
      <td className="labelCell">
        {label}
      </td>
      <td />
    </tr>
  );
}

function SimpleRow({
  label,
  nested = false,
}: {
  label: string;
  nested?: boolean;
}) {
  return (
    <tr>
      <td
        className={
          nested
            ? "labelCell nestedLabel"
            : "labelCell"
        }
      >
        {label}
      </td>
      <td colSpan={3} />
    </tr>
  );
}

function QuestionHeader({
  text,
}: {
  text: string;
}) {
  return (
    <tr className="questionHeader">
      <td>{text}</td>
      <td>Hayır</td>
      <td>Evet</td>
    </tr>
  );
}

function YesNoRow({
  label,
}: {
  label: string;
}) {
  return (
    <tr>
      <td>{label}</td>
      <td />
      <td />
    </tr>
  );
}

function DetailQuestion({
  no,
  question,
  detail,
}: {
  no: string;
  question: string;
  detail: string;
}) {
  return (
    <tr>
      <td className="detailQuestionText">
        {no} {question}
      </td>
      <td>Hayır</td>
      <td>{detail}</td>
      <td />
    </tr>
  );
}

function ExamRow({
  label,
  nested = false,
}: {
  label: string;
  nested?: boolean;
}) {
  return (
    <tr>
      <td
        className={
          nested
            ? "examNested"
            : undefined
        }
      >
        {label}
      </td>
      <td />
    </tr>
  );
}