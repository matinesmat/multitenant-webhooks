// Removed unused ReactNode import
import { redirect } from "next/navigation";

export default async function DashboardServerLayout({
}: object) {
  redirect("/select-organization");
}
