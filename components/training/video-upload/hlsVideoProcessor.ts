import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { HlsAsset, PreparedHlsVideo } from "./types";

let loadedFfmpeg: Promise<FFmpeg> | null = null;

async function getFfmpeg() {
  if (!loadedFfmpeg) {
    loadedFfmpeg = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
      });
      return ffmpeg;
    })();
  }
  return loadedFfmpeg;
}

async function readDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Math.max(0, Math.floor(video.duration || 0));
      URL.revokeObjectURL(url);
      duration > 0 ? resolve(duration) : reject(new Error("Video süresi okunamadı."));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video dosyası okunamadı."));
    };
    video.src = url;
  });
}

function safeInputName(name: string) {
  const extension = name.toLowerCase().endsWith(".mov") ? ".mov" : ".mp4";
  return `input-${crypto.randomUUID()}${extension}`;
}

export async function prepareHlsVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PreparedHlsVideo> {
  if (!file.type.startsWith("video/")) throw new Error("Geçerli bir video seçin.");

  const ffmpeg = await getFfmpeg();
  const durationSeconds = await readDuration(file);
  const inputName = safeInputName(file.name);
  const workDir = `/hls-${crypto.randomUUID()}`;

  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.max(0, Math.min(99, Math.round(progress * 100))));
  });

  await ffmpeg.createDir(workDir);
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const outputArgs = [
    "-i", inputName,
    "-map", "0:v:0", "-map", "0:a:0?",
    "-c:v", "copy", "-c:a", "copy",
    "-f", "hls", "-hls_time", "10",
    "-hls_playlist_type", "vod",
    "-hls_flags", "independent_segments",
    "-hls_segment_filename", `${workDir}/segment-%05d.ts`,
    `${workDir}/index.m3u8`,
  ];

  let exitCode = await ffmpeg.exec(outputArgs);
  if (exitCode !== 0) {
    exitCode = await ffmpeg.exec([
      "-i", inputName,
      "-map", "0:v:0", "-map", "0:a:0?",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
      "-c:a", "aac", "-b:a", "128k",
      "-f", "hls", "-hls_time", "10",
      "-hls_playlist_type", "vod",
      "-hls_flags", "independent_segments",
      "-hls_segment_filename", `${workDir}/segment-%05d.ts`,
      `${workDir}/index.m3u8`,
    ]);
  }
  if (exitCode !== 0) throw new Error("Video HLS biçimine dönüştürülemedi.");

  const entries = await ffmpeg.listDir(workDir);
  const names = entries
    .map((entry) => entry.name)
    .filter((name) => name === "index.m3u8" || /^segment-\d{5}\.ts$/.test(name))
    .sort((a, b) => (a === "index.m3u8" ? -1 : b === "index.m3u8" ? 1 : a.localeCompare(b)));

  if (!names.includes("index.m3u8")) throw new Error("HLS manifesti oluşturulamadı.");

  const assets: HlsAsset[] = [];
  for (const name of names) {
    const bytes = await ffmpeg.readFile(`${workDir}/${name}`);
    const contentType = name.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl" as const
      : "video/mp2t" as const;
    assets.push({ name, blob: new Blob([bytes as BlobPart], { type: contentType }), contentType });
  }

  await ffmpeg.deleteFile(inputName).catch(() => undefined);
  for (const name of names) await ffmpeg.deleteFile(`${workDir}/${name}`).catch(() => undefined);
  await ffmpeg.deleteDir(workDir).catch(() => undefined);
  onProgress?.(100);

  return {
    durationSeconds,
    assets,
    segmentCount: assets.filter((asset) => asset.name.endsWith(".ts")).length,
  };
}