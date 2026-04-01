import Link from "next/link";

const quickLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/services", label: "Hizmetler" },
  { href: "/training", label: "Eğitim Modülü" },
  { href: "/cbs", label: "ÇBS" },
  { href: "/contact", label: "İletişim" },
];

const trainingLinks = [
  { href: "/training", label: "Eğitim Ana Sayfa" },
  { href: "/training/async", label: "Asenkron Eğitim" },
  { href: "/training/sync", label: "Senkron Eğitim" },
  { href: "/training/online", label: "Online Eğitim" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h3 className="footer-title">D-SEC</h3>
          <p className="footer-text">
            Dijital Sağlık, Emniyet ve Çevre süreçlerini tek platformda yöneten
            kurumsal yönetim sistemi.
          </p>

          <p className="footer-text">
            Denetim, eğitim, sağlık, ÇBS ve raporlama süreçlerini daha görünür,
            daha düzenli ve daha yönetilebilir hale getirmek için tasarlanmıştır.
          </p>

          <div style={{ marginTop: 18 }}>
            <Link href="/contact" className="nav-cta">
              Demo Talep Et
            </Link>
          </div>
        </div>

        <div>
          <h4 className="footer-heading">Hızlı Menü</h4>
          <div className="footer-links">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="footer-heading">Eğitim Modülü</h4>
          <div className="footer-links">
            {trainingLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="footer-heading">İletişim</h4>
          <div className="footer-links">
            <p>
              Kurumsal demo, iş birliği ve ürün sunumu talepleri için bizimle
              iletişime geçin.
            </p>
            <p>Mail: info@dsec360.com</p>
            <p>Web: www.dsec360.com</p>
            <p>Platform: D-SEC Kurumsal Yönetim Sistemi</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} D-SEC | Tüm Hakları Saklıdır
      </div>
    </footer>
  );
}