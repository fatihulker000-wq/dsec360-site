import {
  mapDocumentationRecord,
  mapDocumentationRecords,
} from "./mapper";

import type {
  DocumentationRecord,
  DocumentationSavePayload,
} from "./types";

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

type DocumentationListResponse = {
  data?: unknown[];
  records?: unknown[];
  items?: unknown[];
  error?: string;
  message?: string;
};

type DocumentationSingleResponse = {
  data?: unknown;
  record?: unknown;
  item?: unknown;
  error?: string;
  message?: string;
};

type DeleteResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

async function parseJson<T>(
  response: Response
): Promise<T> {
  return response
    .json()
    .catch(() => ({} as T));
}

function getErrorMessage(
  body: ApiErrorResponse,
  fallback: string
): string {
  return (
    body.error ||
    body.message ||
    fallback
  );
}

function buildQuery(
  values: Record<
    string,
    string | number | boolean | null | undefined
  >
): string {
  const params = new URLSearchParams();

  Object.entries(values).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      params.set(
        key,
        String(value)
      );
    }
  );

  const query = params.toString();

  return query ? `?${query}` : "";
}

export async function getDocumentationRecords(
  firmId?: string
): Promise<DocumentationRecord[]> {
  const response = await fetch(
    `/api/admin/documentation${buildQuery({
      firmId,
    })}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const body =
    await parseJson<DocumentationListResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        body,
        "Doküman kayıtları alınamadı."
      )
    );
  }

  const rows = Array.isArray(body.data)
    ? body.data
    : Array.isArray(body.records)
      ? body.records
      : Array.isArray(body.items)
        ? body.items
        : [];

  return mapDocumentationRecords(rows);
}

export async function getDocumentationRecord(
  id: string
): Promise<DocumentationRecord> {
  const normalizedId = String(id || "").trim();

  if (!normalizedId) {
    throw new Error(
      "Doküman kimliği eksik."
    );
  }

  const response = await fetch(
    `/api/admin/documentation/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const body =
    await parseJson<DocumentationSingleResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        body,
        "Doküman kaydı alınamadı."
      )
    );
  }

  const row =
    body.data ??
    body.record ??
    body.item;

  if (!row) {
    throw new Error(
      "Doküman kaydı bulunamadı."
    );
  }

  return mapDocumentationRecord(row);
}

export async function createDocumentationRecord(
  payload: DocumentationSavePayload
): Promise<DocumentationRecord> {
  const response = await fetch(
    "/api/admin/documentation",
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const body =
    await parseJson<DocumentationSingleResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        body,
        "Doküman kaydı oluşturulamadı."
      )
    );
  }

  const row =
    body.data ??
    body.record ??
    body.item;

  if (!row) {
    throw new Error(
      "Oluşturulan doküman kaydı alınamadı."
    );
  }

  return mapDocumentationRecord(row);
}

export async function updateDocumentationRecord(
  id: string,
  payload: Partial<DocumentationRecord>
): Promise<DocumentationRecord> {
  const normalizedId = String(id || "").trim();

  if (!normalizedId) {
    throw new Error(
      "Güncellenecek doküman kimliği eksik."
    );
  }

  const response = await fetch(
    `/api/admin/documentation/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const body =
    await parseJson<DocumentationSingleResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        body,
        "Doküman kaydı güncellenemedi."
      )
    );
  }

  const row =
    body.data ??
    body.record ??
    body.item;

  if (!row) {
    throw new Error(
      "Güncellenen doküman kaydı alınamadı."
    );
  }

  return mapDocumentationRecord(row);
}

export async function deleteDocumentationRecord(
  id: string
): Promise<void> {
  const normalizedId = String(id || "").trim();

  if (!normalizedId) {
    throw new Error(
      "Silinecek doküman kimliği eksik."
    );
  }

  const response = await fetch(
    `/api/admin/documentation/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const body =
    await parseJson<DeleteResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        body,
        "Doküman kaydı silinemedi."
      )
    );
  }
}

export async function uploadDocumentationFile(
  firmId: string,
  file: File
): Promise<{
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSizeBytes: number;
}> {
  const normalizedFirmId = String(
    firmId || ""
  ).trim();

  if (!normalizedFirmId) {
    throw new Error(
      "Dosya yüklemek için firma seçimi gerekli."
    );
  }

  if (!file) {
    throw new Error(
      "Yüklenecek dosya seçilmedi."
    );
  }

  const formData = new FormData();

  formData.append(
    "firmId",
    normalizedFirmId
  );

  formData.append(
    "file",
    file
  );

  const response = await fetch(
    "/api/admin/documentation/upload",
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body: formData,
    }
  );

  const body = await parseJson<{
    data?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string | null;
      fileSizeBytes?: number;
    };
    error?: string;
    message?: string;
  }>(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        body,
        "Doküman dosyası yüklenemedi."
      )
    );
  }

  if (
    !body.data?.fileName ||
    !body.data?.fileUrl
  ) {
    throw new Error(
      "Dosya yükleme sonucu eksik döndü."
    );
  }

  return {
    fileName:
      body.data.fileName,

    fileUrl:
      body.data.fileUrl,

    fileType:
      body.data.fileType ??
      null,

    fileSizeBytes:
      Number(
        body.data.fileSizeBytes ||
          file.size ||
          0
      ),
  };
}

export async function downloadDocumentationFile(
  fileUrl: string,
  fileName?: string
): Promise<void> {
  const normalizedUrl = String(
    fileUrl || ""
  ).trim();

  if (!normalizedUrl) {
    throw new Error(
      "İndirilecek dosya bağlantısı bulunamadı."
    );
  }

  const response = await fetch(
    normalizedUrl,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Doküman dosyası indirilemedi."
    );
  }

  const blob = await response.blob();

  const objectUrl =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = objectUrl;
  anchor.download =
    String(fileName || "").trim() ||
    "dokuman";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}