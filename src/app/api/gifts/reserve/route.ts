import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Este endpoint foi descontinuado. Use /api/pix/create para reservar presentes via PIX.",
    },
    { status: 410 }
  );
}
