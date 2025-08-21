"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createOrganizationFromForm(fd: FormData) {
	const supabase = createServerActionClient({ cookies });
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.user) redirect("/login");

	const idRaw = String(fd.get("id") ?? "").trim();
	const ownerIdRaw = String(fd.get("owner_id") ?? "").trim();
	const name = String(fd.get("name") ?? "").trim();
	const slugInput = String(fd.get("slug") ?? "").trim();
	const file = fd.get("photo") as File | null;

	if (!name) redirect("/select-organization?create=1&error=name_required");
	if (!slugInput) redirect("/select-organization?create=1&error=slug_required");

	let logoUrl: string | null = null;
	if (file && file.size > 0) {
		const extFromType = (file.type?.split("/")?.[1] || "png").replace(/[^a-zA-Z0-9]/g, "");
		const random = Math.random().toString(36).slice(2);
		const fileName = `${session.user.id}/${Date.now()}_${random}.${extFromType}`;
		const { error: uploadError } = await supabase.storage
			.from("org-logos")
			.upload(fileName, file);
		if (!uploadError) {
			const { data: pub } = supabase.storage
				.from("org-logos")
				.getPublicUrl(fileName);
			logoUrl = pub.publicUrl ?? null;
		}
	}

	const baseInsert: Record<string, unknown> = {
		name,
		slug: slugInput,
		owner_id: ownerIdRaw || session.user.id,
	};
	if (idRaw) baseInsert.id = idRaw;

	async function insertWith(fields: Record<string, unknown>) {
		return supabase.from("organizations").insert(fields).select("slug").single();
	}

	let insertResult = await insertWith(logoUrl ? { ...baseInsert, logo_url: logoUrl } : baseInsert);
	if (insertResult.error && logoUrl) {
		insertResult = await insertWith(baseInsert);
	}

	const createdSlug = insertResult.data?.slug as string | undefined;
	if (!createdSlug) redirect("/select-organization?create=1&error=insert_failed");
	redirect(`/${createdSlug}/dashboard/students`);
}

export async function updateOrganizationFromForm(fd: FormData) {
    const supabase = createServerActionClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) redirect('/login');

    const id = String(fd.get('id') ?? '').trim();
    if (!id) redirect('/select-organization?error=missing_id');

    const name = String(fd.get('name') ?? '').trim();
    const file = fd.get('photo') as File | null;

    const update: Record<string, unknown> = {};
    if (name) update.name = name;

    if (file && file.size > 0) {
        const extFromType = (file.type?.split('/')?.[1] || 'png').replace(/[^a-zA-Z0-9]/g, '');
        const random = Math.random().toString(36).slice(2);
        const fileName = `${session.user.id}/${Date.now()}_${random}.${extFromType}`;
        const { error: uploadError } = await supabase.storage.from('org-logos').upload(fileName, file);
        if (!uploadError) {
            const { data: pub } = supabase.storage.from('org-logos').getPublicUrl(fileName);
            const logoUrl = pub.publicUrl ?? null;
            if (logoUrl) update.logo_url = logoUrl;
        }
    }

    if (Object.keys(update).length === 0) redirect('/select-organization');

    await supabase.from('organizations').update(update).eq('id', id);
    redirect('/select-organization?updated=1');
}

export async function deleteOrganizationFromForm(fd: FormData) {
    const supabase = createServerActionClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) redirect('/login');

    const id = String(fd.get('id') ?? '').trim();
    if (!id) redirect('/select-organization?error=missing_id');

    await supabase.from('organizations').delete().eq('id', id);
    redirect('/select-organization?deleted=1');
}


