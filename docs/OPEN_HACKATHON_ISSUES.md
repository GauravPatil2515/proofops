# Switch Hackathon: Track 3 Open Issues Directory

> **🚨 Maintainer Policy Update (Oct 22, 2026):** Maintainer `@petr-sandbox` announced:  
> *"In the interest of fairness, we will not be assigning issues to individual participants but instead let anyone try and solve any number of them."*  
> **Submission Window:** November 4, 12:01 AM IST to November 7, 11:59 PM IST. Competing PRs will be judged on code quality, test coverage, and strict adherence to repo architecture.

---

## High-Leverage Connectors (29 Issues)

Connectors follow `core/switch_core/connections/catalog/<slug>/` (`connection.yaml` + `skill/SKILL.md`). They do not require frontend or video recording, making them high-leverage for Track 3.

| Issue # | Title | Recommended Architecture & Direction | Link |
|---|---|---|---|
| **#825** | **Add the PagerDuty connector** | **`adapter: api_key` with MCP (`mcp.pagerduty.com`).** Validates via `api.{site}/users/me`. Zero shared loader modifications. | [View Issue](https://github.com/sandbox-quantum/switch/issues/825) |
| **#820** | **Add the Sentry connector** | **Remote MCP (`mcp.sentry.dev/mcp`).** Maintainer agreed on read/write split. | [View Issue](https://github.com/sandbox-quantum/switch/issues/820) |
| **#829** | **Add the Stripe connector** | **Remote MCP (`mcp.stripe.com`).** Restricted API keys or OAuth with strict read-only defaults. | [View Issue](https://github.com/sandbox-quantum/switch/issues/829) |
| **#840** | **Add the Snowflake connector** | **`adapter: api_key` with PAT.** Needs new `ApiKeyField` with pattern-validated URL parameters for account host. | [View Issue](https://github.com/sandbox-quantum/switch/issues/840) |
| **#841** | **Add the BigQuery connector** | **Remote MCP at `bigquery.googleapis.com/mcp`.** Static OAuth client `BIGQUERY` + read-only tool split. | [View Issue](https://github.com/sandbox-quantum/switch/issues/841) |
| **#770** | **Enable the Linear connector** | **Remote MCP (`mcp.linear.app/mcp`).** Needs POST method on `ConnectionIdentity` for GraphQL `viewer`. | [View Issue](https://github.com/sandbox-quantum/switch/issues/770) |
| **#827** | **Add the Supabase connector** | **Remote MCP with DCR.** Needs RFC 7591 secret support + optional `read_url`. | [View Issue](https://github.com/sandbox-quantum/switch/issues/827) |
| **#826** | **Add the Grafana connector** | **Remote MCP (`mcp.grafana.com/mcp`).** Grafana Cloud Assistant OAuth. | [View Issue](https://github.com/sandbox-quantum/switch/issues/826) |
| **#828** | **Add the Cloudflare connector** | **Remote MCP (`mcp.cloudflare.com/mcp`).** Minimal scopes for Workers/DNS. | [View Issue](https://github.com/sandbox-quantum/switch/issues/828) |
| #843 | Add the Zendesk connector | Needs pattern-validated host in URL. | [View Issue](https://github.com/sandbox-quantum/switch/issues/843) |
| #842 | Add the Intercom connector | Remote MCP / API Key. | [View Issue](https://github.com/sandbox-quantum/switch/issues/842) |
| #839 | Add the Dropbox connector | OAuth + POST identity check. | [View Issue](https://github.com/sandbox-quantum/switch/issues/839) |
| #838 | Add the Airtable connector | Base & table read/write MCP. | [View Issue](https://github.com/sandbox-quantum/switch/issues/838) |
| #837 | Add the Trello connector | Trello board/cards MCP. | [View Issue](https://github.com/sandbox-quantum/switch/issues/837) |
| #836 | Add the ClickUp connector | Workspace task manager MCP. | [View Issue](https://github.com/sandbox-quantum/switch/issues/836) |
| #835 | Add the Monday.com connector | Board & item management. | [View Issue](https://github.com/sandbox-quantum/switch/issues/835) |
| #834 | Add the Salesforce connector | CRM object inspection. | [View Issue](https://github.com/sandbox-quantum/switch/issues/834) |
| #833 | Add the Canva connector | Asset management & design tools. | [View Issue](https://github.com/sandbox-quantum/switch/issues/833) |
| #832 | Add the Box connector | Enterprise file store connector. | [View Issue](https://github.com/sandbox-quantum/switch/issues/832) |
| #831 | Add the Azure DevOps connector | Work items and pipeline status. | [View Issue](https://github.com/sandbox-quantum/switch/issues/831) |
| #830 | Add the HubSpot connector | CRM contacts and deal pipelines. | [View Issue](https://github.com/sandbox-quantum/switch/issues/830) |
| #824 | Add the Vercel connector | Deployment status and domain routes. | [View Issue](https://github.com/sandbox-quantum/switch/issues/824) |
| #823 | Add the New Relic connector | APM telemetry and alert conditions. | [View Issue](https://github.com/sandbox-quantum/switch/issues/823) |
| #822 | Add the Microsoft 365 connector | Mail, calendar, OneDrive tools. | [View Issue](https://github.com/sandbox-quantum/switch/issues/822) |
| #821 | Add the Asana connector | Tasks and project tracking. | [View Issue](https://github.com/sandbox-quantum/switch/issues/821) |
| #819 | Add the Notion connector | Page and database manipulation. | [View Issue](https://github.com/sandbox-quantum/switch/issues/819) |
| #818 | Add the Bitbucket connector | Repo, PRs, pipeline status. | [View Issue](https://github.com/sandbox-quantum/switch/issues/818) |
| #816 | Add the GitLab connector | Projects, merge requests, issues. | [View Issue](https://github.com/sandbox-quantum/switch/issues/816) |

---

## Messaging Platforms (12 Issues)

*Requires writing a chat adapter in `core/switch_core/bridges/collaboration/`, a docs page, adapter unit tests, and a 1–2 min demo video.*

| Issue # | Title | Status / Notes | Link |
|---|---|---|---|
| #799 | Bring-your-own messaging app (generic webhook) | Webhook-driven custom bot platform | [View Issue](https://github.com/sandbox-quantum/switch/issues/799) |
| #798 | Add IRC as a messaging platform | Socket connection to IRC servers | [View Issue](https://github.com/sandbox-quantum/switch/issues/798) |
| #797 | Add Lark / Feishu as a messaging platform | Webhook / Enterprise bot | [View Issue](https://github.com/sandbox-quantum/switch/issues/797) |
| #796 | Add SMS (Twilio) as a messaging platform | Inbound/outbound webhook adapter | [View Issue](https://github.com/sandbox-quantum/switch/issues/796) |
| #795 | Add Webex as a messaging platform | Webex bot API | [View Issue](https://github.com/sandbox-quantum/switch/issues/795) |
| #794 | Add Rocket.Chat as a messaging platform | Realtime API / REST adapter | [View Issue](https://github.com/sandbox-quantum/switch/issues/794) |
| #793 | Add external Matrix as a messaging platform | Matrix homeserver bridge | [View Issue](https://github.com/sandbox-quantum/switch/issues/793) |
| #792 | Add Signal as a messaging platform | Signal-cli / REST gateway | [View Issue](https://github.com/sandbox-quantum/switch/issues/792) |
| #791 | Add Zulip as a messaging platform | Stream and topic bot adapter | [View Issue](https://github.com/sandbox-quantum/switch/issues/791) |
| #790 | Add Google Chat as a messaging platform | Google Chat App webhook/service account | [View Issue](https://github.com/sandbox-quantum/switch/issues/790) |
| #789 | Add WhatsApp as a messaging platform | Cloud API / Twilio gateway | [View Issue](https://github.com/sandbox-quantum/switch/issues/789) |
| #769 | Add email as a messaging platform | IMAP/SMTP inbound/outbound | [View Issue](https://github.com/sandbox-quantum/switch/issues/769) |

---

## Agent Providers (16 Issues)

*Requires an ACP adapter in `console/packages/agent-providers/`, real CLI integration test summary (`vitest run`), and a short demo video.*

| Issue # | Title | Provider Tool | Link |
|---|---|---|---|
| #780 | Add Goose as an agent provider | Goose CLI (Block) | [View Issue](https://github.com/sandbox-quantum/switch/issues/780) |
| #784 | Add Cline CLI as an agent provider | Cline CLI ACP mode | [View Issue](https://github.com/sandbox-quantum/switch/issues/784) |
| #786 | Add OpenHands as an agent provider | OpenHands runtime | [View Issue](https://github.com/sandbox-quantum/switch/issues/786) |
| #778 | Add GitHub Copilot CLI as an agent provider | Copilot CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/778) |
| #788 | Add Aider as an agent provider | Aider coding agent | [View Issue](https://github.com/sandbox-quantum/switch/issues/788) |
| #787 | Add Junie as an agent provider | JetBrains Junie | [View Issue](https://github.com/sandbox-quantum/switch/issues/787) |
| #785 | Add Auggie as an agent provider | Augment Code | [View Issue](https://github.com/sandbox-quantum/switch/issues/785) |
| #783 | Add Factory Droid as an agent provider | Factory CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/783) |
| #782 | Add Qwen Code as an agent provider | Qwen Code CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/782) |
| #781 | Add Amp as an agent provider | Amp CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/781) |
| #779 | Add Kiro CLI as an agent provider | Kiro CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/779) |
| #777 | Add Pi as an agent provider | Inflection Pi agent | [View Issue](https://github.com/sandbox-quantum/switch/issues/777) |
| #776 | Add Kimi Code as an agent provider | Moonshot Kimi | [View Issue](https://github.com/sandbox-quantum/switch/issues/776) |
| #775 | Add Grok Build as an agent provider | xAI Grok Build | [View Issue](https://github.com/sandbox-quantum/switch/issues/775) |
| #774 | Add Mistral Vibe as an agent provider | Mistral CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/774) |
| #768 | Add DeepSeek Harness as an agent provider | DeepSeek CLI | [View Issue](https://github.com/sandbox-quantum/switch/issues/768) |

---

## Core Protocol & UX (8 Issues)

| Issue # | Title | Domain | Link |
|---|---|---|---|
| #806 | Prettify the agent controller CLI output | Terminal formatting / rich tables | [View Issue](https://github.com/sandbox-quantum/switch/issues/806) |
| #805 | Room invites should respect who can talk to an agent | Authorization & room ACLs | [View Issue](https://github.com/sandbox-quantum/switch/issues/805) |
| #804 | Handle edits to a message the agent hasn't picked up yet | Sequence ordering & event updates | [View Issue](https://github.com/sandbox-quantum/switch/issues/804) |
| #803 | Show tool input and output in the channel, safely | UI redaction & card rendering | [View Issue](https://github.com/sandbox-quantum/switch/issues/803) |
| #802 | Show running subagents on the activity card | Activity card real-time presence | [View Issue](https://github.com/sandbox-quantum/switch/issues/802) |
| #801 | Deliver messages sent mid-turn to the running agent (steering) | Agent connection protocol steering | [View Issue](https://github.com/sandbox-quantum/switch/issues/801) |
| #800 | Cancel a pending message before the agent picks it up | Message cancellation & queue purging | [View Issue](https://github.com/sandbox-quantum/switch/issues/800) |
| #771 | Scheduled messages to agents in a room | Cron & periodic room triggers | [View Issue](https://github.com/sandbox-quantum/switch/issues/771) |

---

## Docs & Guides (2 Issues)

| Issue # | Title | Domain | Link |
|---|---|---|---|
| #808 | Five-minute quickstart for new contributors | Onboarding doc + CRLF bug fix | [View Issue](https://github.com/sandbox-quantum/switch/issues/808) |
| #807 | Write the agent controller guide | Self-hosting & headless controller setup | [View Issue](https://github.com/sandbox-quantum/switch/issues/807) |
