import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://jealpcuawyjreewpizzo.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_nV_7K2cE5HQrAkjrhiXqDA_qH4V18tI";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Server-side verification using getUser() (NOT getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isProtectedPath = pathname.startsWith("/admin") || pathname.startsWith("/user");
  const isAuthPath = pathname === "/login" || pathname === "/register";

  // Unauthenticated user attempting to access protected area
  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Role routing for authenticated users
  if (user) {
    const role = (user.user_metadata?.role || user.app_metadata?.role || "").toLowerCase();
    const isAdmin = role === "admin" || Boolean(user.email && user.email.toLowerCase().includes("admin"));

    // Already logged-in user accessing login/register
    if (isAuthPath) {
      const destination = isAdmin ? "/admin/dashboard" : "/user/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // Admin trying to access /user routes -> redirect to /admin/dashboard
    if (pathname.startsWith("/user") && isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // Student trying to access /admin routes -> redirect to /user/dashboard
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/login", "/register"],
};
