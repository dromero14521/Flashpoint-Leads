import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/referral?code=XXXXXXXX - Track referral
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No referral code provided" }, { status: 400 });
  }

  // Find the referrer
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
  });

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  // Store referral code in response header for tracking
  const response = NextResponse.redirect(new URL("/sign-up", request.url));
  response.cookies.set("referral_code", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
