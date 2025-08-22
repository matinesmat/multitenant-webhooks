import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { table, event, record } = body;

    console.log("📩 Supabase event received:", {
      table,
      event,
      record,
    });

    // Example: you can add logic per table
    if (table === "students" && event === "INSERT") {
      console.log("A new student was added:", record);
      // TODO: do something, like forward to a webhook
    }

    // Respond back to Supabase
    return NextResponse.json({ success: true, received: body });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
