import "./globals.css";
import AppChrome from "../components/AppChrome";

export const metadata = {
  title: "D-SEC360 | İSG Eğitim, Denetim ve Kurumsal Yönetim Platformu",
  description:
    "D-SEC360; iş güvenliği eğitimleri, dijital denetim, sağlık takibi, ÇBS yönetimi ve kurumsal raporlama süreçlerini tek platformda birleştiren modern İSG yönetim sistemidir.",
  keywords: [
    "isg yazılımı",
    "iş güvenliği yazılımı",
    "isg eğitim platformu",
    "online isg eğitimi",
    "çalışan eğitim takibi",
    "dijital denetim sistemi",
    "isg yönetim sistemi",
    "kurumsal isg platformu",
    "iş güvenliği takip programı",
    "dsec360",
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}