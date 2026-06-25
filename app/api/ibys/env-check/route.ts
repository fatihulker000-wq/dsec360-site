export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return Response.json({
    success: true,
    hasSupabaseUrl: Boolean(supabaseUrl),
    supabaseUrlPreview: supabaseUrl
      ? `${supabaseUrl.slice(0, 8)}...${supabaseUrl.slice(-12)}`
      : null,
    hasServiceRoleKey: Boolean(serviceRoleKey),
    serviceRoleKeyLength: serviceRoleKey?.length ?? 0,
  });
}