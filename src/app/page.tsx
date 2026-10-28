
"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface ApiResponse {
  message?: string;
  error?: string;
  employee?: Employee;
  count?: number;
  data?: Ticket[] | Ticket;
  details?: { field: string; message: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  WAITING_FOR_EMPLOYEE: "Aguardando funcionário",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const CATEGORY_LABELS: Record<string, string> = {
  ACCESS: "Acesso",
  NETWORK_VPN: "Rede / VPN",
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  EMAIL: "E-mail",
  OTHER: "Outros",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusStyle(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700";
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";
    case "WAITING_FOR_EMPLOYEE":
      return "bg-violet-50 text-violet-700";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function priorityStyle(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "text-red-700";
    case "HIGH":
      return "text-orange-700";
    case "MEDIUM":
      return "text-amber-700";
    default:
      return "text-slate-600";
  }
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketFormError, setTicketFormError] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("INC");
  const [category, setCategory] = useState("SOFTWARE");
  const [priority, setPriority] = useState("MEDIUM");
  
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiMessage, setAiMessage] = useState("");

  async function loadTickets(status = statusFilter) {
    setIsLoadingTickets(true);
    setTicketError("");

    try {
      const query =
        status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;

      const response = await fetch(`/api/tickets${query}`, {
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        setEmployee(null);
        setTickets([]);
        setTicketError("Sua sessão expirou. Entre novamente.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível carregar os chamados.");
      }

      setTickets(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      setTicketError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os chamados.",
      );
    } finally {
      setIsLoadingTickets(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status !== 401) {
            throw new Error("Não foi possível verificar a sessão.");
          }
          return;
        }

        const data = (await response.json()) as ApiResponse;

        if (isMounted && data.employee) {
          setEmployee(data.employee);
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Não foi possível verificar sua sessão. Atualize a página e tente novamente.",
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

  useEffect(() => {
    if (employee) {
      void loadTickets(statusFilter);
    } else {
      setTickets([]);
    }
    // A consulta acompanha a sessão e o filtro selecionado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, statusFilter]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setErrorMessage(data.error ?? "Não foi possível realizar o login.");
        return;
      }

      if (!data.employee) {
        setErrorMessage("O servidor não retornou os dados do funcionário.");
        return;
      }

      setEmployee(data.employee);
      setPassword("");
      setErrorMessage("");
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        setErrorMessage("Não foi possível encerrar a sessão.");
        return;
      }

      setEmployee(null);
      setTickets([]);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setTicketError("");
      setShowTicketForm(false);
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor para sair.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetTicketForm() {
    setTitle("");
    setDescription("");
    setType("INC");
    setCategory("SOFTWARE");
    setPriority("MEDIUM");
    setTicketFormError("");
  }

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employee) {
      setTicketFormError("Sua sessão não está disponível. Entre novamente.");
      return;
    }

    setIsCreatingTicket(true);
    setTicketFormError("");
    setTicketSuccess("");

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          category,
          priority,
          affectedEmployeeId: employee.id,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        setEmployee(null);
        setTicketFormError("Sua sessão expirou. Entre novamente.");
        return;
      }

      if (!response.ok) {
        const detail = data.details?.[0]?.message;
        setTicketFormError(
          detail ?? data.error ?? "Não foi possível criar o chamado.",
        );
        return;
      }

      resetTicketForm();
      setShowTicketForm(false);
      setStatusFilter("ALL");
      setTicketSuccess(data.message ?? "Chamado criado com sucesso.");

      // Atualiza a lista imediatamente após a criação.
      await loadTickets("ALL");
    } catch {
      setTicketFormError(
        "Não foi possível conectar ao servidor. Tente novamente.",
      );
    } finally {
      setIsCreatingTicket(false);
    }
  }
  
    async function handleInterpretTicket() {
    if (!description.trim()) {
      setAiError("Descreva o problema antes de solicitar a sugestão da IA.");
      setAiMessage("");
      return;
    }

    setIsInterpreting(true);
    setAiError("");
    setAiMessage("");

    try {
      const response = await fetch("/api/tickets/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: description }),
      });

      const result = await response.json();

      if (response.status === 401) {
        setEmployee(null);
        setAiError("Sua sessão expirou. Entre novamente.");
        return;
      }

      if (!response.ok) {
        setAiError(
          result.message ?? "Não foi possível interpretar o relato.",
        );
        return;
      }

      const interpretation = result.data as {
        title: string;
        type: "INC" | "REQ" | null;
        category:
          | "ACCESS"
          | "NETWORK_VPN"
          | "HARDWARE"
          | "SOFTWARE"
          | "EMAIL"
          | "OTHER";
        needsClarification: boolean;
        clarifyingQuestion: string;
      };

      setTitle(interpretation.title);

      if (interpretation.type !== null) {
        setType(interpretation.type);
      }

      setCategory(interpretation.category);

      setAiMessage(
        interpretation.needsClarification
          ? `Sugestão aplicada. Para melhorar a classificação: ${interpretation.clarifyingQuestion}`
          : "Sugestão da IA aplicada. Revise os campos antes de abrir o chamado.",
      );
    } catch {
      setAiError("Não foi possível conectar ao serviço de IA. Tente novamente.");
    } finally {
      setIsInterpreting(false);
    }
  }

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
  ).length;

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center" role="status">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-600">Verificando sua sessão...</p>
        </div>
      </main>
    );
  }

  if (employee) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                N
              </div>
              <div>
                <p className="font-semibold tracking-tight">Nexo Assist</p>
                <p className="text-xs text-slate-500">Central de serviços de TI</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{employee.name}</p>
                <p className="text-xs text-slate-500">{employee.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isLoading ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">ÁREA DO FUNCIONÁRIO</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Meus chamados
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Acompanhe suas solicitações de suporte em um só lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTicketForm((current) => !current);
                  setTicketFormError("");
                  setTicketSuccess("");
                }}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {showTicketForm ? "Cancelar abertura" : "+ Novo chamado"}
              </button>

              <button
                type="button"
                onClick={() => void loadTickets(statusFilter)}
                disabled={isLoadingTickets}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isLoadingTickets ? "Atualizando..." : "Atualizar chamados"}
              </button>
            </div>
          </div>

          {ticketSuccess && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {ticketSuccess}
            </div>
          )}

          {showTicketForm && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Abrir novo chamado</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Descreva o problema ou a solicitação para a equipe de TI.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-5">
                <div>
                  <label htmlFor="ticket-title" className="mb-2 block text-sm font-medium">
                    Título
                  </label>
                  <input
                    id="ticket-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={120}
                    disabled={isCreatingTicket}
                    placeholder="Ex.: Não consigo acessar o sistema"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {title.length}/120
                  </p>
                </div>

                <div>
                  <label htmlFor="ticket-description" className="mb-2 block text-sm font-medium">
                    Descrição
                  </label>
                  <textarea
                    id="ticket-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    maxLength={2000}
                    rows={5}
                    disabled={isCreatingTicket}
                    placeholder="Explique o que aconteceu, quando começou e qual mensagem aparece."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                  
                  <p className="mt-1 text-right text-xs text-slate-400">
  {description.length}/2000
</p>

<div className="mt-3">
  <button
    type="button"
    onClick={handleInterpretTicket}
    disabled={
      !description.trim() ||
      isInterpreting ||
      isCreatingTicket
    }
    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {isInterpreting
      ? "Interpretando relato..."
      : "Sugerir preenchimento com IA"}
  </button>

  {aiError && (
    <p className="mt-2 text-sm text-red-600" role="alert">
      {aiError}
    </p>
  )}

  {aiMessage && (
    <p className="mt-2 text-sm text-blue-700" role="status">
      {aiMessage}
    </p>
  )}
</div>

                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor="ticket-type" className="mb-2 block text-sm font-medium">
                      Tipo
                    </label>
                    <select
                      id="ticket-type"
                      value={type}
                      onChange={(event) => setType(event.target.value)}
                      disabled={isCreatingTicket}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="INC">Incidente</option>
                      <option value="REQ">Requisição</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ticket-category" className="mb-2 block text-sm font-medium">
                      Categoria
                    </label>
                    <select
                      id="ticket-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      disabled={isCreatingTicket}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="ACCESS">Acesso</option>
                      <option value="NETWORK_VPN">Rede / VPN</option>
                      <option value="HARDWARE">Hardware</option>
                      <option value="SOFTWARE">Software</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="OTHER">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ticket-priority" className="mb-2 block text-sm font-medium">
                      Prioridade
                    </label>
                    <select
                      id="ticket-priority"
                      value={priority}
                      onChange={(event) => setPriority(event.target.value)}
                      disabled={isCreatingTicket}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="CRITICAL">Crítica</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Este chamado será registrado em seu nome.
                </p>

                {ticketFormError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {ticketFormError}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTicketForm(false);
                      resetTicketForm();
                    }}
                    disabled={isCreatingTicket}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTicket}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingTicket ? "Enviando..." : "Enviar chamado"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Abertos</p>
              <p className="mt-2 text-3xl font-semibold">{openCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Em andamento</p>
              <p className="mt-2 text-3xl font-semibold">{inProgressCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Resolvidos ou fechados</p>
              <p className="mt-2 text-3xl font-semibold">{resolvedCount}</p>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Lista de solicitações</h2>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="ALL">Todos</option>
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="WAITING_FOR_EMPLOYEE">Aguardando funcionário</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="CLOSED">Fechado</option>
                </select>
              </label>
            </div>

            {ticketError && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{ticketError}</p>
                <button
                  type="button"
                  onClick={() => void loadTickets(statusFilter)}
                  className="mt-2 font-semibold underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {isLoadingTickets ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="mt-3 text-sm text-slate-500">Carregando chamados...</p>
              </div>
            ) : !ticketError && tickets.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  +
                </div>
                <h3 className="mt-4 font-semibold">Nenhum chamado encontrado</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {statusFilter === "ALL"
                    ? "Você ainda não possui chamados registrados."
                    : "Não há chamados com o status selecionado."}
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {ticket.type === "INC"
                            ? "Incidente"
                            : ticket.type === "REQ"
                              ? "Requisição"
                              : ticket.type}
                          {" · "}
                          {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                        </p>
                        <h3 className="mt-2 break-words text-lg font-semibold">
                          {ticket.title}
                        </h3>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(ticket.status)}`}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {ticket.description}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs">
                      <span className="text-slate-500">
                        Prioridade:{" "}
                        <strong className={priorityStyle(ticket.priority)}>
                          {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                        </strong>
                      </span>
                      <span className="text-slate-500">
                        Criado em: {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="mt-10 text-center text-xs text-slate-400">
            Nexo Assist · Central de serviços de TI
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 font-sans text-slate-900">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 md:min-h-[600px] md:grid-cols-2">
        <section className="flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold">
              N
            </div>
            <div>
              <p className="text-lg font-semibold">Nexo Assist</p>
              <p className="text-xs text-slate-400">Central de serviços de TI</p>
            </div>
          </div>

          <div className="my-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Atendimento e suporte
            </div>
            <h1 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              Tecnologia que conecta pessoas e soluções.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              Acesse o ambiente de suporte para acompanhar solicitações e facilitar a resolução de problemas de TI.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Nexo Assist · Central de serviços de TI
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <p className="text-sm font-medium text-blue-600">ACESSO AO SISTEMA</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Bem-vindo de volta
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Informe suas credenciais para entrar no Nexo Assist.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-xs font-medium text-slate-500 hover:text-blue-600"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Entrando..." : "Entrar no sistema"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Acesso destinado a funcionários autorizados. Em caso de dificuldade, procure o suporte de TI.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}