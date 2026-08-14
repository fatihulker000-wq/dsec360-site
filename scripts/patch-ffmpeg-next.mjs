import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const candidates = [
  "node_modules/@ffmpeg/ffmpeg/dist/esm/classes.js",
  "node_modules/@ffmpeg/ffmpeg/dist/esm/classes.mjs",
];

let target = null;

for (const candidate of candidates) {
  const absolute = resolve(candidate);

  try {
    await access(absolute);
    target = absolute;
    break;
  } catch {
    // Sonraki olası dosya yolunu dene.
  }
}

if (!target) {
  throw new Error(
    "@ffmpeg/ffmpeg classes dosyası bulunamadı. Önce npm install çalıştırın."
  );
}

const source = await readFile(target, "utf8");

const dynamicExpression =
  "new URL(classWorkerURL, import.meta.url)";

const fixedExpression =
  "classWorkerURL";

if (source.includes(dynamicExpression)) {
  const patched = source.replaceAll(
    dynamicExpression,
    fixedExpression
  );

  await writeFile(target, patched, "utf8");

  console.log(
    "FFmpeg worker yolu Next.js/Webpack için düzeltildi."
  );
} else if (source.includes("new Worker(classWorkerURL")) {
  console.log(
    "FFmpeg worker düzeltmesi zaten uygulanmış."
  );
} else {
  throw new Error(
    "Beklenen FFmpeg worker ifadesi bulunamadı. Paket sürümünü kontrol edin."
  );
}