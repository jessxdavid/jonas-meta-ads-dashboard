import { NextRequest, NextResponse } from "next/server";
import { generateInsights, type InsightsPayload } from "@/lib/insights-engine";
import { rangeFromRequest } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const range = rangeFromRequest(req);
    const insights = await generateInsights(range);
    const payload: InsightsPayload = {
      insights,
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
