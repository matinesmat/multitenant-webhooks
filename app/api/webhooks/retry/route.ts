import { NextResponse } from "next/server";
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

// Retry failed webhook deliveries
export async function POST(req: Request) {
  try {
    // Get failed webhooks that are ready for retry
    const { data: failedWebhooks, error } = await supabase
      .from('webhooks_log')
      .select(`
        *,
        webhook_settings!inner(
          id,
          name,
          url,
          secret_key,
          retry_policy
        )
      `)
      .eq('status', 'failed')
      .lt('retry_count', supabase.raw('max_retries'))
      .lte('next_retry_at', new Date().toISOString())
      .limit(10);

    if (error) {
      console.error("Error fetching failed webhooks:", error);
      return NextResponse.json({ success: false, error: error.message });
    }

    if (!failedWebhooks || failedWebhooks.length === 0) {
      return NextResponse.json({ success: true, message: "No webhooks to retry" });
    }

    const retryResults = [];

    for (const webhookLog of failedWebhooks) {
      const webhook = webhookLog.webhook_settings;
      const retryCount = webhookLog.retry_count + 1;
      const delay = webhook.retry_policy.initial_delay * Math.pow(webhook.retry_policy.backoff_multiplier, retryCount - 1);

      try {
        // Update status to retrying
        await supabase
          .from('webhooks_log')
          .update({ status: 'retrying' })
          .eq('id', webhookLog.id);

        const body = JSON.stringify(webhookLog.payload);
        const signature = generateHmacSignature(body, webhook.secret_key);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': `sha256=${signature}`,
            'X-Event-Type': webhookLog.event_type,
            'X-Organization-ID': webhookLog.organization_id,
            'X-Retry-Count': retryCount.toString()
          },
          body
        });

        const responseBody = await response.text();

        if (response.ok) {
          // Success
          await supabase
            .from('webhooks_log')
            .update({
              status: 'delivered',
              response_status: response.status,
              response_body: responseBody,
              retry_count: retryCount,
              delivered_at: new Date().toISOString(),
              next_retry_at: null
            })
            .eq('id', webhookLog.id);

          retryResults.push({
            id: webhookLog.id,
            status: 'success',
            retry_count: retryCount
          });
        } else {
          // Still failed
          const isMaxRetries = retryCount >= webhookLog.max_retries;
          
          await supabase
            .from('webhooks_log')
            .update({
              status: isMaxRetries ? 'failed' : 'failed',
              response_status: response.status,
              response_body: responseBody,
              error_message: `HTTP ${response.status}`,
              retry_count: retryCount,
              next_retry_at: isMaxRetries ? null : new Date(Date.now() + delay).toISOString()
            })
            .eq('id', webhookLog.id);

          retryResults.push({
            id: webhookLog.id,
            status: isMaxRetries ? 'max_retries_exceeded' : 'failed',
            retry_count: retryCount
          });
        }
      } catch (error) {
        // Network or other error
        const isMaxRetries = retryCount >= webhookLog.max_retries;
        
        await supabase
          .from('webhooks_log')
          .update({
            status: isMaxRetries ? 'failed' : 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: retryCount,
            next_retry_at: isMaxRetries ? null : new Date(Date.now() + delay).toISOString()
          })
          .eq('id', webhookLog.id);

        retryResults.push({
          id: webhookLog.id,
          status: isMaxRetries ? 'max_retries_exceeded' : 'failed',
          retry_count: retryCount,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: retryResults.length,
      results: retryResults
    });
  } catch (error) {
    console.error("❌ Error retrying webhooks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retry webhooks" },
      { status: 500 }
    );
  }
}
