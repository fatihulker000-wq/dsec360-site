import type { HlsAsset, PreparedHlsVideo } from "./types";

type FfmpegProgress = { progress: number; time?: number };
type FfmpegEntry = { name: string; isDir: boolean };
type FfmpegClient = {
  load(options: { coreURL: string; wasmURL: string }): Promise<boolean>;
  on(event: "progress", callback: (event: FfmpegProgress) => void): void;
  off(event: "progress", callback: (event: FfmpegProgress) => void): void;
  createDir(path: string): Promise<boolean>;
  deleteDir(path: string): Promise<boolean>;
  writeFile(path: string, data: Uint8Array): Promise<boolean>;
  readFile(path: string): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<boolean>;
  listDir(path: string): Promise<FfmpegEntry[]>;
  exec(args: string[]): Promise<number>;
};
type FfmpegConstructor = new () => FfmpegClient;

const MAX_SOURCE_BYTES = 512 * 1024 * 1024;
const MAX_ASSET_BYTES = 45 * 1024 * 1024;
let loadedFfmpeg: Promise<FfmpegClient> | null = null;

function errorMessage(cause: unknown) {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === "string" && cause.trim()) return cause;
  if (cause && typeof cause === "object") {
    const value = cause as { message?: unknown; error?: unknown; type?: unknown };
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
    if (typeof value.type === "string") return `Tarayıcı olayı: ${value.type}`;
  }
  return "Bilinmeyen tarayıcı hatası";
}

async function verifyCoreAsset(url: string, label: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${label} bulunamadı (${response.status}): ${url}`);
}

async function getFfmpeg() {
  if (!loadedFfmpeg) {
    loadedFfmpeg = (async () => {
      await Promise.all([
        verifyCoreAsset("/ffmpeg/ffmpeg-core.js", "FFmpeg çekirdek dosyası"),
        verifyCoreAsset("/ffmpeg/ffmpeg-core.wasm", "FFmpeg WASM dosyası"),
        verifyCoreAsset("/ffmpeg/ffmpeg-wrapper/index.js", "FFmpeg tarayıcı sarmalayıcısı"),
        verifyCoreAsset("/ffmpeg/ffmpeg-wrapper/worker.js", "FFmpeg worker dosyası"),
      ]);
      const wrapperUrl = "/ffmpeg/ffmpeg-wrapper/index.js";
      const wrapper = (await import(/* webpackIgnore: true */ wrapperUrl)) as {
        FFmpeg?: FfmpegConstructor;
      };
      if (!wrapper.FFmpeg) throw new Error("FFmpeg tarayıcı sınıfı yüklenemedi.");
      const ffmpeg = new wrapper.FFmpeg();
      try {
        await ffmpeg.load({
          coreURL: "/ffmpeg/ffmpeg-core.js",
          wasmURL: "/ffmpeg/ffmpeg-core.wasm",
        });
      } catch (cause) {
        throw new Error(`FFmpeg başlatılamadı: ${errorMessage(cause)}`);
      }
      return ffmpeg;
    })().catch((cause) => {
      loadedFfmpeg = null;
      throw cause;
    });
  }
  return loadedFfmpeg;
}

async function readDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const clear = () => URL.revokeObjectURL(url);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Math.max(0, Math.ceil(video.duration || 0));
      clear();
      duration > 0 ? resolve(duration) : reject(new Error("Video süresi okunamadı."));
    };
    video.onerror = () => {
      clear();
      reject(new Error("Video dosyası tarayıcı tarafından okunamadı."));
    };
    video.src = url;
  });
}

function safeInputName(name: string) {
  return `input-${crypto.randomUUID()}${name.toLowerCase().endsWith(".mov") ? ".mov" : ".mp4"}`;
}

export async function prepareHlsVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PreparedHlsVideo> {
  if (!file.type.startsWith("video/") || !/\.(mp4|mov)$/i.test(file.name)) {
    throw new Error("Geçerli bir MP4 veya MOV video seçin.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Tarayıcıda güvenli işleme sınırı 512 MB. Daha büyük kaynak için sunucu dönüştürme servisi kullanılmalıdır.");
  }

  const ffmpeg = await getFfmpeg();
  const durationSeconds = await readDuration(file);
  const inputName = safeInputName(file.name);
  const workDir = `/hls-${crypto.randomUUID()}`;
  const progressHandler = ({ progress }: FfmpegProgress) =>
    onProgress?.(Math.max(0, Math.min(99, Math.round(progress * 100))));
  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.createDir(workDir);
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const exitCode = await ffmpeg.exec([
      "-fflags", "+genpts", "-i", inputName,
      "-map", "0:v:0", "-map", "0:a:0?",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
      "-pix_fmt", "yuv420p", "-sc_threshold", "0",
      "-force_key_frames", "expr:gte(t,n_forced*6)",
      "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
      "-avoid_negative_ts", "make_zero", "-max_muxing_queue_size", "2048",
      "-f", "hls", "-hls_time", "6", "-start_number", "0",
      "-hls_playlist_type", "vod", "-hls_flags", "independent_segments",
      "-hls_segment_filename", `${workDir}/segment-%05d.ts`,
      `${workDir}/index.m3u8`,
    ]);
    if (exitCode !== 0) throw new Error("Video HLS biçimine dönüştürülemedi.");

    const entries = await ffmpeg.listDir(workDir);
    const segmentNames = entries.map((entry) => entry.name)
      .filter((name) => /^segment-\d{5}\.ts$/.test(name)).sort();
    if (!entries.some((entry) => entry.name === "index.m3u8") || segmentNames.length === 0) {
      throw new Error("HLS manifesti veya video parçaları oluşturulamadı.");
    }
    segmentNames.forEach((name, index) => {
      if (name !== `segment-${String(index).padStart(5, "0")}.ts`) {
        throw new Error("HLS parçaları eksik veya sırasız oluşturuldu.");
      }
    });

    const assets: HlsAsset[] = [];
    for (const name of [...segmentNames, "index.m3u8"]) {
      const bytes = await ffmpeg.readFile(`${workDir}/${name}`);
      const contentType = name.endsWith(".m3u8")
        ? ("application/vnd.apple.mpegurl" as const) : ("video/mp2t" as const);
      const blob = new Blob([bytes as BlobPart], { type: contentType });
      if (blob.size > MAX_ASSET_BYTES) {
        throw new Error(`${name} 45 MB güvenli parça sınırını aşıyor.`);
      }
      assets.push({ name, blob, contentType });
    }
    onProgress?.(100);
    return {
      durationSeconds,
      assets,
      segmentCount: segmentNames.length,
      totalOutputBytes: assets.reduce((sum, asset) => sum + asset.blob.size, 0),
    };
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    const entries = await ffmpeg.listDir(workDir).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDir) await ffmpeg.deleteFile(`${workDir}/${entry.name}`).catch(() => undefined);
    }
    await ffmpeg.deleteDir(workDir).catch(() => undefined);
  }
}