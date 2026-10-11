import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/shared/DashboardLayout";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <DashboardLayout>{children}</DashboardLayout>;
}
