import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const data = await db.getClusters();
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch clusters" },
      { status: 500 }
    );
  }
}
