import "dotenv/config";
import Imap from "imap";
import { simpleParser } from "mailparser";
import cron from "node-cron";

const IMAP_CONFIG = {
  user: "cbs@dsec360.com",
  password: process.env.NATRO_MAIL_PASSWORD,
  host: "mail.kurumsaleposta.com", // natro host
  port: 993,
  tls: true,
  tlsOptions: { 
    rejectUnauthorized: false 
  }
};

console.log("MAIL PASS:", process.env.NATRO_MAIL_PASSWORD);
function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

async function processMail(mail) {
  try {
    const payload = {
      from: mail.from?.text,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      messageId: mail.messageId,
    };

    await fetch("https://www.dsec360.com/api/mail/inbound", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Mail işlendi:", mail.subject);
  } catch (err) {
    console.error("Mail işleme hatası:", err);
  }
}

export async function checkMails() {
  const imap = new Imap(IMAP_CONFIG);

  imap.once("ready", async () => {
    await openInbox(imap);

    imap.search(["UNSEEN"], (err, results) => {
      if (err) throw err;

      if (!results || results.length === 0) {
        console.log("Yeni mail yok");
        imap.end();
        return;
      }

      const fetcher = imap.fetch(results, {
        bodies: "",
        markSeen: true,
      });

      fetcher.on("message", (msg) => {
        msg.on("body", (stream) => {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              console.error("Parse hatası:", err);
              return;
            }

            await processMail(parsed);
          });
        });
      });

      fetcher.once("end", () => {
        console.log("Tüm mailler işlendi");
        imap.end();
      });
    });
  });

  imap.once("error", (err) => {
    console.error("IMAP hata:", err);
  });

  imap.connect();
}

cron.schedule("*/1 * * * *", () => {
  console.log("⏱ Mail kontrol ediliyor...");
  checkMails();
});