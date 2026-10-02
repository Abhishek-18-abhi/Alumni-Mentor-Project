# Model Card: AI Advisory & Natural Language Explanation Service

> **Capstone Project BCA-05**  
> **Service Module:** `backend/services/aiService.js`  
> **Underlying Model:** Anthropic Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`) with Deterministic Rule-Based Fallback Engine  
> **Specification Standard:** Mitchell et al. Model Cards for Model Reporting

---

## 1. Intended Use & Scope

### 1.1 Primary Purposes
1. **Explainable Match Synthesis (`/api/ai/explain-match`):** Translate mathematical overlap factors and numerical scores into natural, professional rationales that help students understand why an alumni mentor was recommended.
2. **SMART Goal Generation (`/api/ai/suggest-goals`):** Assist students and mentors in formulating Specific, Measurable, Achievable, Relevant, and Time-bound milestones aligned with both participants' expertise.
3. **Executive Request Summarization (`/api/ai/summarize-request`):** Provide busy alumni mentors with concise 2-sentence digests of incoming student requests.
4. **Thematic Feedback Synthesis (`/api/ai/summarize-feedback`):** Aggregate student survey comments for academic administrators without exposing individual names or private identifiers.

### 1.2 Out-of-Scope & Prohibited Uses
- **Autonomous Match Decision Making:** The AI model is strictly prohibited from computing, altering, or overriding numerical compatibility scores. Match math is 100% deterministic and calculated server-side.
- **Automated Accept/Decline:** Mentorship decisions remain entirely in human hands.
- **PII Transmission:** Sending real student emails, phone numbers, home addresses, or financial data to external model APIs.

---

## 2. Privacy & PII Safeguards

The platform employs a zero-PII architectural barrier before contacting external LLMs:
- **Sanitization Layer:** All prompt text passes through regex filters in `backend/services/aiService.js` replacing email patterns (`[REDACTED_EMAIL]`) and phone numbers (`[REDACTED_PHONE]`).
- **Feature-Only Context:** Prompts receive only abstract skill names, career goals, spoken languages, and numerical score breakdowns.

---

## 3. Deterministic Fallback Engine

To maintain high availability during network partitions or when `ANTHROPIC_API_KEY` is not provided:
- **Zero-Failure Guarantee:** Every AI function possesses a local JavaScript fallback generator.
- **Response Latency:** Fallbacks execute synchronously in under 2ms.
- **Audit Transparency:** Every response indicates its provenance:
  - `source: "anthropic-claude"`
  - `source: "deterministic-fallback"`
- **Telemetry:** Admins inspect fallback rates in real time via `GET /api/metrics` and `GET /api/ai/status`.

---

## 4. Bias Checks & Fairness Evaluation

| Potential Bias Factor | Risk Description | Architectural Mitigation |
|---|---|---|
| **Seniority Bias** | High-profile mentors in large tech companies receive disproportionate requests. | **Capacity constraint:** High-profile mentors cap at their declared limit (e.g. 2 mentees). The matching engine lowers their capacity score to 0 once filled, surfacing emerging alumni. |
| **Hallucination of Skills** | LLM generates explanations claiming mentors know skills they do not possess. | **Strict Factor Grounding:** Explanations are prompt-bound to server-supplied factor breakdowns. Faithfulness benchmark verified at 100% in `eval/run_experiments.py`. |
| **Prompt Injection** | Malicious users input system prompt overrides into profile fields. | **Decoupled Math:** Numerical scoring is calculated strictly by JavaScript matrix operations; text injections cannot alter scores or leak system keys. |
