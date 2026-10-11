import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/shared/DashboardLayout";

// Middleware already guards this route — this layout just renders the shell.
// getServerSession is cached by Next.js per request, so this is a cache hit, not a new DB call.
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "INTERN") redirect("/");
  return <DashboardLayout>{children}</DashboardLayout>;
}
