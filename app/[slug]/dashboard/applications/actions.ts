"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOrganizationSlugFromHeaders } from "@/lib/getOrganizationIdFromPath";

export async function createApplicationAction(fd: FormData, slug?: string) {
	try {
		const student_id = String(fd.get("student_id") ?? "").trim();
		const agency_id = String(fd.get("agency_id") ?? "").trim();
		const status = String(fd.get("status") ?? "pending").trim();
		const notes = String(fd.get("notes") ?? "").trim();
		const orgId = slug || getOrganizationSlugFromHeaders();

		if (!student_id || !agency_id || !orgId) {
			return { success: false, error: "Required fields missing" };
		}

		const supabase = createServerActionClient({ cookies });

		// Ensure the organization with the given slug exists
		const { data: org, error: orgError } = await supabase
			.from("organizations")
			.select("id")
			.eq("slug", slug)
			.single();

		if (orgError || !org) {
			return { success: false, error: "Organization not found" };
		}

		const { data, error } = await supabase
			.from("applications")
			.insert({ 
				student_id, 
				agency_id, 
				status, 
				notes, 
				organization_id: org.id 
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: `Failed to create application: ${error.message}` };
		}

		revalidatePath(`/${slug}/dashboard/applications`);
		return { success: true, data, message: "Application created successfully!" };
	} catch (error) {
		return { success: false, error: `Error creating application: ${error}` };
	}
}

export async function updateApplicationAction(fd: FormData, slug?: string) {
	try {
		const id = String(fd.get("id") ?? "").trim();
		const student_id = String(fd.get("student_id") ?? "").trim();
		const agency_id = String(fd.get("agency_id") ?? "").trim();
		const status = String(fd.get("status") ?? "pending").trim();
		const notes = String(fd.get("notes") ?? "").trim();

		if (!id || !student_id || !agency_id) {
			return { success: false, error: "Required fields missing" };
		}

		const supabase = createServerActionClient({ cookies });

		const { data, error } = await supabase
			.from("applications")
			.update({ student_id, agency_id, status, notes })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			return { success: false, error: `Failed to update application: ${error.message}` };
		}

		revalidatePath(`/${slug}/dashboard/applications`);
		return { success: true, data, message: "Application updated successfully!" };
	} catch (error) {
		return { success: false, error: `Error updating application: ${error}` };
	}
}

export async function deleteApplicationAction(id: string) {
	try {
		if (!id) {
			return { success: false, error: "Application ID is required" };
		}

		const supabase = createServerActionClient({ cookies });

		const { error } = await supabase
			.from("applications")
			.delete()
			.eq("id", id);

		if (error) {
			return { success: false, error: `Failed to delete application: ${error.message}` };
		}

		const slug = await getOrganizationSlugFromHeaders();
		if (slug) revalidatePath(`/${slug}/dashboard/applications`);

		return { success: true, message: "Application deleted successfully!" };
	} catch (error) {
		return { success: false, error: `Error deleting application: ${error}` };
	}
}
