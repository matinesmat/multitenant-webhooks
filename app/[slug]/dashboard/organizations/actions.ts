"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOrganizationSlugFromHeaders } from "@/lib/getOrganizationIdFromPath";

export async function createOrganizationAction(fd: FormData) {
	try {
		const name = String(fd.get("name") ?? "").trim();
		const ownerEmail = String(fd.get("owner_email") ?? "").trim();
		
		if (!name) return { success: false, error: "Organization name is required" };
		if (name.length < 2) return { success: false, error: "Organization name must be at least 2 characters" };

		const supabase = createServerActionClient({ cookies });
		const { data: { session } } = await supabase.auth.getSession();
		if (!session?.user) return { success: false, error: "Unauthorized" };

		// Generate slug from name
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

		const { data: existing } = await supabase
			.from("organizations")
			.select("id")
			.eq("name", name)
			.single();
		if (existing) return { success: false, error: "An organization with this name already exists" };

		const { data, error } = await supabase
			.from("organizations")
			.insert({ 
				name, 
				slug,
				owner_id: session.user.id,
				owner_email: ownerEmail || session.user.email
			})
			.select()
			.single();
		if (error) return { success: false, error: `Failed to create organization: ${error.message}` };

		// If created, revalidate current org-scoped list if present
		const orgId = getOrganizationSlugFromHeaders();
		if (orgId) revalidatePath(`/${orgId}/dashboard/organizations`);
		return { success: true, data, message: "Organization created successfully!" };
	} catch (error) {
		return { success: false, error: `Error creating organization: ${error}` };
	}
}

export async function updateOrganizationAction(fd: FormData) {
	try {
		const id = String(fd.get("id") ?? "").trim();
		if (!id) return { success: false, error: "Organization ID is required" };

		const nameRaw = String(fd.get("name") ?? "").trim();
		const ownerEmailRaw = String(fd.get("owner_email") ?? "").trim();
		
		const update: { name?: string; slug?: string; owner_email?: string } = {};
		if (nameRaw && nameRaw.length >= 2) {
			update.name = nameRaw;
			update.slug = nameRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
		}
		if (ownerEmailRaw) update.owner_email = ownerEmailRaw;
		
		if (Object.keys(update).length === 0) return { success: false, error: "No valid updates provided" };

		const supabase = createServerActionClient({ cookies });
		const { data: { session } } = await supabase.auth.getSession();
		if (!session?.user) return { success: false, error: "Unauthorized" };

		const { data: existing } = await supabase
			.from("organizations")
			.select("id")
			.eq("id", id)
			.single();
		if (!existing) return { success: false, error: "Organization not found" };

		if (update.name) {
			const { data: duplicate } = await supabase
				.from("organizations")
				.select("id")
				.eq("name", update.name)
				.neq("id", id)
				.single();
			if (duplicate) return { success: false, error: "An organization with this name already exists" };
		}

		const { data, error } = await supabase
			.from("organizations")
			.update(update)
			.eq("id", id)
			.select()
			.single();
		if (error) return { success: false, error: `Failed to update organization: ${error.message}` };

		const orgId = getOrganizationSlugFromHeaders();
		if (orgId) revalidatePath(`/${orgId}/dashboard/organizations`);
		return { success: true, data, message: "Organization updated successfully!" };
	} catch (error) {
		return { success: false, error: `Error updating organization: ${error}` };
	}
}

export async function deleteOrganizationAction(fd: FormData) {
	try {
		const id = String(fd.get("id") ?? "").trim();
		if (!id) return { success: false, error: "Organization ID is required" };

		const supabase = createServerActionClient({ cookies });

		const { data: existing } = await supabase
			.from("organizations")
			.select("id")
			.eq("id", id)
			.single();
		if (!existing) return { success: false, error: "Organization not found" };

		const { data: students } = await supabase
			.from("students")
			.select("id")
			.eq("org_id", id)
			.limit(1);
		if (students && students.length > 0) return { success: false, error: "Cannot delete organization: It has associated students" };

		const { data: webhooks } = await supabase
			.from("webhook_settings")
			.select("id")
			.eq("org_id", id)
			.limit(1);
		if (webhooks && webhooks.length > 0) return { success: false, error: "Cannot delete organization: It has associated webhooks" };

		const { error } = await supabase.from("organizations").delete().eq("id", id);
		if (error) return { success: false, error: `Failed to delete organization: ${error.message}` };

		const orgId = getOrganizationSlugFromHeaders();
		if (orgId) revalidatePath(`/${orgId}/dashboard/organizations`);
		return { success: true, message: "Organization deleted successfully!" };
	} catch (error) {
		return { success: false, error: `Error deleting organization: ${error}` };
	}
}


