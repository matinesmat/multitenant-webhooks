import { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function DashboardServerLayout({
  children,
}: {
  children: ReactNode;
}) {
  redirect("/select-organization");
}
