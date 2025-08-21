"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const LIST_PATH = "/dashboard/webhooks";

const ALLOWED_EVENT_TYPES = [
  "student.created",
  "student.updated",
  "student.deleted",
] as const;

const isAllowedEventType = (value: string) =>
  (ALLOWED_EVENT_TYPES as readonly string[]).includes(value);

export async function createWebhookAction(fd: FormData) {
  try {
    const name = String(fd.get("name") ?? "").trim();
    const url = String(fd.get("url") ?? "").trim();
    const event_type = String(fd.get("event_type") ?? "").trim();
    const org_slug = String(fd.get("org_slug") ?? "").trim(); // Use slug
    const bearer_token_raw = String(fd.get("bearer_token") ?? "").trim();
    const json_body_raw = String(fd.get("json_body") ?? "").trim();

    if (!name || !url || !event_type || !org_slug || !bearer_token_raw || !json_body_raw) {
      return { success: false, error: "All fields are required" };
    }

    const supabase = createServerActionClient({ cookies });
    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("slug", org_slug)
      .single();

    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase.from("webhook_settings").insert({
      name,
      url,
      event_type,
      org_slug, // Use slug
      bearer_token: bearer_token_raw,
      json_body: json_body_raw,
    }).select().single();

    if (error) {
      return { success: false, error: `Failed to create webhook: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, data, message: "Webhook created successfully!" };
  } catch (error) {
    return { success: false, error: `Error creating webhook: ${error}` };
  }
}

export async function updateWebhookAction(fd: FormData) {
  try {
    const id = String(fd.get("id") ?? "").trim();
    if (!id) {
      return { success: false, error: "Webhook ID is required" };
    }

    const name = String(fd.get("name") ?? "").trim();
    const url = String(fd.get("url") ?? "").trim();
    const event_type = String(fd.get("event_type") ?? "").trim();
    const org_slug = String(fd.get("org_slug") ?? "").trim(); // Use slug
    const bearer_token_raw = String(fd.get("bearer_token") ?? "").trim();
    const json_body_raw = String(fd.get("json_body") ?? "").trim();

    const update: {
      name?: string;
      url?: string;
      event_type?: string;
      org_slug?: string; // Use slug
      bearer_token?: string;
      json_body?: string;
    } = {};

    if (name) update.name = name;
    if (url) update.url = url;
    if (event_type) {
      if (!isAllowedEventType(event_type)) {
        return {
          success: false,
          error: `Invalid event type. Allowed: ${ALLOWED_EVENT_TYPES.join(", ")}`,
        };
      }
      update.event_type = event_type;
    }
    if (org_slug) update.org_slug = org_slug; // Use slug
    if (bearer_token_raw) update.bearer_token = bearer_token_raw;
    if (json_body_raw) update.json_body = json_body_raw;

    if (Object.keys(update).length === 0) {
      return { success: false, error: "No valid updates provided" };
    }

    const supabase = createServerActionClient({ cookies });
    const { data, error } = await supabase.from("webhook_settings").update(update).eq("id", id).select().single();

    if (error) {
      return { success: false, error: `Failed to update webhook: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, data, message: "Webhook updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating webhook: ${error}` };
  }
}

export async function deleteWebhookAction(fd: FormData) {
  try {
    const id = String(fd.get("id") ?? "").trim();
    if (!id) {
      return { success: false, error: "Webhook ID is required" };
    }

    const supabase = createServerActionClient({ cookies });
    const { error } = await supabase.from("webhook_settings").delete().eq("id", id);

    if (error) {
      return { success: false, error: `Failed to delete webhook: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, message: "Webhook deleted successfully!" };
  } catch (error) {
    return { success: false, error: `Error deleting webhook: ${error}` };
  }
}
