"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const LIST_PATH = "/dashboard/organizations";

export async function createOrganizationAction(fd: FormData) {
  try {
    const name = String(fd.get("name") ?? "").trim();
    const slug = String(fd.get("slug") ?? "").trim();
    const owner_email = String(fd.get("owner_email") ?? "").trim();

    // Validation
    if (!name || !slug) {
      return { success: false, error: "Organization name and slug are required" };
    }

    if (slug.length < 2) {
      return { success: false, error: "Slug must be at least 2 characters" };
    }

    const supabase = createServerActionClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if organization with same slug already exists
    const { data: existing } = await supabase
      .from("organizations")
      .select("slug")
      .eq("slug", slug)
      .single();

    if (existing) {
      return { success: false, error: "An organization with this slug already exists" };
    }

    // Create organization
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        owner_id: session.user.id,
        owner_email: owner_email || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to create organization: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, data, message: "Organization created successfully!" };
  } catch (error) {
    return { success: false, error: `Error creating organization: ${error}` };
  }
}

export async function updateOrganizationAction(fd: FormData) {
  try {
    const slug = String(fd.get("slug") ?? "").trim(); // Use slug
    if (!slug) {
      return { success: false, error: "Organization slug is required" };
    }

    const nameRaw = String(fd.get("name") ?? "").trim();

    const update: { name?: string } = {};

    // Only update name if provided and valid
    if (nameRaw && nameRaw.length >= 2) {
      update.name = nameRaw;
    }

    const supabase = createServerActionClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch organization by slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();
    if (orgError || !org) {
      return { success: false, error: "Organization not found" };
    }

    // Update organization
    const { data, error } = await supabase
      .from("organizations")
      .update(update)
      .eq("id", org.id) // Use org.id
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to update organization: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, data, message: "Organization updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating organization: ${error}` };
  }
}

export async function deleteOrganizationAction(fd: FormData) {
  try {
    const slug = String(fd.get("slug") ?? "").trim(); // Use slug
    if (!slug) {
      return { success: false, error: "Organization slug is required" };
    }

    const supabase = createServerActionClient({ cookies });

    // Fetch organization by slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();
    if (orgError || !org) {
      return { success: false, error: "Organization not found" };
    }

    // Check if organization has associated students
    const { data: students } = await supabase
      .from("students")
      .select("id")
      .eq("org_id", org.id)
      .limit(1);

    if (students && students.length > 0) {
      return { success: false, error: "Cannot delete organization: It has associated students" };
    }

    // Check if organization has associated webhooks
    const { data: webhooks } = await supabase
      .from("webhook_settings")
      .select("id")
      .eq("org_id", org.id)
      .limit(1);

    if (webhooks && webhooks.length > 0) {
      return { success: false, error: "Cannot delete organization: It has associated webhooks" };
    }

    // Delete organization
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", org.id); // Use org.id

    if (error) {
      return { success: false, error: `Failed to delete organization: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, message: "Organization deleted successfully!" };
  } catch (error) {
    return { success: false, error: `Error deleting organization: ${error}` };
  }
}
