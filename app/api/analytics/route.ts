import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsPayload } from "@/lib/meta-api";
import { rangeFromRequest } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const range = rangeFromRequest(req);
    const data = await getAnalyticsPayload(range);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
