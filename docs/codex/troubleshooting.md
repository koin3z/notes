# Troubleshooting

Use this file for failures whose diagnosis or fix is likely to be reused. Do not add
one-off mistakes unless they reveal a repository-specific constraint.

## Recording rules

- Describe the observable symptom before the diagnosis.
- Include the sanitized command or workflow, environment assumptions, root cause,
  resolution, and verification.
- Record failed attempts only when they narrow the diagnosis; explain why they failed.
- Mark workarounds clearly and state when they can be removed.
- Never save authentication credentials, API keys, tokens, cookies, Authorization
  headers, private keys, passwords, or their values. Redact them from commands, URLs,
  logs, headers, and error excerpts before recording.

## Entry template

```markdown
## Short symptom or error

- Last verified: YYYY-MM-DD
- Applies to:
- Symptom:
- Sanitized command or workflow:
- Cause:
- Resolution:
- Verification:
- Failed attempts:
- Workaround expiry/removal condition:
- Related:
  - [Research entry](research-log.md#anchor), if applicable
  - [Decision entry](decisions.md#anchor), if applicable
```

## Entries

No entries yet.
