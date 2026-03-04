# Software Requirements Specification (SRS)
## LanChain — Conversational AI Platform for Medical & Feedback Workflows

**Version:** 1.0  
**Date:** March 3, 2025  
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) describes the functional and non-functional requirements of **LanChain**, a multi-application platform that provides:
- **MediVoice**: Voice- and text-based medical clinic enquiry assistant (patient/staff) with speech-to-text and LangGraph-powered intent and data retrieval.
- **Alexa Feedback AI**: Text-based sentiment analysis and ticket creation for user feedback (Angry, Neutral, Feedback, Enquiry).
- **Whisper Service**: Standalone speech-to-text (STT) microservice used by the backend for transcription.

The document is intended for developers, testers, and stakeholders.

### 1.2 Scope
- **In scope**: Client (React/Vite), Node.js API service, Whisper STT service, seed data, and all documented APIs and user flows.
- **Out of scope**: Deployment/infrastructure details, third-party SLA guarantees, and future product roadmaps not yet implemented.

### 1.3 Definitions and Acronyms
| Term | Definition |
|------|------------|
| SRS | Software Requirements Specification |
| STT | Speech-to-Text |
| SSE | Server-Sent Events |
| JWT | JSON Web Token |
| LangGraph | Graph-based workflow framework for LLM pipelines |
| LCEL | LangChain Expression Language |
| MediVoice | Medical voice/text enquiry application within LanChain |
| Alexa Feedback AI | Feedback sentiment and ticket management application |

### 1.4 References
- LangChain JS: https://js.langchain.com/
- LangGraph: https://langchain-ai.github.io/langgraph/
- Groq API: https://console.groq.com
- Faster-Whisper: https://github.com/SYSTRAN/faster-whisper
- React 19, Vite 7, HeroUI, Tailwind CSS 4

---

## 2. Overall Description

### 2.1 Product Perspective
LanChain is a **monorepo** containing:
- **client**: React SPA (Vite, TypeScript) — landing page, MediVoice app, Alexa Feedback app (Assistant, Tickets, Dashboard).
- **node-service**: Express.js API — auth, assistant/enquiry, reply (sentiment), tickets, and proxy to Whisper.
- **whisper-service**: FastAPI Python service — Faster-Whisper model for transcription (HTTP POST).
- **seed**: JSON seed data for countries, states, cities, clinics, tests (used by backend/scripts).

The client communicates with the node-service only; the node-service calls the whisper-service for audio transcription when required.

### 2.2 User Classes and Characteristics
| User Class | Description | Primary Use |
|------------|-------------|-------------|
| **Patient** | End-user associated with a clinic; can ask about own tests and clinic info. | MediVoice: get_clinic, get_my_tests, clinic_summary (limited). |
| **Staff** | Clinic staff; can query patients (by phone/email/name), list/count patients and tests, patient detail with tests. | MediVoice: all intents except patient-only (e.g. get_my_tests). |
| **General feedback user** | User submitting text feedback (no clinic context). | Alexa Feedback: sentiment analysis, optional ticket creation. |

### 2.3 Operating Environment
- **Client**: Modern browsers with Web Audio, MediaRecorder, and (optional) Web Speech API; HTTPS recommended for microphone.
- **Node-service**: Node.js ≥18; MongoDB; env: `PORT`, `MONGODB_URI`, `GROQ_API_KEY`, `WHISPER_SERVICE_URL`, `CLIENT_URL`, optional `NODE_HTTPS`, `SSL_*`.
- **Whisper-service**: Python 3.x; FastAPI; CPU or GPU; env for model/port as needed.

### 2.4 Design and Implementation Constraints
- Authentication for MediVoice: phone-based login; JWT in cookie (`medivoice_token`) and/or `Authorization: Bearer` header.
- Assistant/enquiry endpoints require JWT; reply and tickets (Alexa) may be unauthenticated in current design.
- Conversation context: per-user, auto-reset after 20 queries; last 19 messages passed to answer chain for context.

---

## 3. System Features and Functional Requirements

### 3.1 Landing and Navigation
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | The system shall provide a landing page at `/` with a choice of applications (MediVoice, Alexa Feedback AI). | High |
| FR-1.2 | The system shall support routing: `/` (landing), `/medivoice` (MediVoice), `/assistant`, `/tickets`, `/dashboard` (Alexa shell). | High |
| FR-1.3 | The system shall support theme toggle (e.g. light/dark) across the client. | Medium |

### 3.2 Authentication (MediVoice)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | The system shall allow user registration via `POST /api/auth/register` with body: phone (10 digits), name, gender (male/female/other), dob (YYYY-MM-DD or equivalent), user_type (patient/staff). | High |
| FR-2.2 | The system shall allow login via `POST /api/auth/login` with body: phone (10 digits); response shall include user object and JWT. | High |
| FR-2.3 | The system shall provide `GET /api/auth/me` returning current user when valid JWT is supplied (Authorization: Bearer or cookie). | High |
| FR-2.4 | The system shall enforce unique phone per user on registration; duplicate phone shall return 409. | High |
| FR-2.5 | The system shall validate and parse multiple date formats for dob (e.g. YYYY-MM-DD, DD-MM-YYYY, YYYY-DD-MM). | Medium |

### 3.3 MediVoice — Voice and Text Enquiry
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | The system shall accept audio upload via `POST /assistant/transcribe` (multipart, field `audio`) and return transcribed text using the Whisper service. | High |
| FR-3.2 | The system shall accept authenticated `POST /assistant/enquiry` with audio file; transcribe audio, run enquiry workflow, and stream progress and result via SSE (events: stage, result, error). | High |
| FR-3.3 | The system shall accept authenticated `POST /assistant/enquiry/text` with JSON body `{ "text": "..." }` and stream same SSE format as FR-3.2 without transcription. | High |
| FR-3.4 | The system shall require valid JWT for `/assistant/enquiry`, `/assistant/enquiry/text`, `/assistant/conversations/current`, and `/assistant/conversations/clear`. | High |
| FR-3.5 | The system shall associate each enquiry with a user and clinic (user must have `clinic_id`); otherwise return an error event. | High |
| FR-3.6 | The system shall maintain per-user conversation context: find or create conversation, auto-create new conversation after 20 user messages, and pass last 19 messages to the answer chain. | High |
| FR-3.7 | The system shall persist each user/assistant pair to the conversation after a successful enquiry. | High |
| FR-3.8 | The system shall support intent extraction (LLM + keyword fallback) and role-based intent filtering (patient vs staff). | High |
| FR-3.9 | The system shall support the following intents with data fetch and formatted reply: get_clinic, get_my_tests, find_patient_by_phone/email/name, list_patients, list_tests, count_patients, count_tests, clinic_summary, patient_detail_with_tests, unsupported. | High |
| FR-3.10 | The system shall return for some intents a structured payload (response_type: json, data) for UI cards (e.g. list_patients, get_my_tests, get_clinic). | High |
| FR-3.11 | The system shall provide `GET /assistant/conversations/current` returning current conversation message count for the authenticated user. | Medium |
| FR-3.12 | The system shall provide `DELETE /assistant/conversations/clear` to delete all conversations for the authenticated user. | Medium |

### 3.4 MediVoice — Client UX
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | The client shall support phone-based login flow and persist auth (e.g. cookie) for MediVoice. | High |
| FR-4.2 | The client shall support recording audio (e.g. MediaRecorder, WebM) and sending it to enquiry or transcribe endpoints. | High |
| FR-4.3 | The client shall support optional wake word / phrase detection and text input fallback for enquiry. | Medium |
| FR-4.4 | The client shall display enquiry progress (stages) and final result (reply, optional data cards). | High |
| FR-4.5 | The client shall support clearing/resetting conversation and display conversation message count where applicable. | Medium |
| FR-4.6 | The client shall support microphone device selection and indicate unsupported browser when needed. | Medium |

### 3.5 Alexa Feedback AI — Reply (Sentiment) and Tickets
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | The system shall accept `POST /api/reply` with body `{ "content": "string" }` and return mood (Angry, Neutral, Feedback, Enquiry), confidence, reasoning, and optionally reply and ticket. | High |
| FR-5.2 | The system shall run a LangGraph sentiment workflow: LLM classification → parse → route to reply nodes (Neutral, Feedback, Angry, Enquiry); create tickets for Feedback (Low priority) and Angry (High when complaint). | High |
| FR-5.3 | The system shall provide `GET /api/tickets` with optional query params: status, priority, page, limit; response shall include tickets array and pagination. | High |
| FR-5.4 | The system shall provide `GET /api/tickets/:id` for a single ticket. | Medium |
| FR-5.5 | The system shall provide `PATCH /api/tickets/:id` to update status and/or priority. | High |
| FR-5.6 | The client shall support streaming reply response (e.g. `submitMessageStream` calling `/api/reply/stream`) for incremental display; backend may implement streaming in a future iteration. | Medium (client-ready; backend stream optional) |

### 3.6 Whisper Service (STT)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | The Whisper service shall expose `GET /health` returning status and model-loaded flag. | High |
| FR-6.2 | The Whisper service shall expose `POST /transcribe` accepting multipart audio (e.g. wav, webm, mp3, ogg, flac) and return `{ "text": "..." }` with English transcription. | High |
| FR-6.3 | The service shall reject unsupported content types with 400 and return 503 when model is not yet loaded. | High |
| FR-6.4 | The node-service shall proxy transcription requests to the Whisper service (configurable via WHISPER_SERVICE_URL). | High |

### 3.7 Data and Persistence
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | The system shall persist users (phone, name, gender, dob, user_type, email, clinic_id, city_id, state_id, country_id) in MongoDB. | High |
| FR-7.2 | The system shall persist conversations (userId, title, messages with role, content, timestamp; optional metadata) in MongoDB. | High |
| FR-7.3 | The system shall persist tickets (title, description, status, priority) in MongoDB. | High |
| FR-7.4 | The system shall persist clinics, tests, cities, states, countries per defined Mongoose schemas and support seed data. | High |

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Landing**: Single page with two app cards (MediVoice, Alexa Feedback AI) and theme toggle.
- **MediVoice**: Shell with navigation; main view with orb/recording UI, transcript, result cards, settings (e.g. microphone), login (phone), and conversation reset.
- **Alexa Feedback**: Shell with Assistant, Tickets, Dashboard tabs; assistant input and streaming/result display; ticket list and status update; dashboard with mood chart and timeline.

### 4.2 Hardware Interfaces
- Microphone for MediVoice voice input (browser MediaRecorder/WebRTC).
- No special hardware required for server components.

### 4.3 Software Interfaces
- **Client ↔ Node-service**: REST and SSE over HTTP/HTTPS; base URL configurable via `VITE_API_URL`.
- **Node-service ↔ Whisper-service**: HTTP POST to `WHISPER_SERVICE_URL/transcribe` with multipart form.
- **Node-service ↔ MongoDB**: Mongoose ODM; connection string via `MONGODB_URI`.
- **Node-service ↔ Groq**: LangChain ChatGroq (llama-3.3-70b-versatile) for sentiment, intent, and answer chains; API key via `GROQ_API_KEY`.

### 4.4 Communication Interfaces
- REST: JSON request/response; CORS allowed origins from `CLIENT_URL` or default localhost.
- SSE: `Content-Type: text/event-stream` for enquiry endpoints; events: `stage`, `result`, `error`.
- Auth: JWT in `Authorization: Bearer <token>` or cookie `medivoice_token`.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Transcription: target &lt; 30 s for typical short utterances; timeout 60 s for Whisper client.
- Enquiry: end-to-end latency dominated by LLM and DB; stage events streamed to improve perceived responsiveness.
- Ticket list: paginated (default limit 20); indexes on status, priority, createdAt.

### 5.2 Safety and Security
- No storage of raw audio beyond in-memory processing in node-service and whisper-service.
- JWT for protected routes; no password (phone-only auth in current design).
- Environment secrets (API keys, MongoDB URI) not committed; use `.env` and secure deployment.

### 5.3 Reliability
- Health endpoints: `GET /health` (node-service), `GET /health` (whisper-service) for readiness.
- Graceful handling of Whisper 503 (model loading); client/server error events for enquiry failures.

### 5.4 Scalability
- Stateless node-service; horizontal scaling possible with shared MongoDB.
- Whisper-service can be scaled or offloaded to GPU for higher throughput.

### 5.5 Maintainability
- Modular structure: routes, services, graph workflows, chains, models.
- Configuration via environment variables; clear separation of client, API, and STT service.

---

## 6. Data Models (Summary)

### 6.1 User
- phone (required, unique, 10 digits), name, gender (enum), dob (Date), user_type (patient | staff), email, clinic_id, city_id, state_id, country_id, timestamps.

### 6.2 Conversation
- userId (string, indexed), title, messages[{ role, content, timestamp }], metadata (optional), timestamps.

### 6.3 Ticket
- title, description, status (Open | In Progress | Done), priority (Low | High), timestamps.

### 6.4 Clinic
- name, email, phone_number, city_id, state_id, country_id, user_id, is_verified, is_test_account, is_active, unique_id, clinic_id, timestamps.

### 6.5 Test
- user_id, clinic_id, city_id, state_id, country_id, user_data, clinic_data, test_type, hba1c, hba1c_result, hba1c_value, is_active, is_deleted, timestamps.

### 6.6 City, State, Country
- Reference data; structure per seed JSON (name, etc.).

---

## 7. API Reference (Summary)

### 7.1 Auth
- `POST /api/auth/register` — body: phone, name, gender, dob, user_type.
- `POST /api/auth/login` — body: phone.
- `GET /api/auth/me` — headers: Authorization: Bearer &lt;token&gt;.

### 7.2 Assistant (MediVoice)
- `POST /assistant/transcribe` — multipart audio → `{ text }`.
- `POST /assistant/enquiry` — auth, multipart audio → SSE (stage, result, error).
- `POST /assistant/enquiry/text` — auth, JSON `{ text }` → SSE (stage, result, error).
- `GET /assistant/conversations/current` — auth → `{ messageCount }`.
- `DELETE /assistant/conversations/clear` — auth → `{ success, deletedCount }`.

### 7.3 Reply (Alexa Feedback)
- `POST /api/reply` — body `{ content }` → mood, confidence, reasoning, optional reply, ticket.

### 7.4 Tickets
- `GET /api/tickets` — query: status, priority, page, limit.
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id` — body: status and/or priority.

### 7.5 Health
- `GET /health` — node-service: status, service name, version, uptime, environment.
- `GET /health` — whisper-service: status, model_loaded.

---

## 8. Enquiry Workflow (LangGraph)

1. **Input**: content (text), context (userId, userType, clinicId, conversationId, conversationHistory).
2. **Nodes**: extractIntent (LLM) → on error intentFallback (keyword) → fetchData (MongoDB by intent/params) → formatReply (template or answerChain with history).
3. **Output**: reply, intent, response_type (text | json), response_data (optional), conversationId; persist user/assistant messages and return message count in result.

---

## 9. Revision History

| Version | Date       | Author | Changes |
|---------|------------|--------|---------|
| 1.0     | 2025-03-03 | —      | Initial SRS from repository analysis. |

---

*This SRS was generated from analysis of the LanChain monorepo (client, node-service, whisper-service, seed).*
