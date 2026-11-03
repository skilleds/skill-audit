# Relatório de auditoria — anatomia, veredito e onde gravar

O produto da auditoria é um **relatório** durável: prova a cobertura, lista os órfãos com
origem, entrega o checklist de saneamento e crava o veredito de gate. Sem relatório no archive,
a auditoria **não aconteceu** (§28 da engenharia). Este reference define a anatomia; a
disciplina está em `auditoria.md`, o método em `metodologia.md`, a prova em `evidencias.md`.

## 1. Onde gravar

- **Relatório humano:** `<projeto>_archive/audit/<YYYY-MM-DD>.md` (um por auditoria; se houver
  recorte, `<YYYY-MM-DD>-<recorte>.md`).
- **Saída machine-readable:** `<projeto>_archive/audit/<YYYY-MM-DD>.json` (formato em
  `metodologia.md` §4) — o que CI/painel leem pro veredito.
- **Plano (plan-first):** `<projeto>_archive/audit/<YYYY-MM-DD>-plano.md` (inventário `F1..Fn` +
  cobertura-alvo), gerado pelo `/audit-plan` antes da varredura.

Nunca no root. O root fica limpo (código, config, README/CLAUDE/LICENSE).

## 2. Anatomia do relatório (nesta ordem)

### 2.1 Sumário executivo (3-5 linhas)
Veredito primeiro: **histórico são** ou **NÃO fecha (N órfãos RED)**. Cobertura `A/A`. Totais
por estado. A pergunta que o leitor tem é "posso dizer que está pronto?" — responda na primeira linha.

### 2.2 Escopo e cobertura
- **Recorte auditado** (tudo / marco / módulo / janela de data) — explícito e honesto.
- **Inventário `F1..Fn`:** a lista dos artefatos auditados (do `/audit-plan`), cada um com o
  total de itens por estado. Tabela:

  | # | Artefato | abertos | feitos | on-hold | provados / reabertos |
  |---|---|---|---|---|---|
  | F1 | `overdev/OBJETIVO.md` | 2 | 30 | 1 | 28 / 2 |
  | … | … | … | … | … | … |

- **Cobertura:** `A_auditados / A_existentes` — **tem que bater**. Se não bater, diga quantos e
  quais ficaram de fora e por quê (a auditoria é incompleta e o relatório admite).

### 2.3 Órfãos RED — por tipo, com origem (a seção que importa)
Agrupe pelas cinco espécies (§4 do `auditoria.md`). Cada órfão em uma linha rastreável:

| Tipo | Origem (`arquivo:linha` + data) | Item | O que falta | Desde |
|---|---|---|---|---|
| `open_never_closed` | `overdev/OBJETIVO.md:41` (2026-06-02) | migração reversível do billing | migration `down` + teste de rollback | 74d |
| `done_unproven` | `plan/2026-05-10.md:22` | rate-limit em `/login` | marcado `[x]`, sem middleware nem teste → **reaberto** | — |
| `on_hold_unanswered` | `PERGUNTAS-OVERDEV.txt:3` | formato do webhook de repasse | usuário nunca respondeu; item on-hold parado | 40d |
| `adr_proposed_orphan` | `<projeto>_archive/decisoes/ADR-0007-fila.md` | escolha de fila (SQS vs NATS) | `proposed` há 2 meses; nunca `accepted`/`rejected` | 61d |

Os tipos: `open_never_closed`, `on_hold_unanswered`, `parked_question_pending`,
`adr_proposed_orphan`, `done_unproven`.

### 2.4 Checklist de saneamento (o conserto)
Os órfãos viram um **novo checklist** — a projeção executável do conserto, candidato a
`/eng-overdev`. Cada linha: reabrir → resolver → verificar → reteste, com a **prova** exigida.

```
## Saneamento — auditoria 2026-08-15  (candidato a /eng-overdev)
- [ ] billing: escrever migration `down` + teste de rollback (prova: aplica e reverte verde)  ← F1:41
- [ ] /login: implementar rate-limit + teste que prova 429 no estouro (prova: teste passa)     ← F3:22 (reaberto)
- [ ] webhook de repasse: obter resposta do usuário OU assumir default documentado + ADR       ← PERGUNTAS:3
- [ ] fila SQS vs NATS: ratificar ADR-0007 (accepted/rejected com motivo datado)               ← decisoes/ADR-0007-fila.md
```

Cada item aponta a **origem** (`Fi:linha`) e a **prova** que o fecha. Auditoria que aponta e não
gera o conserto é meia-auditoria.

### 2.5 Veredito de gate
Binário e explícito:

- **HISTÓRICO SÃO** — zero órfãos RED. O macro pode dizer "pronto" (quanto ao rastro).
- **NÃO FECHA — N órfãos RED** — lista os N; o "pronto" fica **bloqueado** até o saneamento +
  reauditoria. Dívida rastreável, não "já era".

### 2.6 Evidências (apêndice enxuto)
Para os itens provados de caminho crítico, a **evidência mínima** (SHA / nome do teste /
`arquivo:linha` / run do gate) — o suficiente pra reexecutar, nunca o log inteiro. Sanitize:
sem segredo/dado real (se achou segredo no rastro, sinalize **rotação**).

## 3. Regras do relatório

- **Rastreável até a fonte:** todo órfão tem `origem` (`arquivo:linha` + data). Órfão sem origem
  não é acionável.
- **Datado (`since`):** desde quando o item está aberto (do git/data do artefato) — prioriza o
  saneamento (o que apodrece há mais tempo sobe).
- **Sem `[x]` da auditoria:** o relatório **reabre** (feito-sem-prova) e **aponta**; quem fecha é
  o run de saneamento. A auditoria é read-mostly sobre o histórico.
- **JSON casado com o MD:** o `verdict.healthy` do JSON e o veredito do MD dizem a mesma coisa.
  Divergência entre os dois é bug do relatório.
- **Fecha o loop:** ao fim do saneamento (`/eng-overdev`), **reaudite** — o órfão só morre
  quando a reauditoria não o vê mais. O relatório da reauditoria referencia o anterior (a série
  mostra os órfãos caindo).
