import { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardShell from "@/components/DashboardShell";

export default async function OrgDashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	const supabase = createServerComponentClient({ cookies });
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	const userName =
		(user?.user_metadata?.full_name as string | undefined)?.trim() ||
		(user?.user_metadata?.name as string | undefined)?.trim() ||
		user?.email ||
		"User";

	return <DashboardShell userName={userName}>{children}</DashboardShell>;
}


