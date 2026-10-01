import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Build a single response up front and accumulate every cookie Supabase
  // wants to set onto THIS SAME response. A session often spans multiple
  // cookies (access token, refresh token, and chunked parts of a large
  // JWT like "sb-xxx-auth-token.0" / ".1"), and each one triggers its own
  // call to set(). Previously this handler replaced `response` with a
  // brand new NextResponse.next() on every single cookie write, which
  // discarded any cookies already set on the prior response object -
  // only the LAST cookie write ever reached the browser, corrupting the
  // session cookie every time it was refreshed.
  const response = NextResponse.next({
        request: {
                headers: request.headers,
        },
  });

  const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
            cookies: {
                      get(name) {
                                  return request.cookies.get(name)?.value;
                      },
                      set(name, value, options) {
                                  request.cookies.set({ name, value, ...options });
                                  response.cookies.set({ name, value, ...options });
                      },
                      remove(name, options) {
                                  request.cookies.set({ name, value: "", ...options });
                                  response.cookies.set({ name, value: "", ...options });
                      },
            },
    }
      );

  // This refreshes the session if expired, and writes the rotated
  // cookies onto the response so Server Components see a valid session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
    matcher: [
          "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
        ],
};
