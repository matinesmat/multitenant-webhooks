"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOrganizationSlugFromHeaders } from "@/lib/getOrganizationIdFromPath";

export async function createAgencyAction(fd: FormData, slug?: string) {
	try {
		const name = String(fd.get("name") ?? "").trim();
		const contact_email = String(fd.get("contact_email") ?? "").trim();
		const contact_phone = String(fd.get("contact_phone") ?? "").trim();
		const address = String(fd.get("address") ?? "").trim();
		const orgId = slug || getOrganizationSlugFromHeaders();

		if (!name || !contact_email || !orgId) {
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
			.from("agencies")
			.insert({ 
				name, 
				email: contact_email, 
				phone: contact_phone, 
				metadata: address ? { address } : null, 
				org_id: org.id 
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: `Failed to create agency: ${error.message}` };
		}

		revalidatePath(`/${slug}/dashboard/agencies`);
		return { success: true, data, message: "Agency created successfully!" };
	} catch (error) {
		return { success: false, error: `Error creating agency: ${error}` };
	}
}

export async function updateAgencyAction(fd: FormData, slug?: string) {
	try {
		const id = String(fd.get("id") ?? "").trim();
		const name = String(fd.get("name") ?? "").trim();
		const contact_email = String(fd.get("contact_email") ?? "").trim();
		const contact_phone = String(fd.get("contact_phone") ?? "").trim();
		const address = String(fd.get("address") ?? "").trim();

		if (!id || !name || !contact_email) {
			return { success: false, error: "Required fields missing" };
		}

		const supabase = createServerActionClient({ cookies });

		const { data, error } = await supabase
			.from("agencies")
			.update({ 
				name, 
				email: contact_email, 
				phone: contact_phone, 
				metadata: address ? { address } : null 
			})
			.eq("id", id)
			.select()
			.single();

		if (error) {
			return { success: false, error: `Failed to update agency: ${error.message}` };
		}

		revalidatePath(`/${slug}/dashboard/agencies`);
		return { success: true, data, message: "Agency updated successfully!" };
	} catch (error) {
		return { success: false, error: `Error updating agency: ${error}` };
	}
}

export async function deleteAgencyAction(id: string) {
	try {
		if (!id) {
			return { success: false, error: "Agency ID is required" };
		}

		const supabase = createServerActionClient({ cookies });

		const { error } = await supabase
			.from("agencies")
			.delete()
			.eq("id", id);

		if (error) {
			return { success: false, error: `Failed to delete agency: ${error.message}` };
		}

		const slug = await getOrganizationSlugFromHeaders();
		if (slug) revalidatePath(`/${slug}/dashboard/agencies`);

		return { success: true, message: "Agency deleted successfully!" };
	} catch (error) {
		return { success: false, error: `Error deleting agency: ${error}` };
	}
}
