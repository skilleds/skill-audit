---
description: schematize-audit — consolida cobertura + órfãos + saneamento + veredito num relatório e grava no <projeto>_archive/audit/
---

Consolide o **relatório** da auditoria (`references/relatorio.md`) e grave no archive.

1. **Sumário executivo + veredito primeiro:** **HISTÓRICO SÃO** ou **NÃO FECHA (N órfãos RED)**.
   Cobertura `A/A`. Totais por estado (`done / open / on_hold / done_unproven`).
2. **Escopo e cobertura:** recorte auditado (honesto) + inventário `F1..Fn` (cada artefato com
   total por estado). A cobertura `A_auditados / A_existentes` **tem que bater** — se não bate,
   diga quantos/quais ficaram de fora.
3. **Órfãos RED por tipo, com origem:** tabela das cinco espécies (`open_never_closed`,
   `on_hold_unanswered`, `parked_question_pending`, `adr_proposed_orphan`, `done_unproven`), cada
   um com `origem` (`arquivo:linha` + data), item, **o que falta** e `since` (há quanto tempo aberto).
4. **Checklist de saneamento:** os órfãos viram um **novo checklist** (candidato a
   `/eng-overdev`) — reabrir → resolver → verificar → reteste, cada linha com a **prova** que a
   fecha e a origem `Fi:linha`.
5. **Evidências (apêndice enxuto):** para os itens provados de caminho crítico, a evidência
   mínima (SHA / nome do teste / `arquivo:linha` / run do gate). Sanitize — sem segredo/dado real
   (segredo no rastro → sinalize **rotação**).
6. **Grave:** `<projeto>_archive/audit/<YYYY-MM-DD>.md` **+** `<YYYY-MM-DD>.json`
   (`references/metodologia.md` §4). O `verdict.healthy` do JSON e o veredito do MD dizem a mesma
   coisa.
7. **Fecha o loop:** ao fim do saneamento (`/eng-overdev`), **reaudite** — o órfão só morre
   quando a reauditoria não o vê mais; o novo relatório referencia este.
