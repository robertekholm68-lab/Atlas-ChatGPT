# AGENTS.md

## Purpose

This repository contains the source code for ASKR.

ASKR is a premium fitness and health application focused on simplicity, usability, and long-term maintainability.

Every implementation should improve consistency before adding complexity.

---

# Source of Truth

Always follow the documentation in:

/docs/design/DESIGN_RULES.md

The visual reference is:

/docs/design/ASKR_Brand_Style_Guide.pdf

If implementation conflicts with the design documentation, the documentation takes precedence unless explicitly instructed otherwise.

---

# General Principles

Prefer improving existing code over creating new systems.

Reuse components whenever possible.

Avoid duplicate implementations.

Keep changes focused.

One pull request should solve one clearly defined problem.

---

# UI Rules

Never introduce new colors.

Never introduce new typography.

Never hardcode spacing values if shared spacing tokens exist.

Never hardcode border radius if shared tokens exist.

Never create new button styles unless requested.

Never redesign screens unless explicitly instructed.

Follow the 90/10 Volt usage rule defined in DESIGN_RULES.md.

---

# Theme System

Whenever possible use shared theme tokens instead of literals.

Examples include:

- colors
- spacing
- typography
- border radius
- motion
- sizing

Do not duplicate tokens.

---

# Components

Prefer extending existing components over creating new ones.

Shared UI components should remain generic and reusable.

Avoid page-specific component logic inside shared UI components.

---

# Code Style

Write readable code.

Prefer explicit names over abbreviations.

Avoid unnecessary abstraction.

Keep files focused.

Avoid deeply nested logic.

---

# Performance

Avoid unnecessary renders.

Avoid duplicate state.

Avoid unnecessary dependencies.

Prefer lightweight solutions.

---

# Accessibility

Maintain readable contrast.

Keep interactive targets appropriately sized.

Use semantic HTML where possible.

Never reduce accessibility to achieve visual effects.

---

# Before Finishing Any Task

Verify:

- project builds successfully
- lint passes
- type-check passes (if available)

Do not fix unrelated issues unless explicitly requested.

Instead, report them separately.

---

# Pull Requests

Every completed task should include:

- summary of changes
- files modified
- build status
- lint status
- remaining observations

Keep pull requests small and easy to review.

---

# Out of Scope

Unless explicitly requested:

- do not redesign the application
- do not refactor unrelated code
- do not rename files unnecessarily
- do not introduce new libraries
- do not change architecture

Stay focused on the requested task.
