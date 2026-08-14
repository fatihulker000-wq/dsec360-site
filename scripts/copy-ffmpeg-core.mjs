import {
  cp,
  mkdir,
} from "node:fs/promises";

import {
  resolve,
} from "node:path";

const coreSource = resolve(
  "node_modules/@ffmpeg/core/dist/esm"
);

const ffmpegSource = resolve(
  "node_modules/@ffmpeg/ffmpeg/dist/esm"
);

const target = resolve(
  "public/ffmpeg"
);

await mkdir(target, {
  recursive: true,
});

/*
 * FFmpeg çekirdek dosyaları
 */
await cp(
  resolve(
    coreSource,
    "ffmpeg-core.js"
  ),
  resolve(
    target,
    "ffmpeg-core.js"
  )
);

await cp(
  resolve(
    coreSource,
    "ffmpeg-core.wasm"
  ),
  resolve(
    target,
    "ffmpeg-core.wasm"
  )
);

/*
 * @ffmpeg/ffmpeg ana worker dosyası ve
 * worker'ın kullandığı yardımcı modüller.
 */
await cp(
  resolve(
    ffmpegSource,
    "worker.js"
  ),
  resolve(
    target,
    "worker.js"
  )
);

await cp(
  resolve(
    ffmpegSource,
    "const.js"
  ),
  resolve(
    target,
    "const.js"
  )
);

await cp(
  resolve(
    ffmpegSource,
    "errors.js"
  ),
  resolve(
    target,
    "errors.js"
  )
);

console.log(
  "FFmpeg core ve sabit worker dosyalari public/ffmpeg klasorune kopyalandi."
);