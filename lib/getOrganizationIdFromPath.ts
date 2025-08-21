import { headers } from "next/headers";

export function getOrganizationSlugFromPath(path: string): string | null {
	try {
		const url = new URL(path, "http://localhost");
		const segments = url.pathname.split("/").filter(Boolean);
		return segments.length > 0 ? segments[0] : null;
	} catch {
		const segments = path.split("/").filter(Boolean);
		return segments.length > 0 ? segments[0] : null;
	}
}

export async function getOrganizationSlugFromHeaders(): Promise<string | null> {
	const hdrs = await headers();
	const referer = hdrs.get("referer");
	if (!referer) return null;
	return getOrganizationSlugFromPath(referer);
}


