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
    // Sonraki olası paket yolunu dene.
  }
}

if (!target) {
  throw new Error(
    "@ffmpeg/ffmpeg classes dosyası bulunamadı. Önce npm install çalıştırın."
  );
}

const source = await readFile(target, "utf8");
const dynamicWorkerPattern =
  /new\s+URL\(\s*classWorkerURL\s*,\s*import\.meta\.url\s*\)/;
const dynamicWorkerReplacePattern =
  /new\s+URL\(\s*classWorkerURL\s*,\s*import\.meta\.url\s*\)/g;

if (dynamicWorkerPattern.test(source)) {
  const patched = source.replace(
    dynamicWorkerReplacePattern,
    "classWorkerURL"
  );

  await writeFile(target, patched, "utf8");

  const verified = await readFile(target, "utf8");

  if (dynamicWorkerPattern.test(verified)) {
    throw new Error("FFmpeg worker yolu düzeltmesi doğrulanamadı.");
  }

  console.log(
    "FFmpeg worker yolu Next.js/Webpack için kalıcı olarak düzeltildi."
  );
} else if (source.includes("new Worker(classWorkerURL")) {
  console.log("FFmpeg worker düzeltmesi zaten uygulanmış.");
} else {
  throw new Error(
    "Beklenen FFmpeg worker ifadesi bulunamadı. @ffmpeg/ffmpeg sürümünü kontrol edin."
  );
}