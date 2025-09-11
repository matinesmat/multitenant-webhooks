import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WebhookPayload {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  organization_id: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

interface WebhookSettings {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  secret_key: string;
  resources: string[];
  events: string[];
  retry_policy: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay: number;
  };
}

// Generate HMAC signature
function generateHmacSignature(body: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

// Enqueue webhook delivery
async function enqueueWebhookDelivery(
  webhook: WebhookSettings,
  payload: WebhookPayload,
  organizationId: string
) {
  const webhookPayload = {
    event: `${payload.table}_${payload.event}`,
    table: payload.table,
    operation: payload.event,
    organization_id: organizationId,
    record: payload.record,
    old_record: payload.old_record,
    timestamp: new Date().toISOString()
  };

  const body = JSON.stringify(webhookPayload);
  const signature = generateHmacSignature(body, webhook.secret_key);

  // Log the webhook attempt
  const { data: logEntry } = await supabase
    .from('webhooks_log')
    .insert({
      webhook_id: webhook.id,
      organization_id: organizationId,
      event_type: `${payload.table}_${payload.event}`,
      table_name: payload.table,
      operation: payload.event,
      record_id: payload.record?.id,
      payload: webhookPayload,
      endpoint_url: webhook.url,
      status: 'pending',
      retry_count: 0,
      max_retries: webhook.retry_policy.max_retries
    })
    .select()
    .single();

  // Attempt delivery
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
        'X-Event-Type': `${payload.table}_${payload.event}`,
        'X-Organization-ID': organizationId
      },
      body
    });

    const responseBody = await response.text();

    // Update log with result
    await supabase
      .from('webhooks_log')
      .update({
        status: response.ok ? 'delivered' : 'failed',
        response_status: response.status,
        response_body: responseBody,
        error_message: response.ok ? null : `HTTP ${response.status}`,
        delivered_at: response.ok ? new Date().toISOString() : null,
        next_retry_at: response.ok ? null : new Date(Date.now() + webhook.retry_policy.initial_delay).toISOString()
      })
      .eq('id', logEntry?.id);

    console.log(`✅ Webhook delivered to ${webhook.url}: ${response.status}`);
  } catch (error) {
    console.error(`❌ Webhook delivery failed to ${webhook.url}:`, error);
    
    // Update log with error
    await supabase
      .from('webhooks_log')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        next_retry_at: new Date(Date.now() + webhook.retry_policy.initial_delay).toISOString()
      })
      .eq('id', logEntry?.id);
  }
}

export async function POST(req: Request) {
  try {
    const payload: WebhookPayload = await req.json();

    console.log("📩 Supabase webhook received:", {
      table: payload.table,
      event: payload.event,
      organization_id: payload.organization_id
    });

    // Validate payload
    if (!payload.table || !payload.event || !payload.organization_id) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Get webhook settings for this organization
    const { data: webhookSettings, error: webhookError } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('organization_id', payload.organization_id)
      .eq('enabled', true);

    if (webhookError) {
      console.error("Error fetching webhook settings:", webhookError);
      return NextResponse.json({ success: true, received: payload });
    }

    if (!webhookSettings || webhookSettings.length === 0) {
      console.log(`No enabled webhook settings found for organization ${payload.organization_id}`);
      return NextResponse.json({ success: true, received: payload });
    }

    // Filter webhooks that match the event
    const matchingWebhooks = webhookSettings.filter(webhook => {
      const eventType = `${payload.table}_${payload.event}`;
      return webhook.events.includes(eventType) && webhook.resources.includes(payload.table);
    });

    if (matchingWebhooks.length === 0) {
      console.log(`No matching webhook settings for ${payload.table}_${payload.event}`);
      return NextResponse.json({ success: true, received: payload });
    }

    // Enqueue deliveries for all matching webhooks
    const deliveryPromises = matchingWebhooks.map(webhook =>
      enqueueWebhookDelivery(webhook, payload, payload.organization_id)
    );

    await Promise.allSettled(deliveryPromises);

    return NextResponse.json({ success: true, received: payload });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
