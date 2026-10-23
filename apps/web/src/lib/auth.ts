export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export type AuthError = { detail?: string | { msg?: string }[] };

export function readableAuthError(status: number, body: unknown): string {
  if (status === 429) return "Too many attempts. Please try again later.";
  if (status >= 500) return "Authentication service unavailable. Try again later.";
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as AuthError).detail;
    if (typeof detail === "string" && detail.length <= 200) {
      if (detail === "Invalid email or password") return detail;
      if (detail === "Email is already registered") return detail;
    }
  }
  if (status === 409) return "Email is already registered";
  return "Unable to complete the request. Check your details and try again.";
}

export function validPassword(password: string): boolean {
  return password.length >= 12 && password.length <= 256;
}

