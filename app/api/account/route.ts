import { NextResponse } from "next/server";
import { getMockDashboardData } from "@/lib/mock-data";
import { isUsingMockData } from "@/lib/meta-api";
import { getLiveAccountInfo } from "@/lib/meta-live";

export async function GET() {
  if (isUsingMockData()) {
    const data = getMockDashboardData();
    return NextResponse.json({
      name: data.accountName,
      id: data.accountId,
      currency: data.currency,
      timezone: data.timezone,
      isMock: true,
    });
  }
  try {
    const a = await getLiveAccountInfo();
    return NextResponse.json({ ...a, isMock: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
