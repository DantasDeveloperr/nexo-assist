"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  message?: string;
  error?: string;
  employee?: Employee;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status !== 401) {
            throw new Error("Não foi possível verificar a sessão.");
          }

          return;
        }

        const data = (await response.json()) as LoginResponse;

        if (isMounted && data.employee) {
          setEmployee(data.employee);
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Não foi possível verificar sua sessão. Tente atualizar a página.",
          );
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setErrorMessage(
          data.error ?? "Não foi possível realizar o login. Tente novamente.",
        );
        return;
      }

      if (!data.employee) {
        setErrorMessage("O servidor não retornou os dados do funcionário.");
        return;
      }

      setEmployee(data.employee);
      setPassword("");
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setErrorMessage("Não foi possível encerrar a sessão. Tente novamente.");
        return;
      }

      setEmployee(null);
      setEmail("");
      setPassword("");
      setShowPassword(false);
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao servidor para encerrar a sessão.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 font-sans text-slate-900">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 md:min-h-[600px] md:grid-cols-2">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-500/20">
                N
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Nexo Assist
                </p>
                <p className="text-xs text-slate-400">
                  Central de serviços de TI
                </p>
              </div>
            </div>
          </div>

          <div className="relative my-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Atendimento e suporte
            </div>

            <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Tecnologia que conecta pessoas e soluções.
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
              Acesse o ambiente de suporte para acompanhar solicitações e
              facilitar a resolução de problemas de TI.
            </p>

            <div className="mt-10 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-200">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Solicitações organizadas
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Acompanhe seus chamados em um só lugar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-200">
                  ↗
                </div>
                <div>
                  <p className="text-sm font-medium">Acesso protegido</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Entre com suas credenciais de funcionário.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            Nexo Assist · Central de serviços de TI
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            {isCheckingSession ? (
              <div
                className="flex flex-col items-center py-12 text-center"
                role="status"
              >
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="mt-4 text-sm text-slate-500">
                  Verificando sua sessão...
                </p>
              </div>
            ) : employee ? (
              <div className="py-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
                  ✓
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Login realizado!
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Bem-vindo(a), {employee.name}. Suas credenciais foram
                  validadas e sua sessão foi iniciada.
                </p>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Funcionário autenticado
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-slate-900">
                    {employee.email}
                  </p>
                </div>

                <p className="mt-6 text-sm leading-6 text-slate-500">
                  A interface de chamados será integrada na próxima etapa do
                  desenvolvimento.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Aguarde..." : "Sair da conta"}
                </button>

                {errorMessage && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <p className="text-sm font-medium text-blue-600">
                    ACESSO AO SISTEMA
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                    Bem-vindo de volta
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Informe suas credenciais para entrar no Nexo Assist.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      E-mail corporativo
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="voce@empresa.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      maxLength={254}
                      disabled={isLoading}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Senha
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        maxLength={128}
                        disabled={isLoading}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                        className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-xs font-medium text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                    >
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar no sistema"
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-xs leading-5 text-slate-400">
                  Acesso destinado a funcionários autorizados.
                  <br />
                  Em caso de dificuldade, procure o suporte de TI.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
