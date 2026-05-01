import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/layout/UserNav";
import { MemberPageOverlay } from "@/components/layout/MemberPageOverlay";

export default async function UserAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin/dashboard");

  return (
    <div className="min-h-screen relative">

      {/* ── Cinematic background — fixed behind the entire member area ── */}
      <div
        className="fixed inset-0 overflow-hidden"
        style={{ background: "#070305", zIndex: -10 }}
        aria-hidden
      >
        {/* Primary nebula bloom — left-center */}
        <div
          style={{
            position: "absolute",
            top: "5%", left: "-18%",
            width: "85%", height: "95%",
            background:
              "radial-gradient(ellipse at center, rgba(140,8,25,0.72) 0%, rgba(100,5,18,0.48) 28%, rgba(60,3,12,0.22) 54%, transparent 74%)",
            filter: "blur(60px)",
            transform: "rotate(-8deg)",
          }}
        />
        {/* Secondary bloom — upper right */}
        <div
          style={{
            position: "absolute",
            top: "-8%", right: "-8%",
            width: "62%", height: "72%",
            background:
              "radial-gradient(ellipse at center, rgba(100,5,18,0.48) 0%, rgba(65,3,12,0.28) 38%, transparent 64%)",
            filter: "blur(65px)",
          }}
        />
        {/* Lower atmospheric warmth */}
        <div
          style={{
            position: "absolute",
            bottom: "-18%", left: "10%",
            width: "80%", height: "65%",
            background:
              "radial-gradient(ellipse at bottom center, rgba(110,8,22,0.38) 0%, rgba(65,4,14,0.18) 45%, transparent 68%)",
            filter: "blur(75px)",
          }}
        />
        {/* Subtle gold warmth accent */}
        <div
          style={{
            position: "absolute",
            top: "22%", left: "38%",
            width: "26%", height: "32%",
            background: "radial-gradient(circle, rgba(180,130,20,0.09) 0%, transparent 68%)",
            filter: "blur(35px)",
          }}
        />
        {/* Vignette — darkens edges for depth */}
        <div
          style={{
            position: "absolute", inset: 0,
            background:
              "radial-gradient(ellipse 115% 105% at 50% 50%, transparent 22%, rgba(4,1,2,0.55) 68%, rgba(4,1,2,0.90) 100%)",
          }}
        />
        {/* Top fade */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "200px",
            background: "linear-gradient(to bottom, rgba(5,2,3,0.90) 0%, transparent 100%)",
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "300px",
            background: "linear-gradient(to top, rgba(5,2,3,0.75) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Per-page adaptive dark overlay — controls how much background shows per route */}
      <MemberPageOverlay />

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
