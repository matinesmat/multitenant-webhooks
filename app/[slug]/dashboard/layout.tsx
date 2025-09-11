import { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardShell from "@/components/DashboardShell";

export default async function OrgDashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	const cookieStore = await cookies();
	const supabase = createServerComponentClient({ cookies: () => cookieStore });
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	return <DashboardShell>{children}</DashboardShell>;
}


