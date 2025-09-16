import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook logging removed

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { table, event, record, old_record } = body;

    console.log("📩 Supabase event received:", {
      table,
      event,
      record,
    });

    // Extract organization slug from record
    const orgSlug = record?.org_slug || record?.organization_id;
    
    if (!orgSlug) {
      console.log("No organization slug found, skipping webhook processing");
      return NextResponse.json({ success: true, received: body });
    }

    // Get webhook settings for this organization
    const { data: webhookSettings, error: webhookError } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('org_slug', orgSlug)
      .eq('event_type', `${table}_${event}`);

    if (webhookError) {
      console.error("Error fetching webhook settings:", webhookError);
      return NextResponse.json({ success: true, received: body });
    }

    if (!webhookSettings || webhookSettings.length === 0) {
      console.log(`No webhook settings found for ${table}_${event} in org ${orgSlug}`);
      return NextResponse.json({ success: true, received: body });
    }

    // Process each webhook setting
    for (const webhook of webhookSettings) {
      try {
        // Send webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(webhook.bearer_token ? { 'Authorization': `Bearer ${webhook.bearer_token}` } : {})
          },
          body: webhook.json_body || JSON.stringify({
            event: `${table}_${event}`,
            table,
            operation: event,
            record,
            old_record,
            timestamp: new Date().toISOString()
          })
        });

        console.log(`✅ Webhook sent successfully to ${webhook.url}`);
      } catch (webhookError) {
        console.error(`❌ Error sending webhook to ${webhook.url}:`, webhookError);
      }
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
