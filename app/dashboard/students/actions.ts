"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const LIST_PATH = "/dashboard/students";

export async function createStudentAction(fd: FormData) {
  try {
    const first_name = String(fd.get("first_name") ?? "").trim();
    const last_name = String(fd.get("last_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const org_slug = String(fd.get("org_slug") ?? "").trim(); // Use slug

    if (!first_name || !last_name || !email || !org_slug) {
      return { success: false, error: "All fields are required" };
    }

    const supabase = createServerActionClient({ cookies });
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", org_slug)
      .single();

    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase.from("students").insert({
      first_name,
      last_name,
      email,
      org_id: org.id, // Use organization ID instead of slug
    }).select().single();

    if (error) {
      return { success: false, error: `Failed to create student: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, data, message: "Student created successfully!" };
  } catch (error) {
    return { success: false, error: `Error creating student: ${error}` };
  }
}

export async function updateStudentAction(fd: FormData) {
  try {
    const id = String(fd.get("id") ?? "").trim();
    if (!id) {
      return { success: false, error: "Student ID is required" };
    }

    const first_name = String(fd.get("first_name") ?? "").trim();
    const last_name = String(fd.get("last_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const org_slug = String(fd.get("org_slug") ?? "").trim(); // Use slug

    const update: { first_name?: string; last_name?: string; email?: string; org_slug?: string } = {};
    if (first_name) update.first_name = first_name;
    if (last_name) update.last_name = last_name;
    if (email) update.email = email;
    if (org_slug) update.org_slug = org_slug;

    if (Object.keys(update).length === 0) {
      return { success: false, error: "No valid updates provided" };
    }

    const supabase = createServerActionClient({ cookies });
    const { data, error } = await supabase.from("students").update(update).eq("id", id).select().single();

    if (error) {
      return { success: false, error: `Failed to update student: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, data, message: "Student updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating student: ${error}` };
  }
}

export async function deleteStudentAction(fd: FormData) {
  try {
    const id = String(fd.get("id") ?? "").trim();
    if (!id) {
      return { success: false, error: "Student ID is required" };
    }

    const supabase = createServerActionClient({ cookies });
    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) {
      return { success: false, error: `Failed to delete student: ${error.message}` };
    }

    revalidatePath(LIST_PATH);
    return { success: true, message: "Student deleted successfully!" };
  } catch (error) {
    return { success: false, error: `Error deleting student: ${error}` };
  }
}
