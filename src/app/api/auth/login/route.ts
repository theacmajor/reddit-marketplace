import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  sessionCookieOptions,
  validatePassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const password = typeof body?.password === "string" ? body.password : "";

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: { message: "Invalid password" } },
        { status: 401 },
      );
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Login failed" } },
      { status: 500 },
    );
  }
}
