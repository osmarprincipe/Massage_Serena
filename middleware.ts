import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isAdmin = token?.role === "ADMIN";
    const isUser = token?.role === "USER";

    // /admin/* — only ADMIN
    if (pathname.startsWith("/admin")) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/app/dashboard", req.url));
      }
    }

    // /app/* — only USER (admins go to their own portal)
    if (pathname.startsWith("/app")) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    // Legacy /dashboard routes — redirect based on role
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/bookings") ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/users") ||
      pathname.startsWith("/memberships") ||
      pathname.startsWith("/content") ||
      pathname.startsWith("/business") ||
      pathname.startsWith("/bot-settings")
    ) {
      if (isAdmin) {
        const segment = pathname.split("/")[1];
        const adminMap: Record<string, string> = {
          dashboard: "/admin/dashboard",
          calendar: "/admin/calendar",
          bookings: "/admin/bookings",
          clients: "/admin/clients",
          users: "/admin/users",
          memberships: "/admin/memberships",
          content: "/admin/content",
          business: "/admin/business-info",
          "bot-settings": "/admin/bot-settings",
        };
        return NextResponse.redirect(new URL(adminMap[segment] || "/admin/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/app/:path*",
    "/dashboard/:path*",
    "/calendar/:path*",
    "/bookings/:path*",
    "/clients/:path*",
    "/users/:path*",
    "/memberships/:path*",
    "/content/:path*",
    "/business/:path*",
    "/bot-settings/:path*",
  ],
};
