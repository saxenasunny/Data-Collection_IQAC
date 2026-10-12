import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_SECRET || "iqac_default_secure_secret_key_2026";

export interface SessionUser {
  type: "ADMIN" | "STUDENT" | "FACULTY";
  id: string;
  identifier: string; // email or registrationId or facultyId
  name: string;
}

export function signToken(payload: SessionUser): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return Buffer.from(data).toString("base64url") + "." + hmac;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encodedData, signature] = parts;
    const data = Buffer.from(encodedData, "base64url").toString("utf-8");
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
    if (signature !== expectedSignature) return null;

    const parsed = JSON.parse(data);
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return {
      type: parsed.type,
      id: parsed.id,
      identifier: parsed.identifier,
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("iqac_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
