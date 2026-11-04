# ProofOps + Wispr Flow: Voice-Driven Incident Commander

> **Code with Wispr Side Track ($500 Prize)**
> Build your Switch project by voice with Wispr Flow.

## 1. Overview
In high-stress live production outages, typing lengthy bash commands and multi-paragraph prompts slows down response times. ProofOps integrates **Wispr Flow voice dictation** so the human Incident Commander can speak naturally in Slack, Teams, Discord, or Mattermost to direct the autonomous Switch agent squad.

---

## 2. Voice Incident Command Playbook

| Phase | Voice Prompt Dictated via Wispr Flow | Triggered Switch Room Action |
|---|---|---|
| **Intake & Triage** | *"@proofops-triager alert received for checkout API. Restate the problem, scan recent git commits, and find the culprit release."* | Triager correlates PagerDuty/Sentry alert with commit history; posts one-line diagnosis. |
| **Reproduction** | *"@proofops-repro spin up an isolated staging runner, reproduce the 500 error with promo code SAVE20, and output raw logs."* | ReproLab agent runs `repro_script.py`, capturing stderr trace and proving failure state. |
| **Hotfix Crafting** | *"@proofops-fixer inspect the zero division regression in app.py line 48 and prepare a surgical diff patch."* | Fixer analyzes the failing expression and submits the minimal diff. |
| **Evidence Audit** | *"@proofops-verifier intercept task closure. Run the full regression suite and generate the SHA-256 evidence bundle."* | Verifier runs test suite, checks diff hash, and produces `evidence-bundle.json`. |
| **Production Sign-off** | *"@proofops-verifier evidence bundle verified. Deploy patch to production and resolve incident #10842."* | Human authorization gate unblocks production deploy; incident marked RESOLVED. |

---

## 3. Wispr Flow Scorecard Checklist
To submit for the $500 Wispr Flow track:
1. Open the **Wispr Flow Desktop App** on Linux/Mac/Windows.
2. Navigate to **Insights / Scorecard**.
3. Take a screenshot showing words dictated during development.
4. Save screenshot to `proofops/wispr/wispr_flow_scorecard.png`.
5. Attach the screenshot and this playbook to the hackathon submission form.

