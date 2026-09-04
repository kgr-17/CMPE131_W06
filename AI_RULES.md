# Project AI Rules

This file is the canonical source of truth for AI behavior in this repository.

## Mandatory Startup Procedure

Before modifying the repository:

1. Read `AI_RULES.md`.
2. Read `.ai/skills/README.md`.
3. Read the skill files relevant to the task.
4. Inspect the existing relevant code.
5. Prefer minimal changes.

## Human Ownership

AI assistants are tools, not team contributors. Never add an AI as a Git contributor, author, co-author, or academic team member; add AI attribution such as `Co-authored-by: ChatGPT`, `Claude`, or `Codex`; or change Git author identity to an AI. Human students must review and submit all work.

## Git Safety

Unless specifically requested, do not commit, push, force-push, merge pull requests, rewrite Git history, or change Git configuration.

## Code Changes

Understand existing code first. Make small, focused changes; avoid unrelated refactoring, unnecessary dependencies, and unnecessary architecture. Favor readable, student-friendly code and preserve working functionality.

## Security

Never commit passwords, API keys, access tokens, private keys, secrets, or real `.env` credentials. Backend secrets must not be exposed to frontend code.

## Docker

Docker Compose is the standard development environment. Changes must not unnecessarily break `docker compose up --build`.

## Testing

Run relevant tests and builds where appropriate. Report what was actually tested, including failed or unavailable checks. Never claim an unperformed test succeeded.

## Completion

Finish with a concise report using these headings unless the human requests otherwise:

### Changed

### Files

### Verification

### Notes
