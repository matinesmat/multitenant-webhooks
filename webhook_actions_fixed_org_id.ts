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

// Generate HMAC signature (only if secret key is provided)
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
    const secretKey = strOrNull(fd.get("secret_key")); // Optional secret key
    
    const orgSlug = slug || safeDecodeURIComponent(String(fd.get("org_slug") ?? ""));
    
    if (!name || !url || !orgSlug) {
      return { success: false, error: "Required fields missing" };
    }

    const supabase = createServerActionClient({ cookies });

    // Get the organization ID from the slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return { success: false, error: "Organization not found" };
    }

    const insertRow = {
      name,
      url,
      org_slug: orgSlug,
      org_id: org.id, // Add the organization ID
      enabled,
      resources,
      events,
      secret_key: secretKey || null, // Store as null if no secret key provided
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

    // Test the webhook (optional, without secret key)
    try {
      const testPayload = {
        event: "webhook.created",
        webhook: data,
        timestamp: new Date().toISOString()
      };

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Event-Type": "webhook.created",
          "X-Organization-Slug": orgSlug
        },
        body: JSON.stringify(testPayload)
      });
    } catch (testError) {
      // Test failed, but webhook was created successfully
      console.log("Webhook test failed, but webhook was created:", testError);
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
    const secretKey = strOrNull(fd.get("secret_key")); // Optional secret key
    
    const orgSlug = slug || safeDecodeURIComponent(String(fd.get("org_slug") ?? ""));

    const supabase = createServerActionClient({ cookies });

    const updateRow = {
      name,
      url,
      enabled,
      resources,
      events,
      secret_key: secretKey || null, // Store as null if no secret key provided
      event_type: events.join(','),
      retry_policy: {
        max_retries: maxRetries,
        backoff_multiplier: backoffMultiplier,
        initial_delay: 1000
      }
    };

    const { data, error } = await supabase
      .from("webhook_settings")
      .update(updateRow)
      .eq("id", id)
      .eq("org_slug", orgSlug)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to update webhook: ${error.message}` };
    }

    // Test the webhook (optional, without secret key)
    if (url) {
      try {
        const testPayload = {
          event: "webhook.updated",
          webhook: data,
          timestamp: new Date().toISOString()
        };

        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Event-Type": "webhook.updated",
            "X-Organization-Slug": orgSlug
          },
          body: JSON.stringify(testPayload)
        });
      } catch (testError) {
        // Test failed, but webhook was updated successfully
        console.log("Webhook test failed, but webhook was updated:", testError);
      }
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
