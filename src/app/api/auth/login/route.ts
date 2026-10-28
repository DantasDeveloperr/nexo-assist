import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { createSessionToken } from "@/server/auth/session";

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

const SESSION_COOKIE_NAME = "nexo_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve conter um JSON válido." },
      { status: 400 },
    );
  }

  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Informe um e-mail e uma senha válidos." },
      { status: 400 },
    );
  }

  const email = validation.data.email.toLowerCase();
  const password = validation.data.password;

  try {
    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const passwordMatches = await compare(
      password,
      employee.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const token = await createSessionToken(employee.id);

    const response = NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
        },
      },
      { status: 200 },
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return NextResponse.json(
      { error: "Não foi possível realizar o login." },
      { status: 500 },
    );
  }
}