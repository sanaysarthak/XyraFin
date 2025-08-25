# StellAI Backend (AI Agent APIs)

Endpoints:
- `POST /score` -> returns a credit risk score 0..100 and a recommendation
- `POST /fraud` -> returns a fraud risk score 0..100 and flags

Both are deterministic, rule-based + heuristics for demo (no external services).
