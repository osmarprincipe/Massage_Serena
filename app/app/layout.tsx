import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/layout/UserNav";

export default async function UserAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <UserNav />
      {/* Content offset for desktop sidebar */}
      <div className="lg:pl-[240px]">
        <main className="min-h-screen">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
