export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api/auth|api/feedback|_next/static|_next/image|favicon.ico|hopfan-logo|feedback).*)"],
};
