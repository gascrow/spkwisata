import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    console.log("=== GET /api/clusters route handler called ===");
    const data = await db.getClusters();
    console.log("=== GET /api/clusters returned count:", data.length);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch clusters" },
      { status: 500 }
    );
  }
}
