import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const INCLUDED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".txt",
]);

const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".vercel",
]);

const replacements = new Map([
  ["Eğitim", "Eğitim"],
  ["eğitim", "eğitim"],
  ["Eğitimler", "Eğitimler"],
  ["eğitimler", "eğitimler"],

  ["Yönetim", "Yönetim"],
  ["yönetim", "yönetim"],
  ["Yönetici", "Yönetici"],
  ["yönetici", "yönetici"],

  ["İçerik", "İçerik"],
  ["içerik", "içerik"],
  ["İşlem", "İşlem"],
  ["işlem", "işlem"],
  ["İşlemler", "İşlemler"],
  ["işlemler", "işlemler"],

  ["Çalışan", "Çalışan"],
  ["çalışan", "çalışan"],
  ["Çalışanlar", "Çalışanlar"],
  ["çalışanlar", "çalışanlar"],

  ["Katılımcı", "Katılımcı"],
  ["katılımcı", "katılımcı"],
  ["Katılımcılar", "Katılımcılar"],
  ["katılımcılar", "katılımcılar"],

  ["Sınav", "Sınav"],
  ["sınav", "sınav"],
  ["Sağlık", "Sağlık"],
  ["sağlık", "sağlık"],
  ["Hazır", "Hazır"],
  ["hazır", "hazır"],
  ["HazırlÄ±k", "Hazırlık"],
  ["hazırlÄ±k", "hazırlık"],

  ["Başlamadı", "Başlamadı"],
  ["başlamadı", "başlamadı"],
  ["Başlatılmadı", "Başlatılmadı"],
  ["başlatılmadı", "başlatılmadı"],

  ["Tamamlanmış", "Tamamlanmış"],
  ["tamamlanmış", "tamamlanmış"],
  ["Tamamlama", "Tamamlama"],

  ["Açık", "Açık"],
  ["açık", "açık"],
  ["Açığı", "Açığı"],
  ["açığı", "açığı"],

  ["Görünüyor", "Görünüyor"],
  ["görünüyor", "görünüyor"],
  ["Göre", "Göre"],
  ["göre", "göre"],

  ["Öncelikli", "Öncelikli"],
  ["öncelikli", "öncelikli"],
  ["Özet", "Özet"],
  ["özet", "özet"],
  ["Özel", "Özel"],
  ["özel", "özel"],

  ["Güven", "Güven"],
  ["güven", "güven"],
  ["Güveni", "Güveni"],
  ["güveni", "güveni"],

  ["Süre", "Süre"],
  ["süre", "süre"],
  ["Sürüm", "Sürüm"],
  ["sürüm", "sürüm"],

  ["Yoğunluk", "Yoğunluk"],
  ["yoğunluk", "yoğunluk"],
  ["İyi", "İyi"],
  ["İYİ", "İYİ"],
  ["AKTİF", "AKTİF"],
  ["PASİF", "PASİF"],

  ["Seçili", "Seçili"],
  ["seçili", "seçili"],
  ["Değil", "Değil"],
  ["değil", "değil"],

  ["Henüz", "Henüz"],
  ["henüz", "henüz"],
  ["Canlı", "Canlı"],
  ["canlı", "canlı"],

  ["Oluşturuldu", "Oluşturuldu"],
  ["oluşturuldu", "oluşturuldu"],

  ["Ataması", "Ataması"],
  ["ataması", "ataması"],
  ["Atamaları", "Atamaları"],
  ["atamaları", "atamaları"],
  ["AtamalarınÄ±n", "Atamalarının"],
  ["atamalarınÄ±n", "atamalarının"],

  ["Tanımlı", "Tanımlı"],
  ["tanımlı", "tanımlı"],

  ["Kayıt", "Kayıt"],
  ["kayıt", "kayıt"],
  ["KayıtlarÄ±", "Kayıtları"],
  ["kayıtlarÄ±", "kayıtları"],

  ["Yükle", "Yükle"],
  ["yükle", "yükle"],

  ["•", "•"],
  ["–", "–"],
  ["—", "—"],
  ["’", "’"],
  ["“", "“"],
  ["”", "”"],
]);

function fixContent(content) {
  let result = content;

  for (const [broken, correct] of replacements) {
    result = result.split(broken).join(correct);
  }

  return result;
}

function walk(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (!INCLUDED_EXTENSIONS.has(extension)) {
      continue;
    }

    const original = fs.readFileSync(fullPath, "utf8");
    const fixed = fixContent(original);

    if (fixed !== original) {
      fs.writeFileSync(fullPath, fixed, "utf8");

      console.log(
        `Düzeltildi: ${path.relative(ROOT, fullPath)}`
      );
    }
  }
}

walk(ROOT);

console.log("Türkçe karakter taraması tamamlandı.");