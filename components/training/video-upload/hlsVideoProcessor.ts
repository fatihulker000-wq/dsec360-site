import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import type {
  HlsAsset,
  PreparedHlsVideo,
} from "./types";

let loadedFfmpeg: Promise<FFmpeg> | null = null;

function errorMessage(cause: unknown) {
  if (
    cause instanceof Error &&
    cause.message
  ) {
    return cause.message;
  }

  if (
    typeof cause === "string" &&
    cause.trim()
  ) {
    return cause;
  }

  if (
    cause &&
    typeof cause === "object"
  ) {
    const candidate = cause as {
      message?: unknown;
      error?: unknown;
      type?: unknown;
    };

    if (
      typeof candidate.message === "string"
    ) {
      return candidate.message;
    }

    if (
      typeof candidate.error === "string"
    ) {
      return candidate.error;
    }

    if (
      typeof candidate.type === "string"
    ) {
      return `Tarayıcı olayı: ${candidate.type}`;
    }
  }

  return "Bilinmeyen tarayıcı hatası";
}

async function verifyCoreAsset(
  url: string,
  label: string
) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `${label} bulunamadı (${response.status}): ${url}`
    );
  }
}

async function getFfmpeg() {
  if (!loadedFfmpeg) {
    loadedFfmpeg = (async () => {
      await Promise.all([
        verifyCoreAsset(
          "/ffmpeg/ffmpeg-core.js",
          "FFmpeg çekirdek dosyası"
        ),
        verifyCoreAsset(
          "/ffmpeg/ffmpeg-core.wasm",
          "FFmpeg WASM dosyası"
        ),
      ]);

      const ffmpeg = new FFmpeg();

      try {
        await ffmpeg.load({
          coreURL:
            "/ffmpeg/ffmpeg-core.js",
          wasmURL:
            "/ffmpeg/ffmpeg-core.wasm",
        });
      } catch (cause) {
        throw new Error(
          `FFmpeg başlatılamadı: ${errorMessage(cause)}`
        );
      }

      return ffmpeg;
    })().catch((cause) => {
      /*
       * İlk başlatma başarısız olursa Promise'i
       * önbellekte tutma. Böylece kullanıcı sayfayı
       * yenilemeden yeniden deneyebilir.
       */
      loadedFfmpeg = null;
      throw cause;
    });
  }

  return loadedFfmpeg;
}

async function readDuration(
  file: File
) {
  return new Promise<number>(
    (
      resolveDuration,
      rejectDuration
    ) => {
      const video =
        document.createElement("video");

      const url =
        URL.createObjectURL(file);

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = Math.max(
          0,
          Math.floor(video.duration || 0)
        );

        URL.revokeObjectURL(url);

        if (duration > 0) {
          resolveDuration(duration);
        } else {
          rejectDuration(
            new Error(
              "Video süresi okunamadı."
            )
          );
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);

        rejectDuration(
          new Error(
            "Video dosyası tarayıcı tarafından okunamadı."
          )
        );
      };

      video.src = url;
    }
  );
}

function safeInputName(
  name: string
) {
  const extension =
    name.toLowerCase().endsWith(".mov")
      ? ".mov"
      : ".mp4";

  return `input-${crypto.randomUUID()}${extension}`;
}

export async function prepareHlsVideo(
  file: File,
  onProgress?: (
    percent: number
  ) => void
): Promise<PreparedHlsVideo> {
  if (
    !file.type.startsWith("video/")
  ) {
    throw new Error(
      "Geçerli bir video seçin."
    );
  }

  const ffmpeg =
    await getFfmpeg();

  const durationSeconds =
    await readDuration(file);

  const inputName =
    safeInputName(file.name);

  const workDir =
    `/hls-${crypto.randomUUID()}`;

  const progressHandler = ({
    progress,
  }: {
    progress: number;
  }) => {
    const percent = Math.max(
      0,
      Math.min(
        99,
        Math.round(progress * 100)
      )
    );

    onProgress?.(percent);
  };

  ffmpeg.on(
    "progress",
    progressHandler
  );

  try {
    await ffmpeg.createDir(workDir);

    await ffmpeg.writeFile(
      inputName,
      await fetchFile(file)
    );

    const outputArgs = [
      "-i",
      inputName,

      "-map",
      "0:v:0",

      "-map",
      "0:a:0?",

      "-c:v",
      "copy",

      "-c:a",
      "copy",

      "-f",
      "hls",

      "-hls_time",
      "10",

      "-hls_playlist_type",
      "vod",

      "-hls_flags",
      "independent_segments",

      "-hls_segment_filename",
      `${workDir}/segment-%05d.ts`,

      `${workDir}/index.m3u8`,
    ];

    let exitCode =
      await ffmpeg.exec(outputArgs);

    /*
     * Doğrudan kopyalama başarısız olursa
     * videoyu H.264/AAC biçimine dönüştür.
     */
    if (exitCode !== 0) {
      exitCode = await ffmpeg.exec([
        "-i",
        inputName,

        "-map",
        "0:v:0",

        "-map",
        "0:a:0?",

        "-c:v",
        "libx264",

        "-preset",
        "veryfast",

        "-crf",
        "24",

        "-c:a",
        "aac",

        "-b:a",
        "128k",

        "-f",
        "hls",

        "-hls_time",
        "10",

        "-hls_playlist_type",
        "vod",

        "-hls_flags",
        "independent_segments",

        "-hls_segment_filename",
        `${workDir}/segment-%05d.ts`,

        `${workDir}/index.m3u8`,
      ]);
    }

    if (exitCode !== 0) {
      throw new Error(
        "Video HLS biçimine dönüştürülemedi."
      );
    }

    const entries =
      await ffmpeg.listDir(workDir);

    const names = entries
      .map((entry) => entry.name)
      .filter(
        (name) =>
          name === "index.m3u8" ||
          /^segment-\d{5}\.ts$/.test(
            name
          )
      )
      .sort((a, b) => {
        if (a === "index.m3u8") {
          return -1;
        }

        if (b === "index.m3u8") {
          return 1;
        }

        return a.localeCompare(b);
      });

    if (
      !names.includes("index.m3u8")
    ) {
      throw new Error(
        "HLS manifesti oluşturulamadı."
      );
    }

        const assets: HlsAsset[] = [];

    for (const name of names) {
      const bytes = await ffmpeg.readFile(
        `${workDir}/${name}`
      );

      const contentType:
        | "application/vnd.apple.mpegurl"
        | "video/mp2t" =
        name.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : "video/mp2t";

      const blob = new Blob(
        [bytes as BlobPart],
        {
          type: contentType,
        }
      );

      assets.push({
        name,
        blob,
        contentType,
      });
    }

    onProgress?.(100);

    return {
      durationSeconds,
      assets,
      segmentCount: assets.filter(
        (asset) =>
          asset.name.endsWith(".ts")
      ).length,
    };
  } finally {
    ffmpeg.off(
      "progress",
      progressHandler
    );

    await ffmpeg
      .deleteFile(inputName)
      .catch(() => undefined);

    const entries = await ffmpeg
      .listDir(workDir)
      .catch(() => []);

    for (const entry of entries) {
      if (!entry.isDir) {
        await ffmpeg
          .deleteFile(
            `${workDir}/${entry.name}`
          )
          .catch(() => undefined);
      }
    }

    await ffmpeg
      .deleteDir(workDir)
      .catch(() => undefined);
  }
}