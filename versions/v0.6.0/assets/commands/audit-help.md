---
description: schematize-audit — lista todos os comandos disponíveis e o que cada um faz
---

Liste os comandos do **schematize-audit** instalados (`/audit-*`), com 1 linha cada:

- `/audit-help` — esta lista.
- `/audit-plan` — plan-first: enumera e **CONTA** as fontes de checklist (archive + histórico git), fixa a cobertura-alvo e o recorte, gera o plano em MD e pede aprovação ANTES de varrer.
- `/audit-run` — a **auditoria** em si: enumera as fontes, classifica cada item (feito/aberto/on-hold), cruza com a realidade, faz spot-check de prova, acha os **órfãos RED** (aberto nunca fechado, on-hold sem resposta, ADR proposed órfão, "feito" sem prova → volta a aberto), gera o checklist de saneamento e **trava** em órfão RED.
- `/audit-report` — consolida cobertura A/A + órfãos por tipo (com origem) + checklist de saneamento + veredito e grava em `<projeto>_archive/audit/<data>.md` (+ JSON).
- `/audit-load` — carrega à força TODO o corpo normativo (auditoria, metodologia, evidências, relatório) e passa a aplicá-lo.
- `/audit-claude` — cria ou mescla o `CLAUDE.md` sempre-on de auditoria na raiz do repo.
- `/audit-cc` — context compact: gera handoff no archive e roda `/compact`.
- `/audit-handoff` — gera o handoff (context.md + checklist.md) sem compactar.

Depois da lista, lembre a **regra de ouro**: *checklist criado é dívida até ser sanado.* O gate
da auditoria trava enquanto sobrar **um** órfão RED, e "feito" só conta com **prova** (mesma
disciplina do "suspeito ≠ achado" da `schematize-pentest`). Os órfãos viram um `/eng-overdev` de
saneamento; a auditoria **não fecha** item, ela verifica. Detalhe normativo em `references/` da
skill `schematize-audit`; a base (overdev/DoD/archive/índice) é a `schematize-engineering`.
