import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve(
  "node_modules/@ffmpeg/ffmpeg/dist/esm"
);
const target = resolve(
  "public/ffmpeg/ffmpeg-wrapper"
);

try {
  await access(resolve(source, "index.js"));
  await access(resolve(source, "worker.js"));
} catch {
  throw new Error(
    "@ffmpeg/ffmpeg tarayıcı dosyaları bulunamadı. Önce npm install çalıştırın."
  );
}

await rm(target, {
  recursive: true,
  force: true,
});

await mkdir(target, {
  recursive: true,
});

await cp(source, target, {
  recursive: true,
});

console.log(
  "FFmpeg tarayıcı dosyaları public/ffmpeg/ffmpeg-wrapper klasörüne kopyalandı."
);