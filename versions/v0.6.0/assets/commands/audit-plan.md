---
description: schematize-audit — plan-first: enumera e CONTA as fontes de checklist, fixa a cobertura-alvo e o recorte, gera o plano em MD e pede aprovação ANTES de varrer
argument-hint: "[dir do archive/recorte, ex: <projeto>_archive]"
---

Planeje a auditoria de histórico **plan-first** (`references/metodologia.md` §1). **Nada de
julgar item antes do inventário fechado.** Auditar sem contar é auditar incompleto.

1. **Descoberta das fontes** (`references/auditoria.md` §1). Varra
   `${ARGUMENTS:-<projeto>_archive}` **e** o worktree **e** o histórico git:
   - `find <archive> -name '*.md'`; `grep -rn -- '- \[ \]\|- \[~\]\|- \[x\]' <archive> .`;
     `grep -rni 'EM ABERTO\|TODO\|PENDENTE\|FIXME\|on-hold' <archive>`;
     `git log --diff-filter=D --name-only --pretty=format: | sort -u` (checklists que sumiram);
   - overdev (procure em `.schematize/overdev/` novo **E** em `.overdev/` legado):
     `.schematize/overdev/CHECKLIST.md`, `<archive>/overdev/OBJETIVO.md`, `premature-stops.log`,
     `./PERGUNTAS-OVERDEV.txt`, `DECISOES.md`/`PLAN.md`; Q.A.: `<archive>/qa/*.md`;
     contexto: `<archive>/context/*-checklist.md`; plano: `<archive>/plan/*.md`; ADRs `proposed`.

2. **Inventário numerado `F1..Fn`.** Liste **cada** artefato encontrado com índice. Esse `n` é a
   **cobertura-alvo** — a auditoria só fecha quando os `n` forem lidos e classificados.

3. **Recorte e escopo.** Projeto grande? recorte por marco/módulo/janela de data — mas
   **declare o recorte** (honesto: "auditei overdev de 2026-Q2", não "auditei tudo" tendo lido
   metade).

4. **Plano em MD** (grave em `<projeto>_archive/audit/<YYYY-MM-DD>-plano.md`):
   - o inventário `F1..Fn` + total de itens por estado por artefato (estimativa);
   - a **cobertura-alvo** e o recorte;
   - o plano de **spot-check por risco** (o que recebe verificação 100% — caminho crítico,
     segurança/IAM, dados/migração — vs amostra);
   - critério do gate: **zero órfãos RED** = histórico são.

5. **Peça aprovação** se a auditoria for cara (muitos artefatos / spot-check pesado). Aprovado,
   siga pro `/audit-run`.
