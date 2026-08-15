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

let loadedFfmpeg: Promise<FfmpegClient> | null = null;

function errorMessage(cause: unknown) {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === "string" && cause.trim()) return cause;
  if (cause && typeof cause === "object") {
    const candidate = cause as { message?: unknown; error?: unknown; type?: unknown };
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.error === "string") return candidate.error;
    if (typeof candidate.type === "string") return `Tarayıcı olayı: ${candidate.type}`;
  }
  return "Bilinmeyen tarayıcı hatası";
}

async function verifyCoreAsset(url: string, label: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${label} bulunamadı (${response.status}): ${url}`);
  }
}

async function getFfmpeg() {
  if (!loadedFfmpeg) {
    loadedFfmpeg = (async () => {
      await Promise.all([
        verifyCoreAsset("/ffmpeg/ffmpeg-core.js", "FFmpeg çekirdek dosyası"),
        verifyCoreAsset("/ffmpeg/ffmpeg-core.wasm", "FFmpeg WASM dosyası"),
        verifyCoreAsset(
          "/ffmpeg/ffmpeg-wrapper/index.js",
          "FFmpeg tarayıcı sarmalayıcısı"
        ),
        verifyCoreAsset(
          "/ffmpeg/ffmpeg-wrapper/worker.js",
          "FFmpeg tarayıcı worker dosyası"
        ),
      ]);

      // Değişken URL ve webpackIgnore birlikte kullanılır. Böylece Next.js,
      // @ffmpeg/ffmpeg içindeki dinamik Worker ifadesini paketlemeye çalışmaz;
      // modül public klasöründen tarayıcı tarafından doğal ESM olarak yüklenir.
      const wrapperUrl = "/ffmpeg/ffmpeg-wrapper/index.js";
      const wrapperModule = (await import(
        /* webpackIgnore: true */ wrapperUrl
      )) as { FFmpeg?: FfmpegConstructor };

      if (!wrapperModule.FFmpeg) {
        throw new Error("FFmpeg tarayıcı sınıfı yüklenemedi.");
      }

      const ffmpeg = new wrapperModule.FFmpeg();
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
  return new Promise<number>((resolveDuration, rejectDuration) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Math.max(0, Math.floor(video.duration || 0));
      URL.revokeObjectURL(url);
      duration > 0
        ? resolveDuration(duration)
        : rejectDuration(new Error("Video süresi okunamadı."));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      rejectDuration(new Error("Video dosyası tarayıcı tarafından okunamadı."));
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
  if (!file.type.startsWith("video/")) {
    throw new Error("Geçerli bir video seçin.");
  }

  const ffmpeg = await getFfmpeg();
  const durationSeconds = await readDuration(file);
  const inputName = safeInputName(file.name);
  const workDir = `/hls-${crypto.randomUUID()}`;

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(99, Math.round(progress * 100))));
  };
  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.createDir(workDir);
    await ffmpeg.writeFile(
      inputName,
      new Uint8Array(await file.arrayBuffer())
    );

    // Kaynak MP4/MOV zaman damgalarını doğrudan MPEG-TS içine kopyalamak,
    // bazı videolarda görünen süre doğru olsa bile oynatmanın ilk saniyede
    // bitmesine neden olur. Her videoyu normalize ederek yeniden kodluyoruz.
    const outputArgs = [
      "-fflags", "+genpts",
      "-i", inputName,
      "-map", "0:v:0",
      "-map", "0:a:0?",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "24",
      "-pix_fmt", "yuv420p",
      "-sc_threshold", "0",
      "-force_key_frames", "expr:gte(t,n_forced*4)",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "48000",
      "-avoid_negative_ts", "make_zero",
      "-max_muxing_queue_size", "2048",
      "-f", "hls",
      "-hls_time", "4",
      "-start_number", "0",
      "-hls_playlist_type", "vod",
      "-hls_flags", "independent_segments",
      "-hls_segment_filename", `${workDir}/segment-%05d.ts`,
      `${workDir}/index.m3u8`,
    ];

    const exitCode = await ffmpeg.exec(outputArgs);
    if (exitCode !== 0) {
      throw new Error("Video HLS biçimine dönüştürülemedi.");
    }

    const entries = await ffmpeg.listDir(workDir);
    const names = entries
      .map((entry) => entry.name)
      .filter((name) => name === "index.m3u8" || /^segment-\d{5}\.ts$/.test(name))
      .sort((a, b) =>
        a === "index.m3u8" ? -1 : b === "index.m3u8" ? 1 : a.localeCompare(b)
      );

    if (!names.includes("index.m3u8")) {
      throw new Error("HLS manifesti oluşturulamadı.");
    }

    const assets: HlsAsset[] = [];
    for (const name of names) {
      const bytes = await ffmpeg.readFile(`${workDir}/${name}`);
      const contentType = name.endsWith(".m3u8")
        ? ("application/vnd.apple.mpegurl" as const)
        : ("video/mp2t" as const);
      assets.push({
        name,
        blob: new Blob([bytes as BlobPart], { type: contentType }),
        contentType,
      });
    }

    onProgress?.(100);
    return {
      durationSeconds,
      assets,
      segmentCount: assets.filter((asset) => asset.name.endsWith(".ts")).length,
    };
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    const entries = await ffmpeg.listDir(workDir).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDir) {
        await ffmpeg.deleteFile(`${workDir}/${entry.name}`).catch(() => undefined);
      }
    }
    await ffmpeg.deleteDir(workDir).catch(() => undefined);
  }
}