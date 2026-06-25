import {
  createIbysQueueItem,
  listIbysQueueItems,
  type IbysQueueStatus,
} from "@/lib/ibys/ibysService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const allowedStatuses: IbysQueueStatus[] = [
      "PENDING",
      "READY",
      "SENT",
      "FAILED",
      "RETRY",
      "MISSING_INFO",
    ];

    const status = allowedStatuses.includes(statusParam as IbysQueueStatus)
      ? (statusParam as IbysQueueStatus)
      : undefined;

    const data = await listIbysQueueItems(status);

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("IBYS queue GET error:", error);

    return Response.json(
      {
        success: false,
        error: "İBYS kuyruğu alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.moduleName || !body?.recordType) {
      return Response.json(
        {
          success: false,
          error: "moduleName ve recordType zorunludur.",
        },
        { status: 400 }
      );
    }

    const data = await createIbysQueueItem({
      firmId: body.firmId ?? null,
      firmName: body.firmName ?? null,
      moduleName: body.moduleName,
      recordType: body.recordType,
      recordId: body.recordId ?? null,
      recordTitle: body.recordTitle ?? null,
      payload: body.payload ?? {},
      createdBy: body.createdBy ?? null,
    });

    return Response.json({
      success: true,
      data,
    });
  } catch (error: any) {
  console.error(error);

  return Response.json(
    {
      success: false,
      error: error?.message ?? String(error),
    },
    { status: 500 }
  );
  }
}