# Nexo Assist — AI-Powered IT Service Desk

Nexo Assist is a technical challenge project focused on building an AI-powered IT service desk assistant. It helps employees troubleshoot IT issues, consult tickets, and request IT services through a conversational interface.

The project emphasizes reliable decision-making, transparent actions, privacy, and clear separation between the AI agent and the ticket management system.

## Project Status

**Current stage:** Project foundation and documentation.

The Next.js application has been initialized with TypeScript strict mode, the development environment has been tested, and the repository has been published to GitHub.

Planned features are not considered implemented until they have been developed and tested.

## Planned Features

- Employee login and isolated access to personal tickets.
- Conversational IT support powered by Google Gemini.
- IT knowledge base with sample help articles.
- Ticket creation, consultation, updating, and reopening.
- Confirmation before creating or modifying tickets.
- Rule-based priority classification and SLA calculation.
- Duplicate ticket detection.
- Human handoff with explicit conversation states.
- Decision transparency through structured action logs.
- Persistent storage for tickets, conversations, and state.
- Automated tests and documented execution instructions.

## Technology Stack

- **Next.js** — application framework and server-side endpoints.
- **React** — interactive user interface.
- **TypeScript** — static typing and strict type checking.
- **Google Gemini** — planned language model provider.
- **Mastra** — planned agent orchestration framework.
- **Database and ORM** — to be selected and configured during implementation.

The final technology choices may be adjusted when compatibility, persistence, and deployment requirements are validated.

## Architecture Principles

1. **Separation of responsibilities:** the interface, AI agent, ticket service, and persistence layer have distinct responsibilities.
2. **Server-side secrets:** API keys must never be exposed to the browser or committed to Git.
3. **Validated actions:** the agent cannot claim a ticket was created or updated unless the ticket service confirms the operation.
4. **Explicit confirmation:** ticket creation and updates require employee confirmation.
5. **Deterministic business rules:** ticket priority, SLA, duplicate detection, and authorization are enforced by application logic rather than delegated entirely to the language model.
6. **Privacy by design:** employees can access only their own tickets.
7. **Controlled human handoff:** once a conversation is waiting for or being handled by an analyst, the AI must not respond until the conversation is explicitly released.
8. **Observable decisions:** the application records structured information about the agent's intent, actions, results, and explanations without exposing private internal reasoning.

## Getting Started

### Prerequisites

- Node.js compatible with the installed Next.js version.
- npm.

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

Secrets and local configuration will be documented in `.env.example` as the corresponding integrations are implemented.

Never commit `.env.local` or actual API keys to version control.

## Quality Assurance

The project will include tests for business rules, ticket operations, authorization boundaries, conversation state transitions, and error handling.

Manual verification will also cover loading states, failures, confirmation flows, and human handoff.

## Trade-offs and Future Improvements

The implementation will prioritize a reliable local prototype, clear business rules, and maintainable architecture. Production deployment, stronger authentication, monitoring, rate limiting, and a production-grade database can be added or expanded as the project evolves.

## Repository

[GitHub — Nexo Assist](https://github.com/DantasDeveloperr/nexo-assist)
