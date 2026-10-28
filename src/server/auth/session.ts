import { SignJWT, jwtVerify } from "jose";

const SESSION_ISSUER = "nexo-assist";
const SESSION_AUDIENCE = "nexo-assist";
const SESSION_DURATION = "7d";

function getSessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET não configurada ou muito curta.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  employeeId: string,
): Promise<string> {
  if (!employeeId.trim()) {
    throw new Error(
      "O identificador do funcionário é obrigatório.",
    );
  }

  const key = getSessionKey();

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(employeeId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(key);
}

export async function verifySessionToken(
  token: string,
): Promise<{ employeeId: string } | null> {
  const key = getSessionKey();

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      typeof payload.sub !== "string" ||
      !payload.sub.trim()
    ) {
      return null;
    }

    return { employeeId: payload.sub };
  } catch {
    return null;
  }
}