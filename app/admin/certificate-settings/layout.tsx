import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import { redirect } from "next/navigation";

// DashboardLayout already applied by parent /app/admin/layout.tsx
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/");
  return <>{children}</>;
}
