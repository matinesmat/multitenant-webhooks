import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Webhook logging has been removed
  return NextResponse.json({
    success: true,
    message: "Webhook logging has been removed - retry functionality is no longer available"
  });
}