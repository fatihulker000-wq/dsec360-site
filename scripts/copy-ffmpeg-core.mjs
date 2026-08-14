import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("node_modules/@ffmpeg/core/dist/esm");
const target = resolve("public/ffmpeg");
await mkdir(target, { recursive: true });
await cp(resolve(source, "ffmpeg-core.js"), resolve(target, "ffmpeg-core.js"));
await cp(resolve(source, "ffmpeg-core.wasm"), resolve(target, "ffmpeg-core.wasm"));
console.log("FFmpeg core dosyalari public/ffmpeg klasorune kopyalandi.");