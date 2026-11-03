# Auditoria de histórico — todo checklist criado foi mesmo sanado?

> A casa gera **muitos checklists** — overdev, Q.A., handoffs de contexto, planos, ADRs,
> TASKs, perguntas parkeadas. A pergunta que este reference responde: **algum deles ficou com
> item aberto, pergunta parkeada sem resposta, ou "concluído" que nunca foi de verdade?** É a
> revisão de histórico que fecha o loop de `scan → plan → refactor → overdev`: prova que o que
> foi prometido foi **entregue e verificado**, não só marcado.

A auditoria é **read-mostly** sobre o rastro. Ela **não fecha** item (isso é papel do run de
saneamento, com prova) — ela **enumera, classifica, cruza, prova e veta**. O produto é um
relatório com veredito de gate e um checklist de conserto.

## 1. O que se audita (as fontes) — enumere e CONTE

Enumere **todos** os artefatos com checklist/promessa no projeto — do `<projeto>_archive/` e do
**histórico git** (arquivos apagados/renomeados ainda contam; `git log`/`git show`). Conte-os:
esse total é o **alvo de cobertura** (§ `metodologia.md`). Artefato de fora = auditoria
incompleta.

| Fonte | Onde | O que carrega |
|---|---|---|
| **Overdev — run ativo** | procure em `.schematize/overdev/CHECKLIST.md`, `.schematize/overdev/state.json` (novo layout) **E** em `.overdev/CHECKLIST.md`, `.overdev/state.json` (legado) | itens `- [ ]`/`- [x]`/`- [~]` do run corrente |
| **Overdev — registro durável** | `<projeto>_archive/overdev/OBJETIVO.md` | o checklist espelhado (registro humano) |
| **Overdev — decisões/plano** | procure em `.schematize/overdev/DECISOES.md`, `.schematize/overdev/PLAN.md` (novo) **E** em `.overdev/DECISOES.md`, `.overdev/PLAN.md` (legado) — + espelho no archive | decisões ADR-lite e o mapa decisão→item |
| **Overdev — paradas prematuras** | `<projeto>_archive/overdev/premature-stops.log` | ciclos em que o agente tentou parar com item aberto (timestamp + itens que faltavam) |
| **Overdev — perguntas parkeadas** | `./PERGUNTAS-OVERDEV.txt` (base do projeto) | dúvidas on-hold que o usuário deveria ter respondido |
| **Q.A. plan-first** | `<projeto>_archive/qa/*.md` | planos de Q.A. aprovados (passo a passo) |
| **Contexto / handoff** | `<projeto>_archive/context/*-checklist.md` | **FEITO vs EM ABERTO** de cada compactação/troca de sessão |
| **Plano** | `<projeto>_archive/plan/*.md` | plano do `/eng-plan` (fases + DoD + checklist derivado) |
| **ADR** | `<projeto>_archive/decisoes/ADR-NNNN-<slug>.md` | decisões marcadas `proposed` que nunca viraram `accepted`/`rejected` |
| **Scan** | `<projeto>_archive/scan/*.md` | achados do `/eng-scan` (viraram itens fechados?) |
| **Git (piso 22)** | `git status --porcelain`, `git rev-list @{u}..HEAD`, `git remote -v` | árvore suja, commit não empurrado ou sem remote = órfão `local_divergente` (local ≠ publicado) |
| **Ritmo (piso 26)** | `<projeto>_archive/relatorios/AAAA-MM-DD_HHMM.md`, `<projeto>_archive/.ritmo.json`, `<projeto>_archive/custos/` | `check-ritmo.sh` da engineering falhando (relatório > 30 min, handoff > 6 h) = órfão `ritmo_vencido` |
| **Qualquer MD** | archive + histórico git | linhas `- [ ]` / `- [~]`, seções "TODO / EM ABERTO / PENDENTE / FIXME" |

> Regra de enumeração: `grep -rn -- '- \[ \]\|- \[~\]\|EM ABERTO\|TODO\|PENDENTE\|FIXME'` no
> archive **e** no worktree, cruzado com `git log --diff-filter=D` (o que sumiu do rastro). O
> `metodologia.md` detalha a varredura e a saída machine-readable.

## 2. O que se verifica por item — classifique e cruze

Para cada artefato, classifique **cada linha** e cruze com a realidade:

| Estado | Significado | Suspeita a investigar |
|---|---|---|
| `- [x]` feito | fechado | **fechou de verdade?** (§3 — checkbox sem prova é suspeito) |
| `- [ ]` aberto | **nunca fechado** | é **órfão RED**: o run/plano encerrou deixando isto? foi retomado depois? |
| `- [~]` on-hold | pergunta parkeada | a pergunta em `PERGUNTAS-OVERDEV.txt` foi **respondida** em algum lugar? o item foi então fechado? |

Cruzamentos que pegam o buraco (é aqui que a auditoria ganha o pão):

- **Overdev "concluído" com `- [ ]` aberto:** só é legítimo se fechou por budget/thrashing
  (parada legítima do overdev) — e aí os itens travados **têm** que reaparecer num run/plano
  posterior. Sumiram do rastro? é **dívida esquecida**, órfão RED.
- **`premature-stops.log` com itens que faltavam:** aqueles itens foram **eventualmente
  feitos**? Faça grep no código/testes/archive por cada um. Falta = órfão RED.
- **Pergunta parkeada sem resposta:** `PERGUNTAS-OVERDEV.txt` com pergunta que ninguém
  respondeu = decisão pendente virou permanente por esquecimento. O item on-hold correspondente
  nunca fechou → órfão RED.
- **ADR `proposed` órfão:** decisão que nunca foi ratificada (`accepted`) nem descartada
  (`rejected`) — está valendo por acidente? Órfão RED de decisão.
- **Handoff "EM ABERTO" nunca retomado:** o próximo run continuou de onde o handoff parou? Se
  o "EM ABERTO" de um handoff antigo não aparece fechado em nenhum artefato posterior → órfão.
- **Achado de `/eng-scan` sem desfecho:** o achado (arquivo:linha + severidade) virou item
  fechado com prova, ou evaporou? Scan que não vira conserto é ruído.
- **Decisão de `DECISOES.md` sem item:** cada decisão acordada deveria ter gerado ≥1 item no
  plano/checklist. Decisão sem item = combinou e não fez.

## 3. "Fechou de verdade" — prova, não fé (a guarda no vermelho)

Um `- [x]` sem evidência é **suspeito**, não fato — a mesma disciplina do red-first e do
"suspeito ≠ achado" da `schematize-pentest`. Faça **spot-check** dos itens marcados feitos que
tocam **caminho crítico**: existe o teste/commit/arquivo que prova? o gate correspondente
**passa hoje**? (o detalhe do que conta como prova está em `evidencias.md`.)

> Item marcado feito cujo código sumiu, cujo teste não existe, ou cujo gate falha agora
> **volta a aberto** no relatório. "Estava feito na época" não conta: a auditoria julga o
> **estado de hoje**. Regressão silenciosa é órfão RED igual a item que nunca foi feito.

Nem tudo é spot-check exaustivo (seria refazer o projeto). Priorize por risco: caminho crítico,
segurança/IAM, dados/migração, pontos que a DoD (§35) e os pisos da engenharia (§37) marcam como
inegociáveis. Item trivial marcado feito recebe amostragem; item crítico recebe verificação.

## 4. Órfão RED — a definição operacional

**Órfão RED** é qualquer promessa sem desfecho comprovado. Reúne sete espécies (cinco de checklist e duas dos pisos 22/26):

1. **Aberto nunca fechado** — `- [ ]` que não reaparece resolvido em run/plano posterior.
2. **On-hold sem resposta** — `- [~]` cuja pergunta parkeada segue sem resposta e o item nunca fechou.
3. **Pergunta parkeada pendente** — linha em `PERGUNTAS-OVERDEV.txt` que ninguém respondeu.
4. **ADR proposed órfão** — decisão `proposed` que nunca virou `accepted`/`rejected`.
5. **"Feito" sem prova** — `- [x]` cuja evidência não existe ou cujo gate não passa hoje → **volta a aberto**.
6. **Local divergente (piso 22)** — `local_divergente`: árvore suja, commit não empurrado ou sem remote.
7. **Ritmo vencido (piso 26)** — `ritmo_vencido`: `check-ritmo.sh` reprova (relatório > 30 min, handoff > 6 h).

Órfão RED é o **único** desfecho que trava o gate (§6). O resto (feito-provado, on-hold com
resposta e item já fechado depois) é histórico são.

## 5. Saída — o veredito e o conserto

Grava em `<projeto>_archive/audit/<data>.md` (anatomia completa em `relatorio.md`):

- **Cobertura:** `A` artefatos auditados / `A` existentes (tem que bater); total de itens por estado.
- **Órfãos RED** (o que importa): lista das sete espécies (§4), cada um com **origem**
  (artefato + data + linha) e **o que falta** pra sanar.
- **Checklist de saneamento:** os órfãos viram um **novo checklist** (candidato a
  `/eng-overdev`) pra fechar de vez — reabrir + resolver + verificar + reteste.
- **Veredito de gate:** **histórico são** só quando **zero órfãos RED**. Qualquer aberto/hold/
  parkeado sem desfecho = **não fecha** — é dívida rastreável, não "já era".

## 6. Quando rodar

- **Fim de marco/entrega**, antes de dizer "pronto" no macro (não só na task).
- **Início de retomada** de um projeto parado (o que ficou pra trás?).
- **Periódico** (cron/agendado) em projeto ativo — o overdev fecha a sessão viva; o audit
  cobre o "ficou um rastro no histórico" (integração em `metodologia.md`).
- Depois de um `/eng-scan` grande, pra garantir que os achados **viraram** itens fechados.

> Regra de bolso: **checklist criado é dívida até ser sanado.** O overdev garante que a
> sessão não para com item aberto; a auditoria garante que **nenhum item aberto ficou órfão
> no histórico** — e que "feito" quer dizer feito, com prova.
