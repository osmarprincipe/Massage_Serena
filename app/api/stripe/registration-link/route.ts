import { NextResponse } from "next/server";

/**
 * This endpoint was used by the old "pay first, register later" guest flow.
 * That flow has been removed. Purchases now require an authenticated account.
 * This route is kept to return a clear error rather than a 404.
 */
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is no longer in use. Purchases require authentication." },
    { status: 410 }
  );
}
