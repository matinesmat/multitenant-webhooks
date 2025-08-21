"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOrganizationSlugFromHeaders } from "@/lib/getOrganizationIdFromPath";

// helper: trim => string | null
function strOrNull(v: FormDataEntryValue | null): string | null {
  const t = String(v ?? "").trim();
  return t.length ? t : null;
}

export async function createWebhookAction(fd: FormData, slug?: string) {
  try {
    const name = strOrNull(fd.get("name"));
    const url = strOrNull(fd.get("url"));
    const event_type = strOrNull(fd.get("event_type"));
    const bearer_token = strOrNull(fd.get("bearer_token"));
    const json_body = strOrNull(fd.get("json_body")); // your column is text; keep text
    const orgSlug = slug || getOrganizationSlugFromHeaders();

    if (!name || !url || !event_type || !orgSlug) {
      return { success: false, error: "Required fields missing" };
    }

    const supabase = createServerActionClient({ cookies });

    const insertRow = {
      name,
      url,
      event_type,
      bearer_token,
      json_body,
      org_slug: orgSlug, // <- important
    };

    const { data, error } = await supabase
      .from("webhook_settings")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to create webhook: ${error.message}` };
    }

    // Dispatch to the webhook URL after creation
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bearer_token ? { "Authorization": `Bearer ${bearer_token}` } : {})
        },
        body: json_body || JSON.stringify({ event: "webhook.created", webhook: data })
      });
    } catch {}

    revalidatePath(`/${orgSlug}/dashboard/webhooks`);
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
    const event_type = strOrNull(fd.get("event_type"));
    const bearer_token = strOrNull(fd.get("bearer_token"));
    const json_body = strOrNull(fd.get("json_body"));
    const orgSlug = slug || getOrganizationSlugFromHeaders();
    if (!orgSlug) return { success: false, error: "Organization slug missing" };

    const update: Record<string, string | null> = {};
    if (name !== null) update.name = name;
    if (url !== null) update.url = url;
    if (event_type !== null) update.event_type = event_type;
    if (bearer_token !== null) update.bearer_token = bearer_token;
    if (json_body !== null) update.json_body = json_body;

    if (Object.keys(update).length === 0) {
      return { success: false, error: "No valid updates provided" };
    }

    const supabase = createServerActionClient({ cookies });

    const { data, error } = await supabase
      .from("webhook_settings")
      .update(update)
      .eq("id", id)
      .eq("org_slug", orgSlug) // <- FIX: scope by slug, not org_id
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to update webhook: ${error.message}` };
    }

    // Dispatch to the webhook URL after update
    if (url) {
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(bearer_token ? { "Authorization": `Bearer ${bearer_token}` } : {})
          },
          body: json_body || JSON.stringify({ event: "webhook.updated", webhook: data })
        });
      } catch {}
    }

    revalidatePath(`/${orgSlug}/dashboard/webhooks`);
    return { success: true, data, message: "Webhook updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating webhook: ${(error as Error).message}` };
  }
}

export async function deleteWebhookAction(fd: FormData, slug?: string) {
  try {
    const id = strOrNull(fd.get("id"));
    if (!id) return { success: false, error: "Webhook ID is required" };

    const orgSlug = slug || getOrganizationSlugFromHeaders();

    const supabase = createServerActionClient({ cookies });
    const q = supabase.from("webhook_settings").delete().eq("id", id);
    // In multi-tenant UIs, also scope delete to the tenant:
    if (orgSlug) q.eq("org_slug", orgSlug);

    const { error } = await q;
    if (error) {
      return { success: false, error: `Failed to delete webhook: ${error.message}` };
    }

    // Dispatch to the webhook URL after deletion
    // Fetch the deleted webhook row for details (if needed)
    if (orgSlug && id) {
      try {
        // Try to get the webhook details before deletion (optional)
        const supabase = createServerActionClient({ cookies });
        const { data: webhook } = await supabase
          .from("webhook_settings")
          .select("url,bearer_token,json_body")
          .eq("id", id)
          .eq("org_slug", orgSlug)
          .single();
        if (webhook && webhook.url) {
          await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(webhook.bearer_token ? { "Authorization": `Bearer ${webhook.bearer_token}` } : {})
            },
            body: webhook.json_body || JSON.stringify({ event: "webhook.deleted", webhook_id: id })
          });
        }
      } catch {}
    }
    if (orgSlug) revalidatePath(`/${orgSlug}/dashboard/webhooks`);
    return { success: true, message: "Webhook deleted successfully!" };
  } catch (error) {
    return { success: false, error: `Error deleting webhook: ${(error as Error).message}` };
  }
}
