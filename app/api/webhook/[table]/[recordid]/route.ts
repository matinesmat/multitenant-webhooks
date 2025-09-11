// app/api/webhook/[table]/[recordid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Type definitions based on your database schema
type WebhookPayload = {
  event: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
  org_slug?: string;
  timestamp?: string;
  source?: string;
};

type WebhookSettings = {
  id: string;
  org_slug: string | null;
  name: string | null;
  url: string;
  enabled: boolean;
  event_type: string | null;
  events: string[];
  resources: string[];
  bearer_token: string | null;
  json_body: string | null;
  retry_policy?: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay: number;
  };
};

type WebhookActivityLog = {
  id: string;
  webhook_id: string;
  org_slug: string;
  event_type: string;
  table_name: string;
  operation: string;
  record_id?: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_status?: number;
  response_body?: string;
  error_message?: string;
  retry_count?: number;
  max_retries?: number;
  created_at: string;
  updated_at: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { table: string; recordid: string } }
) {
  try {
    const { table, recordid } = params;
    const body: WebhookPayload = await req.json();
    
    console.log(`📥 Incoming webhook for ${table}/${recordid}:`, {
      event: body.event,
      operation: body.operation,
      org_slug: body.org_slug,
      source: body.source
    });

    // Validate required fields
    if (!body.event || !body.operation || !body.record) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: event, operation, record" },
        { status: 400 }
      );
    }

    // Extract organization slug from various possible sources
    const orgSlug = body.org_slug || 
                   (typeof body.record?.org_slug === 'string' ? body.record.org_slug : null) || 
                   (typeof body.record?.organization_id === 'string' ? body.record.organization_id : null) ||
                   await getOrgSlugFromRecord(table, body.record);

    if (!orgSlug) {
      console.log("No organization slug found, skipping webhook processing");
      return NextResponse.json({ 
        success: true, 
        message: "No organization slug found, webhook ignored" 
      });
    }

    // Get webhook settings for this organization and event
    const { data: webhookSettings, error: webhookError } = await supabaseAdmin
      .from('webhook_settings')
      .select('*')
      .eq('org_slug', orgSlug)
      .eq('enabled', true)
      .or(`event_type.eq.${body.event},events.cs.{${body.event}}`);

    if (webhookError) {
      console.error("Error fetching webhook settings:", webhookError);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch webhook settings" 
      }, { status: 500 });
    }

    if (!webhookSettings || webhookSettings.length === 0) {
      console.log(`No webhook settings found for ${body.event} in org ${orgSlug}`);
      return NextResponse.json({ 
        success: true, 
        message: "No webhook settings found for this event" 
      });
    }

    // Process each webhook setting
    const results = await Promise.allSettled(
      webhookSettings.map(async (webhook: WebhookSettings) => {
        return await processWebhook(webhook, body, orgSlug);
      })
    );

    // Count successful and failed webhooks
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`�� Webhook processing complete: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${webhookSettings.length} webhook settings`,
      results: {
        total: webhookSettings.length,
        successful,
        failed,
        details: results.map((result, index) => ({
          webhook_id: webhookSettings[index].id,
          status: result.status,
          error: result.status === 'rejected' ? result.reason : null
        }))
      }
    });

  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function processWebhook(
  webhook: WebhookSettings, 
  payload: WebhookPayload, 
  orgSlug: string
): Promise<{ webhook_id: string; status: string }> {
  let logEntry: WebhookActivityLog | null = null;
  
  try {
    // Create webhook activity log entry
    const { data: logEntryData, error: logError } = await supabaseAdmin
      .from('webhook_activity_logs')
      .insert({
        webhook_id: webhook.id,
        org_slug: orgSlug,
        event_type: payload.event,
        table_name: payload.table,
        operation: payload.operation,
        record_id: payload.record?.id,
        status: 'pending',
        retry_count: 0,
        max_retries: webhook.retry_policy?.max_retries || 3
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create log entry: ${logError.message}`);
    }

    logEntry = logEntryData;

    // Prepare webhook payload
    const webhookPayload = webhook.json_body ? 
      JSON.parse(webhook.json_body) : 
      {
        event: payload.event,
        table: payload.table,
        operation: payload.operation,
        record: payload.record,
        old_record: payload.old_record,
        org_slug: orgSlug,
        timestamp: new Date().toISOString(),
        source: 'nextjs-backend'
      };

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Webhook-Handler/1.0',
        ...(webhook.bearer_token ? { 'Authorization': `Bearer ${webhook.bearer_token}` } : {})
      },
      body: JSON.stringify(webhookPayload),
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    // Update log entry with response
    if (logEntry?.id) {
      await supabaseAdmin
        .from('webhook_activity_logs')
        .update({
          status: response.ok ? 'success' : 'failed',
          response_status: response.status,
          response_body: await response.text().catch(() => ''),
          error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    if (response.ok) {
      console.log(`✅ Webhook sent successfully to ${webhook.url}`);
      return { webhook_id: webhook.id, status: 'success' };
    } else {
      console.log(`⚠️ Webhook failed with status ${response.status}: ${webhook.url}`);
      return { webhook_id: webhook.id, status: 'failed' };
    }

  } catch (error) {
    console.error(`❌ Error sending webhook to ${webhook.url}:`, error);
    
    // Update log entry with error
    if (logEntry?.id) {
      await supabaseAdmin
        .from('webhook_activity_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    return { webhook_id: webhook.id, status: 'error' };
  }
}

async function getOrgSlugFromRecord(table: string, record: Record<string, unknown>): Promise<string | null> {
  try {
    // Try to get org_slug from the record directly
    if (record.org_slug && typeof record.org_slug === 'string') {
      return record.org_slug;
    }

    // If record has org_id, look up the organization
    if (record.org_id && typeof record.org_id === 'string') {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('slug')
        .eq('id', record.org_id)
        .single();
      
      return org?.slug || null;
    }

    // For students table, try to get org_slug from org_id
    if (table === 'students' && record.org_id && typeof record.org_id === 'string') {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('slug')
        .eq('id', record.org_id)
        .single();
      
      return org?.slug || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting org slug from record:', error);
    return null;
  }
}

// Handle GET requests for webhook status
export async function GET(
  req: NextRequest,
  { params }: { params: { table: string; recordid: string } }
) {
  try {
    const { table, recordid } = params;
    
    // Get webhook activity logs for this record
    const { data: logs, error } = await supabaseAdmin
      .from('webhook_activity_logs')
      .select('*')
      .eq('table_name', table)
      .eq('record_id', recordid)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch webhook logs: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      table,
      record_id: recordid,
      webhook_logs: logs || []
    });

  } catch (error) {
    console.error("❌ Error fetching webhook status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch webhook status" },
      { status: 500 }
    );
  }
}