"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { safeDecodeURIComponent } from "@/lib/urlUtils";
import crypto from "crypto";

// Helper function to trim string or return null
function strOrNull(v: FormDataEntryValue | null): string | null {
  const t = String(v ?? "").trim();
  return t.length ? t : null;
}

// Helper function to parse array from form data
function parseArray(v: FormDataEntryValue | null): string[] {
  const str = String(v ?? "").trim();
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
}

// Generate HMAC signature
function generateHmacSignature(body: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

export async function createWebhookAction(fd: FormData, slug?: string) {
  try {
    const name = strOrNull(fd.get("name"));
    const url = strOrNull(fd.get("url"));
    const resources = parseArray(fd.get("resources"));
    const events = parseArray(fd.get("events"));
    const maxRetries = parseInt(String(fd.get("max_retries") ?? "3"));
    const backoffMultiplier = parseInt(String(fd.get("backoff_multiplier") ?? "2"));
    const enabled = fd.get("enabled") === "true";
    const secretKey = strOrNull(fd.get("secret_key")) || crypto.randomBytes(32).toString('hex');
    
    const orgSlug = slug || safeDecodeURIComponent(String(fd.get("org_slug") ?? ""));
    
    if (!name || !url || !orgSlug) {
      return { success: false, error: "Required fields missing" };
    }

    const supabase = createServerActionClient({ cookies });

    const insertRow = {
      name,
      url,
      org_slug: orgSlug,
      enabled,
      resources,
      events,
      secret_key: secretKey,
      event_type: events.join(','), // Store events as comma-separated string for compatibility
      bearer_token: null,
      json_body: null
    };

    const { data, error } = await supabase
      .from("webhook_settings")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to create webhook: ${error.message}` };
    }

    revalidatePath(`/${orgSlug}/dashboard/webhook-settings`);
    return { success: true, data, message: "Webhook created successfully!" };
  } catch (error) {
    return { success: false, error: `Error creating webhook: ${(error as Error).message}` };
  }
}

export async function updateWebhookAction(fd: FormData, slug?: string) {
  try {
    const id = strOrNull(fd.get("id"));
    if (!id) return { success: false, error: "Webhook ID is required" };

    const name = strOrNull(fd.get("name"));
    const url = strOrNull(fd.get("url"));
    const resources = parseArray(fd.get("resources"));
    const events = parseArray(fd.get("events"));
    const maxRetries = parseInt(String(fd.get("max_retries") ?? "3"));
    const backoffMultiplier = parseInt(String(fd.get("backoff_multiplier") ?? "2"));
    const enabled = fd.get("enabled") === "true";
    const secretKey = strOrNull(fd.get("secret_key"));
    
    const orgSlug = slug || safeDecodeURIComponent(String(fd.get("org_slug") ?? ""));

    const update: Record<string, any> = {};
    if (name !== null) update.name = name;
    if (url !== null) update.url = url;
    if (resources.length > 0) update.resources = resources;
    if (events.length > 0) {
      update.events = events;
      update.event_type = events.join(','); // Also update event_type for compatibility
    }
    if (secretKey !== null) update.secret_key = secretKey;
    update.enabled = enabled;

    if (Object.keys(update).length === 0) {
      return { success: false, error: "No valid updates provided" };
    }

    const supabase = createServerActionClient({ cookies });

    const { data, error } = await supabase
      .from("webhook_settings")
      .update(update)
      .eq("id", id)
      .eq("org_slug", orgSlug)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to update webhook: ${error.message}` };
    }

    revalidatePath(`/${orgSlug}/dashboard/webhook-settings`);
    return { success: true, data, message: "Webhook updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating webhook: ${(error as Error).message}` };
  }
}

export async function deleteWebhookAction(fd: FormData, slug?: string) {
  try {
    const id = strOrNull(fd.get("id"));
    if (!id) return { success: false, error: "Webhook ID is required" };

    const orgSlug = slug || safeDecodeURIComponent(String(fd.get("org_slug") ?? ""));

    const supabase = createServerActionClient({ cookies });
    
    const { error } = await supabase
      .from("webhook_settings")
      .delete()
      .eq("id", id)
      .eq("org_slug", orgSlug);

    if (error) {
      return { success: false, error: `Failed to delete webhook: ${error.message}` };
    }

    revalidatePath(`/${orgSlug}/dashboard/webhook-settings`);
    return { success: true, message: "Webhook deleted successfully!" };
  } catch (error) {
    return { success: false, error: `Error deleting webhook: ${(error as Error).message}` };
  }
}

export async function testWebhookAction(fd: FormData, slug?: string) {
  try {
    const webhookId = strOrNull(fd.get("webhook_id"));
    const testUrl = strOrNull(fd.get("test_url"));
    
    if (!webhookId) return { success: false, error: "Webhook ID is required" };

    const supabase = createServerActionClient({ cookies });

    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from("webhook_settings")
      .select("*")
      .eq("id", webhookId)
      .single();

    if (webhookError || !webhook) {
      return { success: false, error: "Webhook not found" };
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
    const response = await fetch(testUrl || webhook.url, {
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

    // Log the test attempt
    await supabase
      .from('webhooks_log')
      .insert({
        webhook_id: webhook.id,
        organization_id: webhook.org_slug,
        event_type: 'test_webhook',
        table_name: 'test',
        operation: 'TEST',
        record_id: 'test-123',
        payload: testPayload,
        endpoint_url: testUrl || webhook.url,
        status: response.ok ? 'delivered' : 'failed',
        response_status: response.status,
        response_body: responseBody,
        error_message: response.ok ? null : `HTTP ${response.status}`,
        delivered_at: response.ok ? new Date().toISOString() : null
      });

    return { 
      success: response.ok, 
      message: response.ok ? 'Test webhook sent successfully!' : `Test failed: ${response.status} ${response.statusText}`,
      response: {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      }
    };
  } catch (error) {
    return { success: false, error: `Error testing webhook: ${(error as Error).message}` };
  }
}
