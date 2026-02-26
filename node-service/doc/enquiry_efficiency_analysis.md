# Enquiry system: efficiency analysis (LangGraph/LangChain + MongoDB)

## Short answer: yes, it’s inefficient if every enquiry goes through the LLM and/or does the wrong kind of DB access.

The questions in `enquiry_questions_staff.md` and `enquiry_questions_patient.md` are mostly **structured**: they map to a fixed set of intents and parameters (lookup by phone, filter by date, filter by HbA1c, etc.). Doing all of that purely via LangGraph + LLM for every request is costly and doesn’t play to MongoDB’s strengths.

---

## 1. Where the inefficiency comes from

### 1.1 LLM on every request

- **Cost & latency**: Every question would trigger at least one LLM call (intent + slot extraction, or free-form answer). For high-volume, repetitive questions (“Find patient by phone 9876543210”, “List tests where HbA1c &gt; 7”), that’s unnecessary.
- **Determinism**: These enquiries have right answers in the DB. You want **one correct query**, not a different NL answer each time. LLM is better used only where you need language (e.g. paraphrasing the final answer).

### 1.2 Wrong use of MongoDB

- **Text search vs structured data**: Your data is **structured** (User.phone, User.email, Test.created_at, Test.hba1c, clinic_id). Using `$text` search (like the existing product-enquiry flow) is a poor fit and can force full collection scans or inefficient index use.
- **No clear query boundary**: If the LLM “reasons” over raw documents, you might end up:
  - Fetching too much (e.g. all tests in clinic) and then “filtering” in the LLM, or
  - Doing multiple round-trips (LLM → query → LLM → another query) instead of one well-designed query.
- **Index usage**: Efficient patterns (e.g. `clinic_id` + `created_at`, `clinic_id` + `hba1c`) only pay off if the backend **runs a single structured query** with those fields. If the layer that talks to MongoDB is “whatever the LLM suggested”, it’s hard to guarantee index use and avoid N+1 or full scans.

### 1.3 Mismatch to your question set

- Most staff/patient questions map to a **small set of patterns**:
  - Get clinic by id → 1 findById.
  - Get patient by phone/email/name (in clinic) → 1 find with filter.
  - List patients in clinic → 1 find with `clinic_id` + `user_type: 'patient'`.
  - List/filter tests: by `clinic_id`, optional filters on `created_at`, `hba1c`, `test_type`, `user_id`.
- Doing that with “LLM reads question → LLM decides what to do” every time is the inefficient path. Doing it with “intent + params → one (or few) MongoDB queries” is the efficient one.

---

## 2. What *is* efficient

### 2.1 Intent-based routing + structured MongoDB

- **Define a fixed set of intents** that cover your doc’s questions, e.g.:
  - `get_clinic`, `get_my_tests`, `get_patient_by_phone`, `get_patient_by_email`, `get_patient_by_name`, `list_patients_in_clinic`, `list_tests`, `list_tests_by_date_range`, `list_tests_by_hba1c_range`, `patient_tests_summary`, `clinic_summary`, etc.
- **Map question → intent + parameters** using either:
  - A **small classifier** or **rules/keywords** for the bulk of simple questions (no LLM), or
  - **LLM only for ambiguous or complex NL** (e.g. “Show me everyone who did badly last month” → intent `list_tests` + params `hba1c_gt = X`, `date_after = Y`).
- **Backend**: One (or a small number of) **structured MongoDB queries** per intent (with proper indexes). No “dump data to LLM and let it answer”.

So: **LangGraph/LLM for “understanding” only when needed; MongoDB for all real data access, in a structured way.**

### 2.2 MongoDB side

- **Indexes** so that common enquiries are index-only or index-heavy:
  - `User`: `{ clinic_id: 1, user_type: 1 }`, `{ phone: 1 }`, `{ email: 1 }`, `{ clinic_id: 1, name: 1 }` (or text index on name if you need search).
  - `Test`: `{ clinic_id: 1, created_at: -1 }`, `{ clinic_id: 1, user_id: 1 }`, `{ clinic_id: 1, test_type: 1 }`. If you filter by `hba1c`, consider `{ clinic_id: 1, hba1c: 1 }` (and store numeric if you do range queries).
- **Single-query patterns**: e.g. “tests at my clinic where date &gt; X and hba1c &gt; Y” → one `find()` with `clinic_id`, `created_at: { $gte: X }`, `hba1c: { $gte: Y }` (and same for “less than” / “between”). No “get everything then filter in app/LLM”.
- **Aggregations**: For “how many patients”, “how many tests”, “tests per patient”, use `countDocuments` or aggregation pipeline with `$match` (on `clinic_id`, etc.) so the DB does the work.

### 2.3 Where LangGraph/LLM still help

- **Intent/slot extraction** for natural language you don’t want to hard-code (e.g. “everyone with high sugar last month” → intent + params). Use sparingly; prefer rules for the bulk.
- **Answer formatting**: Turn structured results (e.g. list of tests) into a short, human-friendly summary in the user’s language. One LLM call at the end is cheaper than LLM-heavy flows per step.
- **Clarification**: When the user query is ambiguous (e.g. two patients with same name), LLM can help ask a clarifying question; the actual data still comes from MongoDB.

---

## 3. “Aren’t we restricting the user?”

**Short answer: we restrict what the *system* can do (for safety and performance), not how the user is *allowed to ask*.**

- **User experience stays open.** The user can still type in natural language: “Show me the guy with phone 9876543210”, “Who had high sugar last month?”, “What’s my clinic’s address?”. They don’t have to pick from a menu of intents. The **intent + parameters** layer is internal: we take their free-form question and map it to one of the supported operations.
- **So we’re not restricting phrasing.** We’re restricting the **set of data operations** we support (e.g. “get patient by phone”, “list tests by date range”). That’s necessary anyway: we can’t safely run arbitrary user text as a query, and we don’t want the LLM to “make up” answers. The alternative isn’t “user can ask anything and always get the right answer”; it’s “user can ask anything and we either run unsafe/inefficient queries or hallucinate.”
- **Best of both worlds:**  
  - **Input:** Accept any natural-language question.  
  - **Understanding:** Use LLM (or rules) to map that to **intent + parameters** when possible, or respond with “I can only help with things like looking up patients, listing tests, filtering by date or HbA1c, etc.” when it’s out of scope.  
  - **Execution:** Run a **single, structured MongoDB query** for that intent.  
  - **Output:** Optionally use the LLM again to turn the result into a short, natural reply.  

So the user is not forced into a fixed list of phrases. They talk normally; the “restriction” is that we only execute a well-defined set of operations behind the scenes, which is what keeps things efficient and safe.

---

## 4. Summary

- **Yes**: Using LangGraph + LLM for **every** enquiry and treating MongoDB as an afterthought is **inefficient** (cost, latency, and wrong use of DB).
- **Efficient approach**: Treat the question set as **structured intents + parameters**. Use **MongoDB** with **indexed, structured queries** for all data access. Use **LLM/LangGraph** only for:
  - Optional NL understanding (when you can’t cover it with rules), and/or
  - Final answer phrasing.
- That way you get **predictable, fast DB access** and only pay for LLM where it adds real value (language and ambiguity), not for every “Find patient by phone” or “List tests where HbA1c &gt; 7”.
