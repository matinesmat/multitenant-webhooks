"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOrganizationSlugFromHeaders } from "@/lib/getOrganizationIdFromPath";

export async function createStudentAction(fd: FormData, slug?: string) {
	try {
		const first_name = String(fd.get("first_name") ?? "").trim();
		const last_name = String(fd.get("last_name") ?? "").trim();
		const email = String(fd.get("email") ?? "").trim();
		const orgId = slug || getOrganizationSlugFromHeaders();

		if (!first_name || !last_name || !email || !orgId) {
			return { success: false, error: "Required fields missing" };
		}

		const supabase = createServerActionClient({ cookies });

		// Ensure the organization with the given slug exists
		const { data: org, error: orgError } = await supabase
			.from("organizations")
			.select("id") // Fetch the organization ID
			.eq("slug", slug)
			.single();

		if (orgError || !org) {
			return { success: false, error: "Organization not found" };
		}

		const { data, error } = await supabase
			.from("students")
			.insert({ first_name, last_name, email, org_id: org.id }) // Use the organization ID
			.select()
			.single();

		if (error) {
			return { success: false, error: `Failed to create student: ${error.message}` };
		}

		// Dispatch webhooks for student.created
		const { data: webhooks } = await supabase
			.from("webhook_settings")
			.select("url,bearer_token,json_body,event_type")
			.eq("org_slug", slug)
			.eq("event_type", "student.created");

		if (webhooks && Array.isArray(webhooks)) {
			for (const webhook of webhooks) {
				try {
					await fetch(webhook.url, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(webhook.bearer_token ? { "Authorization": `Bearer ${webhook.bearer_token}` } : {})
						},
						body: webhook.json_body || JSON.stringify({ event: "student.created", student: data })
					});
				} catch {
					// Optionally log or handle webhook delivery errors
				}
			}
		}

		revalidatePath(`/${slug}/dashboard/students`);
		return { success: true, data, message: "Student created successfully!" };
	} catch (error) {
		return { success: false, error: `Error creating student: ${error}` };
	}
}

export async function updateStudentAction(fd: FormData, slug?: string) {
	try {
		const id = String(fd.get("id") ?? "").trim();
		if (!id) return { success: false, error: "Student ID is required" };

		const first_name = String(fd.get("first_name") ?? "").trim();
		const last_name = String(fd.get("last_name") ?? "").trim();
		const email = String(fd.get("email") ?? "").trim();
		const orgId = slug || getOrganizationSlugFromHeaders();

		const update: { first_name?: string; last_name?: string; email?: string } = {};
		if (first_name) update.first_name = first_name;
		if (last_name) update.last_name = last_name;
		if (email) update.email = email;

		if (Object.keys(update).length === 0) {
			return { success: false, error: "No valid updates provided" };
		}

		const supabase = createServerActionClient({ cookies });
		const { data, error } = await supabase
			.from("students")
			.update(update)
			.eq("id", id)
			.eq("org_id", orgId ?? "")
			.select()
			.single();

		if (error) {
			return { success: false, error: `Failed to update student: ${error.message}` };
		}

		// Dispatch webhooks for student.updated
		const { data: webhooks } = await supabase
			.from("webhook_settings")
			.select("url,bearer_token,json_body,event_type")
			.eq("org_slug", slug)
			.eq("event_type", "student.updated");

		if (webhooks && Array.isArray(webhooks)) {
			for (const webhook of webhooks) {
				try {
					await fetch(webhook.url, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(webhook.bearer_token ? { "Authorization": `Bearer ${webhook.bearer_token}` } : {})
						},
						body: webhook.json_body || JSON.stringify({ event: "student.updated", student: data })
					});
				} catch {
					// Optionally log or handle webhook delivery errors
				}
			}
		}

		revalidatePath(`/${slug}/dashboard/students`);
		return { success: true, data, message: "Student updated successfully!" };
	} catch (error) {
		return { success: false, error: `Error updating student: ${error}` };
	}
}

export async function deleteStudentAction(fd: FormData) {
	try {
		const id = String(fd.get("id") ?? "").trim();
		if (!id) return { success: false, error: "Student ID is required" };

		const supabase = createServerActionClient({ cookies });
		const { error } = await supabase.from("students").delete().eq("id", id);
		if (error) {
			return { success: false, error: `Failed to delete student: ${error.message}` };
		}

		const slug = await getOrganizationSlugFromHeaders();
		if (slug) revalidatePath(`/${slug}/dashboard/students`);

		// Dispatch webhooks for student.deleted
		if (slug) {
			const supabase = createServerActionClient({ cookies });
			const { data: webhooks } = await supabase
				.from("webhook_settings")
				.select("url,bearer_token,json_body,event_type")
				.eq("org_slug", slug)
				.eq("event_type", "student.deleted");

			if (webhooks && Array.isArray(webhooks)) {
				for (const webhook of webhooks) {
					try {
						await fetch(webhook.url, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								...(webhook.bearer_token ? { "Authorization": `Bearer ${webhook.bearer_token}` } : {})
							},
							body: webhook.json_body || JSON.stringify({ event: "student.deleted", student_id: id })
						});
					} catch {
						// Optionally log or handle webhook delivery errors
					}
				}
			}
		}
		return { success: true, message: "Student deleted successfully!" };
	} catch (error) {
		return { success: false, error: `Error deleting student: ${error}` };
	}
}


