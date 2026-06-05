import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const data = await db.getReferences();
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch references" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await db.saveReference(body);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to save reference" },
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
        { success: false, data: null, error: "Missing reference ID" },
        { status: 400 }
      );
    }

    const success = await db.deleteReference(id);
    return NextResponse.json({ success, data: null, error: success ? null : "Failed to delete reference" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to delete reference" },
      { status: 500 }
    );
  }
}
