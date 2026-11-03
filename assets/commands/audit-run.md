---
description: schematize-audit — auditoria de histórico: enumera TODOS os checklists/promessas (overdev, Q.A., handoffs, planos, ADRs, PERGUNTAS parkeadas, premature-stops) e verifica se cada item foi SANADO — acha órfãos RED, gera checklist de saneamento e trava se sobrar
argument-hint: "[dir do archive, ex: <projeto>_archive]"
---

Rode a **auditoria de histórico** (`references/auditoria.md`): todo checklist criado no projeto
foi **mesmo sanado**? Fecha o loop `scan → plan → refactor → overdev` provando que o prometido
foi **entregue e verificado**, não só marcado. Se ainda não rodou o `/audit-plan`, faça a
enumeração aqui primeiro.

## 1. Enumere as fontes (e CONTE — `references/auditoria.md` §1, `metodologia.md` §2)
Varra o archive `${ARGUMENTS:-<projeto>_archive}`, o worktree **e** o histórico git:
- overdev (procure em `.schematize/overdev/` novo **E** em `.overdev/` legado):
  `.schematize/overdev/CHECKLIST.md`, `<archive>/overdev/OBJETIVO.md`, `premature-stops.log`,
  `./PERGUNTAS-OVERDEV.txt` (raiz do projeto), `DECISOES.md`/`PLAN.md`;
- Q.A.: `<archive>/qa/*.md`; contexto/handoff: `<archive>/context/*-checklist.md`; plano:
  `<archive>/plan/*.md`; ADRs `proposed`; scan: `<archive>/scan/*.md`; qualquer MD com
  `- [ ]`/`- [~]`/"EM ABERTO"; `git log --diff-filter=D` (o que sumiu do rastro).
Cobertura: `A` auditados / `A` existentes (**tem que bater**).

## 2. Classifique e cruze (§2)
Por item: `- [x]` feito · `- [ ]` **órfão RED** (nunca fechado) · `- [~]` on-hold (a pergunta
foi respondida? o item fechou?). Cruzamentos que pegam o buraco:
- overdev "concluído" com `- [ ]` aberto → só legítimo por budget/thrashing, e aí os itens
  **reaparecem** depois? sumiram = dívida esquecida;
- `premature-stops.log` → os itens que faltavam foram **eventualmente feitos**? (grep no
  código/testes/archive);
- pergunta parkeada em `PERGUNTAS-OVERDEV.txt` **respondida** em algum lugar?
- ADR `proposed` órfão (nunca ratificado/descartado); handoff "EM ABERTO" nunca retomado;
- achado de `/eng-scan` sem desfecho; decisão de `DECISOES.md` sem item derivado.

## 3. "Fechou de verdade" — prova, não fé (§3, `references/evidencias.md`)
`- [x]` sem evidência é **suspeito** (mesma disciplina do red-first e do "suspeito ≠ achado" da
`schematize-pentest`). Spot-check por risco nos itens feitos de caminho crítico/segurança/dados:
existe o teste/commit/arquivo? o gate passa **hoje**? Item marcado-feito que não se prova
**volta a aberto** no relatório.

## 4. Órfãos RED (§4) e saída
Reúna as sete espécies: `open_never_closed`, `on_hold_unanswered`, `parked_question_pending`,
`adr_proposed_orphan`, `done_unproven`, `ritmo_vencido` (piso 26), `local_divergente` (piso 22) — cada um com **origem** (`arquivo:linha` + data) e **o
que falta**. Gere o **checklist de saneamento** (os órfãos viram um **novo checklist**, candidato
a `/eng-overdev` — reabrir + resolver + verificar + reteste). Emita o **JSON** machine-readable
(`metodologia.md` §4). Consolide o relatório com `/audit-report`.

## 5. Gate — com exit code

Emita o JSON em `<projeto>_archive/audit/<data>.json` no schema
`assets/schemas/audit-run.schema.json` e **rode o gate**:

```bash
node .claude/skills/schematize-audit/scripts/audit-gate.mjs <projeto>_archive/audit/<data>.json --archive <projeto>_archive --repo .
```

`0` histórico são · `1` **reprova** · `2` documento inválido (conserte o JSON, nunca o schema).

O gate **não acredita no campo `verdict.healthy`** — recalcula da lista. Reprova: veredito que se
declara saudável com órfão vivo · `blocking_orphans` que não bate com a contagem · **cobertura
incompleta** (e de novo se `not_audited` estiver vazio: auditoria que não sabe o que não viu) ·
`totals.done_unproven` diferente dos órfãos `done_unproven` listados (feito sem prova volta a aberto
**com nome**) · desfecho sem motivo escrito ou datado no futuro.

Histórico são = **zero órfãos RED**. Qualquer aberto/hold/parkeado/feito-sem-prova sem desfecho
**não fecha** — é dívida rastreável. A auditoria **não fecha** item (não marque `[x]`): quem
fecha é o run de saneamento, com prova.

## Quando rodar
Fim de marco/entrega (antes do "pronto" macro), retomada de projeto parado, periódico/agendado em
projeto ativo, e depois de um `/eng-scan` grande (os achados viraram itens fechados?).
