import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const data = await db.getCriteria();
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch criteria" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, ...payload } = body;

    if (mode === "sub_criteria") {
      const data = await db.saveSubCriteria(payload);
      return NextResponse.json({ success: true, data, error: null });
    } else {
      const data = await db.saveCriteria(payload);
      return NextResponse.json({ success: true, data, error: null });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to save criteria data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing criteria ID" },
        { status: 400 }
      );
    }

    const data = await db.deleteCriteria(id);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to delete criteria" },
      { status: 500 }
    );
  }
}

