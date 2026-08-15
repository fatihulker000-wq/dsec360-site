export type HlsAsset = {
  name: string;
  blob: Blob;
  contentType: "application/vnd.apple.mpegurl" | "video/mp2t";
};

export type PreparedHlsVideo = {
  durationSeconds: number;
  assets: HlsAsset[];
  segmentCount: number;
  totalOutputBytes: number;
};

export type UploadSession = {
  bucket: string;
  basePath: string;
  objectPath: string;
  token: string;
  endpoint: string;
};