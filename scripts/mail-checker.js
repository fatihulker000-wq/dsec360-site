import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fetch from "node-fetch";
import Imap from "imap";
import { simpleParser } from "mailparser";
import cron from "node-cron";

const IMAP_CONFIG = {
  user: "cbs@dsec360.com",
  password: process.env.NATRO_MAIL_PASSWORD,
  host: "mail.kurumsaleposta.com",
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false,
  },
};

const INBOUND_API_URL = "https://www.dsec360.com/api/mail/inbound";

let isRunning = false;

function validateConfig() {
  if (!IMAP_CONFIG.password) {
    throw new Error("NATRO_MAIL_PASSWORD tanımlı değil.");
  }
}

function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(box);
    });
  });
}

function parseMailFromMessage(msg) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    msg.on("body", (stream) => {
      simpleParser(stream, (err, parsed) => {
        if (resolved) return;

        if (err) {
          resolved = true;
          reject(err);
          return;
        }

        resolved = true;
        resolve(parsed);
      });
    });

    msg.once("error", (err) => {
      if (resolved) return;
      resolved = true;
      reject(err);
    });
  });
}

async function processMail(mail) {
  const payload = {
    from: mail?.from?.text || "",
    subject: mail?.subject || "",
    text: mail?.text || "",
    html: typeof mail?.html === "string" ? mail.html : "",
    messageId: mail?.messageId || "",
  };

  console.log("API gönderiliyor:", {
    subject: payload.subject,
    from: payload.from,
    messageId: payload.messageId,
  });

  const response = await fetch(INBOUND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let responseJson = null;

  try {
    responseJson = rawText ? JSON.parse(rawText) : null;
  } catch {
    responseJson = rawText;
  }

  if (!response.ok) {
    throw new Error(
      `Inbound API başarısız. Status=${response.status}. Response=${JSON.stringify(
        responseJson
      )}`
    );
  }

  console.log("Mail işlendi:", mail?.subject || "(konusuz)");
  return responseJson;
}

export async function checkMails() {
  if (isRunning) {
    console.log("Mail kontrolü zaten çalışıyor, bu tur atlandı.");
    return;
  }

  isRunning = true;
  console.log("MAIL CHECK START");

  try {
    validateConfig();

    const imap = new Imap(IMAP_CONFIG);

    await new Promise((resolve, reject) => {
      let finished = false;

      const safeResolve = () => {
        if (finished) return;
        finished = true;
        resolve();
      };

      const safeReject = (error) => {
        if (finished) return;
        finished = true;
        reject(error);
      };

      imap.once("ready", async () => {
        try {
          await openInbox(imap);
          console.log("IMAP bağlandı, inbox açıldı.");

          imap.search(["UNSEEN"], (searchError, results) => {
            if (searchError) {
              safeReject(searchError);
              try {
                imap.end();
              } catch {}
              return;
            }

            if (!results || results.length === 0) {
              console.log("Yeni mail yok");
              try {
                imap.end();
              } catch {}
              safeResolve();
              return;
            }

            const fetcher = imap.fetch(results, {
              bodies: "",
              markSeen: true,
            });

            const jobs = [];

            fetcher.on("message", (msg) => {
              const job = parseMailFromMessage(msg)
                .then((parsed) => processMail(parsed))
                .catch((error) => {
                  console.error("Mail parse/işleme hatası:", error);
                });

              jobs.push(job);
            });

            fetcher.once("error", (fetchError) => {
              safeReject(fetchError);
              try {
                imap.end();
              } catch {}
            });

            fetcher.once("end", async () => {
              try {
                await Promise.allSettled(jobs);
                console.log("Tüm mailler işlendi");
                try {
                  imap.end();
                } catch {}
                safeResolve();
              } catch (error) {
                safeReject(error);
                try {
                  imap.end();
                } catch {}
              }
            });
          });
        } catch (error) {
          safeReject(error);
          try {
            imap.end();
          } catch {}
        }
      });

      imap.once("error", (err) => {
        console.error("IMAP hata:", err);
        safeReject(err);
      });

      imap.once("end", () => {
        if (!finished) {
          safeResolve();
        }
      });

      imap.connect();
    });
  } catch (error) {
    console.error("checkMails genel hata:", error);
  } finally {
    isRunning = false;
  }
}

cron.schedule("*/1 * * * *", async () => {
  try {
    console.log("⏱ Mail kontrol ediliyor...");
    await checkMails();
  } catch (error) {
    console.error("CRON genel hata:", error);
  }
});

console.log("Mail checker aktif.");

checkMails().catch((error) => {
  console.error("İlk çalıştırma hatası:", error);
});