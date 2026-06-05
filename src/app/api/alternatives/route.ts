import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const data = await db.getAlternatives();
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch alternatives" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await db.saveAlternative(body);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to save alternative" },
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
        { success: false, data: null, error: "Missing alternative ID" },
        { status: 400 }
      );
    }

    const success = await db.deleteAlternative(id);
    return NextResponse.json({ success, data: null, error: success ? null : "Failed to delete alternative" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to delete alternative" },
      { status: 500 }
    );
  }
}
