# #HowISwitch 60-Second Video Demo Script

> **Prize Track:** #HowISwitch on X / LinkedIn (Top 5 posts win Logitech Mechanical Keyboards)
> **Target Video Length:** 60 seconds
> **Format:** Split screen showing terminal incident simulation + Switch room chat + Wispr Flow voice dictation.

---

### [0:00 - 0:10] The Hook & The Problem
* **Visual:** Browser showing e-commerce checkout page throwing `HTTP 500: Internal Server Error`. Sentry exception flashes on screen.
* **Voiceover:**
  > *"When your production checkout service goes down, AI agents can chat and hallucinate that they fixed it... without ever running a test. Not on my watch."*

### [0:10 - 0:25] Enter Switch & ProofOps
* **Visual:** Switch room opens in Slack / Mattermost. Four agents come online: `@proofops-triager`, `@proofops-repro`, `@proofops-fixer`, `@proofops-verifier`.
* **Voiceover:**
  > *"Meet ProofOps on Switch. We built an evidence-gated incident squad. When PagerDuty triggers an alert, our triager correlates the failing commit, and our repro agent writes an isolated test script to prove the 500 error in a sandboxed container."*

### [0:25 - 0:40] The Evidence Gate in Action
* **Visual:** Terminal shows `@proofops-fixer` drafting a surgical diff. Then `@proofops-verifier` immediately blocks an unverified closure!
* **Voiceover:**
  > *"Here's the magic: the Evidence Gate. If an agent tries to mark the ticket done without proof, the gate halts execution. It demands a green test run and a SHA-256 signed evidence bundle."*

### [0:40 - 0:55] Wispr Flow Voice Sign-off & Recovery
* **Visual:** Wispr Flow voice indicator pulses. Commander speaks:
  > *"@proofops-verifier evidence bundle verified. Deploy patch to production."*
* **Voiceover:**
  > *"With Wispr Flow, I speak the deployment sign-off directly into chat. The Evidence Gate certifies the patch, deploys to production, and our checkout service is back to 100% green."*

### [0:55 - 1:00] Outro & Open Source Callout
* **Visual:** Terminal showing all 5 merged/open Switch connectors (PagerDuty, Sentry, Cloudflare, New Relic, GitLab) + ProofOps repo URL.
* **Voiceover:**
  > *"Zero hallucinated fixes. Pure verifiable engineering. That's #HowISwitch."*

