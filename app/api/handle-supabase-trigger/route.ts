import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type WebhookActivityLog = {
  id: string;
  webhook_id: string;
  org_slug: string;
  event_type: string;
  table_name: string;
  operation: string;
  record_id?: string;
  status: string;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
};

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
      let logEntry: WebhookActivityLog | null = null;
      
      try {
        // Log webhook activity
        const { data: logEntryData } = await supabase
          .from('webhook_activity_logs')
          .insert({
            webhook_id: webhook.id,
            org_slug: orgSlug,
            event_type: `${table}_${event}`,
            table_name: table,
            operation: event,
            record_id: record?.id,
            status: 'pending'
          })
          .select()
          .single();

        logEntry = logEntryData;

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

        // Update log entry with response
        await supabase
          .from('webhook_activity_logs')
          .update({
            status: response.ok ? 'success' : 'failed',
            response_status: response.status,
            response_body: await response.text().catch(() => ''),
            error_message: response.ok ? null : `HTTP ${response.status}`
          })
          .eq('id', logEntry?.id);

        console.log(`✅ Webhook sent successfully to ${webhook.url}`);
      } catch (webhookError) {
        console.error(`❌ Error sending webhook to ${webhook.url}:`, webhookError);
        
        // Update log entry with error
        if (logEntry?.id) {
          await supabase
            .from('webhook_activity_logs')
            .update({
              status: 'failed',
              error_message: webhookError instanceof Error ? webhookError.message : 'Unknown error'
            })
            .eq('id', logEntry.id);
        }
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
