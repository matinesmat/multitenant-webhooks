// app/api/webhook/[table]/[recordid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

//TODO: when a request is made to this route, get the appropriate webhook setting of he organization inquestion
// and push the information to the url of that webhook setting
// you may find the structure of the db from supabase.ts

// {project_url}/api/webhook



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

// Webhook logging removed

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
      source: body.source
    });

    // Validate required fields
    if (!body.event || !body.operation || !body.record) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: event, operation, record" },
        { status: 400 }
      );
    }

    // Extract organization slug from the record since payload no longer includes org_slug
    const orgSlug = await getOrgSlugFromRecord(table, body.record);

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
  try {

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

    // Webhook logging removed

    if (response.ok) {
      console.log(`✅ Webhook sent successfully to ${webhook.url}`);
      return { webhook_id: webhook.id, status: 'success' };
    } else {
      console.log(`⚠️ Webhook failed with status ${response.status}: ${webhook.url}`);
      return { webhook_id: webhook.id, status: 'failed' };
    }

  } catch (error) {
    console.error(`❌ Error sending webhook to ${webhook.url}:`, error);
    return { webhook_id: webhook.id, status: 'error' };
  }
}

async function getOrgSlugFromRecord(table: string, record: Record<string, unknown>): Promise<string | null> {
  try {
    // Try to get org_slug from the record directly (for tables that have this field)
    if (record.org_slug && typeof record.org_slug === 'string') {
      return record.org_slug;
    }

    // If record has org_id, look up the organization slug
    if (record.org_id && typeof record.org_id === 'string') {
      const { data: org, error } = await supabaseAdmin
        .from('organizations')
        .select('slug')
        .eq('id', record.org_id)
        .single();
      
      if (error) {
        console.error('Error looking up organization:', error);
        return null;
      }
      
      return org?.slug || null;
    }

    // For organizations table, use the slug field directly
    if (table === 'organizations' && record.slug && typeof record.slug === 'string') {
      return record.slug;
    }

    // Try alternative organization ID fields
    const orgIdFields = ['organization_id', 'orgId', 'organizationId'];
    for (const field of orgIdFields) {
      if (record[field] && typeof record[field] === 'string') {
        const { data: org, error } = await supabaseAdmin
          .from('organizations')
          .select('slug')
          .eq('id', record[field])
          .single();
        
        if (!error && org?.slug) {
          return org.slug;
        }
      }
    }

    console.log(`No organization slug found for table ${table} with record:`, record);
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
    
    // Webhook logging removed - return basic status
    return NextResponse.json({
      success: true,
      table,
      record_id: recordid,
      message: "Webhook logging has been removed"
    });

  } catch (error) {
    console.error("❌ Error fetching webhook status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch webhook status" },
      { status: 500 }
    );
  }
}