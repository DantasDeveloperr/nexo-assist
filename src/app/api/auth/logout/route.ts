import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "nexo_session";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout realizado com sucesso." },
    { status: 200 },
  );

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}