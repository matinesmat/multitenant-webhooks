import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate HMAC signature
function generateHmacSignature(body: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { webhookId, url } = await request.json();

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: "Webhook ID is required" },
        { status: 400 }
      );
    }

    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from("webhook_settings")
      .select("*")
      .eq("id", webhookId)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json(
        { success: false, error: "Webhook not found" },
        { status: 404 }
      );
    }

    // Create test payload
    const testPayload = {
      table: "students",
      event: "INSERT",
      organization_id: webhook.org_slug,
      record: {
        id: "test-student-123",
        name: "Test Student",
        email: "test@example.com",
        created_at: new Date().toISOString()
      }
    };

    const body = JSON.stringify(testPayload);
    const signature = webhook.secret_key ? generateHmacSignature(body, webhook.secret_key) : null;

    // Send test webhook
    const response = await fetch(url || webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'X-Signature': `sha256=${signature}` } : {}),
        'X-Event-Type': 'students_INSERT',
        'X-Organization-ID': webhook.org_slug
      },
      body
    });

    const responseBody = await response.text();

    // Webhook logging removed

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Test webhook sent successfully!' : `Test failed: ${response.status} ${response.statusText}`,
      response: {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      }
    });
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test webhook" },
      { status: 500 }
    );
  }
}
