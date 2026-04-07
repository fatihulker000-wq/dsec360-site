import "./globals.css";
import AppChrome from "../components/AppChrome";

export const metadata = {
  title: "D-SEC",
  description: "Dijital Sağlık Emniyet Çevre Yönetim Sistemi",
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
