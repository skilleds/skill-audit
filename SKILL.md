---
name: schematize-audit
metadata:
  version: 0.6.0
description: >-
  Prova que checklist, plano, handoff e ADR `proposed` foram sanados, não só marcados: conta promessas no archive e no git (`audit-gate.mjs`). Use ao auditar ou fechar loop.
---

# Auditoria de histórico da casa (schematize-audit)

Disciplina normativa, **agnóstica de linguagem**, que responde a uma pergunta só: **todo
checklist criado neste projeto foi mesmo sanado?** A casa gera *muitos* checklists — overdev,
Q.A., handoffs de contexto, planos, ADRs, TASKs, perguntas parkeadas. Cada um é uma **promessa**.
Esta skill fecha o loop `scan → plan → refactor → overdev` provando que o prometido foi
**entregue e verificado**, não apenas marcado com um `[x]` na fé.

É a contraparte de **histórico** do overdev: o overdev garante que a **sessão viva** não para
com item aberto; a auditoria garante que **nenhum item aberto ficou órfão no rastro** — e que
"feito" quer dizer feito, **com prova**.

**Versão:** skill `schematize-audit` v0.6.0. Changelog em `CHANGELOG.md`.


## Artefatos executáveis

A skill que dá o **veredito formal** prometia saída machine-readable e gate que trava, e entregava
um **exemplo em prosa**: sem schema, sem validador, sem exit code (vistoria de 2026-08-21).

| Artefato | O que é |
|---|---|
| `assets/schemas/audit-run.schema.json` | o formato do JSON da auditoria — cobertura, totais, as 5 espécies de órfão RED, veredito |
| `scripts/audit-gate.mjs` | valida e decide: `0` histórico são · `1` **reprova** · `2` documento inválido. **Não acredita no campo `healthy`** — recalcula da lista |
| `scripts/audit-gate.test.sh` | casos vermelhos plantados — o principal é o *veredito que mente* |
| `assets/templates/audit.exemplo.json` | um relatório **realista**, que reprova: exemplo verde ensinaria o formato e esconderia o uso |

## Comandos (Claude Code)

Digite `/audit-help` pra ver todos. Em resumo:

| Comando | O que faz |
|---|---|
| `/audit-help` | lista todos os comandos do schematize-audit |
| `/audit-plan` | plan-first: enumera as fontes, define escopo/cobertura-alvo, gera o plano de auditoria em MD e pede aprovação ANTES de varrer |
| `/audit-run` | a auditoria em si: enumera e CONTA as fontes, classifica cada item, cruza com a realidade, spot-check de prova, acha os órfãos RED, gera o checklist de saneamento e trava em órfão RED |
| `/audit-report` | consolida cobertura + órfãos + saneamento + veredito num relatório e grava em `<projeto>_archive/audit/<data>.md` |
| `/audit-load` | carrega à força TODO o corpo normativo (auditoria, metodologia, evidências, relatório) e passa a aplicá-lo |
| `/audit-claude` | cria ou mescla o `CLAUDE.md` sempre-on de auditoria na raiz do repo |
| `/audit-cc` | context compact: gera handoff no archive e roda `/compact` |
| `/audit-handoff` | gera o handoff (context.md + checklist.md) sem compactar |

Os comandos ficam em `assets/commands/` e são instalados em `.claude/commands/`.

## Como usar esta skill

1. **Plan-first sempre** (`/audit-plan`): antes de varrer, enumere as fontes e fixe a
   **cobertura-alvo** — quantos artefatos existem no archive + histórico git. Auditar sem
   contar é auditar incompleto. Leia `references/metodologia.md`.
2. **Rode a auditoria** (`/audit-run`, `references/auditoria.md`): classifique **cada item**
   de **cada** artefato, cruze com o código/testes/archive, e faça o **spot-check de prova**
   (`references/evidencias.md`) — o que é "feito" precisa se provar hoje.
3. **Consolide** (`/audit-report`, `references/relatorio.md`): cobertura A/A, órfãos por tipo
   com origem, checklist de saneamento e **veredito de gate**. Grava no archive.
4. **Não trabalhe de memória** — as fontes, os cruzamentos e o que conta como prova estão nos
   references. Aplique os pisos abaixo independentemente do reference carregado.

Mapa de references — leia o que casa com a tarefa:

| Tarefa | Reference |
|---|---|
| A disciplina: as fontes de checklist, classificação por item, cruzamentos que pegam o buraco, "fechou de verdade", saída/gate, quando rodar | `references/auditoria.md` |
| Como conduzir: enumerar exaustivo por contagem, plan-first, saída machine-readable (JSON), gate que trava em órfão RED, integração com CI/agendado | `references/metodologia.md` |
| O que conta como **prova** de que um item foi sanado (teste/commit/arquivo/gate que passa hoje), spot-check, registro da evidência mínima | `references/evidencias.md` |
| Anatomia do **relatório** de auditoria (cobertura A/A, órfãos por tipo com origem, checklist de saneamento, veredito) e onde gravar | `references/relatorio.md` |

## Pisos inegociáveis (vetam o atalho)

Independente do reference, estes limites nunca são cruzados:

1. **Enumeração exaustiva por CONTAGEM.** Toda fonte de checklist do archive **e** do histórico
   git entra na auditoria. A cobertura é `A` auditados / `A` existentes e **tem que bater**.
   Artefato de fora = auditoria incompleta, não "auditoria boa o suficiente".
2. **"Feito" exige prova — checkbox sem evidência é suspeito, não fato.** Um `- [x]` cujo
   teste/commit/arquivo não existe, ou cujo gate não passa hoje, **volta a aberto** no relatório.
   É a mesma guarda do red-first e do "suspeito ≠ achado" da `schematize-pentest`.
3. **Nenhum checklist criado fica órfão.** Item `- [ ]` que nunca fechou, `- [~]` on-hold cuja
   pergunta ninguém respondeu, pergunta parkeada pendente em `PERGUNTAS-OVERDEV.txt`, ADR
   `proposed` que nunca virou `accepted`/`rejected` → cada um é **órfão RED** e precisa de desfecho.
4. **O gate TRAVA em órfão RED.** Histórico são = **zero órfãos RED**. Qualquer aberto/hold/
   parkeado sem desfecho **não fecha** — é dívida rastreável, nunca "já era".
5. **Órfão vira saneamento.** Os órfãos RED viram um **novo checklist** (candidato a
   `/eng-overdev`): reabrir + resolver + verificar + reteste. Auditoria que aponta e não gera o
   conserto é meia-auditoria.
6. **A auditoria NÃO fecha item; ela verifica.** Marcar `[x]` durante a auditoria é proibido —
   quem fecha item é o run de saneamento, com prova. A auditoria é read-mostly sobre o histórico.
7. **Saída durável no archive.** Todo relatório mora em `<projeto>_archive/audit/<data>.md`
   (§28), nunca no root. Sem archive, a auditoria não aconteceu.

## Precedência e herança (leia antes de divergir)

<!-- herdado:engineering/precedencia:dominio intro="Esta skill é o recorte **Auditoria de histórico (prova de que o prometido foi sanado)** da `schematize-engineering`: **disciplina de domínio**, não linguagem de backend." cmd="audit" -->Esta skill é o recorte **Auditoria de histórico (prova de que o prometido foi sanado)** da `schematize-engineering`: **disciplina de domínio**, não linguagem de backend.

1. **Onde esta skill divergir da base, a BASE MANDA.** Aqui mora a especialização do domínio ou da
   ferramenta — o como, o padrão, o gate. Divergência de *piso* é defeito desta skill, não variante local.
2. **O que não está repetido aqui é HERDADO, não dispensado.** Esta skill herda os pisos da base e
   os comandos dela cobrem o **domínio**, não o piso geral. Valem integralmente, sem cópia local:
   - **§28 Archive** — `<projeto>/<projeto>_archive/` é **repositório git próprio, PRIVADO e
     obrigatório**, criticidade 0 (`schematize-archive`).
   - **§35 Definition of Done** e a lista de anti-padrões (citada por **título**, nunca por número).
   - **§39 Índice/MAPA** — enumeração exaustiva (uma entrada por unidade chamável, `M == N`) e grafo
     com arestas em ASCII (`A -> B`), nunca a seta unicode.
   - **IAM** (`schematize-engineering` → `references/iam.md`): identidade ≠ email, ≥2 fatores, ReBAC
     multi-tenant, argon2id-only para senha nova, sessão longa e logout irreversível.
   - **Efeito externo** nunca sai de não-produção (`schematize-engineering` →
     `references/efeitos-externos.md`).
   - **Orquestração** (`schematize-engineering` → `references/orquestracao.md` §9): o principal não
     desenvolve (é Claude Opus); executor mais barato que resolve — `haiku`/`sonnet` → Codex Terra → Cursor → `opus` só após falha; visual direto ao Codex; imagem nunca pelo Claude: detecta Codex/Gemini e pergunta ao usuário qual usar (Codex é a sugestão, não automática), nunca API paga.
3. **QA, ops, IAM e índice não têm comando próprio aqui:** vêm da base `/eng-*`. Para trabalho
   contínuo use `/eng-overdev`; para planejar `/eng-plan`; para varrer a base `/eng-scan`; para
   revisão geral `/eng-review` (e `/eng-ops`, `/eng-iam`, `/eng-index`). Os comandos
   `/audit-*` cobrem o domínio desta skill; o piso geral é o da base.<!-- /herdado -->

## Orquestração

<!-- herdado:engineering/orquestracao:curto -->**Orquestrador não desenvolve; subagent barato executa.** O agent principal só planeja, despacha e revisa; ação onerosa vira micro-tasks para o executor mais barato que resolve: `haiku` (mecânico) / `sonnet` (código; falhou → mesmo subagent corrige, até 2 rodadas) → Codex `gpt-5.6-terra` → Cursor → subagent `opus` (motivo) → `park`; **visual vai direto ao Codex**; **imagem nunca pelo Claude: detectar Codex/Gemini e perguntar ao usuário qual usar (Codex é a sugestão), nunca API de imagem paga**; papéis em `agentes.toml`. No overdev, cada item do checklist vai a um subagent e o principal revisa antes do `- [x]`. **Sem frota ociosa:** idle com pendência volta ao trabalho; dependente de outro agent → mata e enfileira com gatilho; terminou → mata (§9.6). Detalhe: `schematize-engineering` → `references/orquestracao.md` §9.<!-- /herdado -->

## Relação com as outras skills

- **schematize-engineering** — a **BASE**. A auditoria consome o que a engenharia produz: o
  **overdev** (`CHECKLIST.md`, `OBJETIVO.md`, `premature-stops.log`, `PERGUNTAS-OVERDEV.txt`,
  `DECISOES.md`/`PLAN.md`), a **DoD (§35)**, o **archive (§28)** e o **índice/MAPA (§39)**. Os
  órfãos RED viram um checklist de `/eng-overdev`; o loop que a auditoria fecha é o
  `scan (/eng-scan) → plan (/eng-plan) → refactor (/eng-refactor) → overdev (/eng-overdev)`.
  Esta skill extrai a disciplina de **auditoria de histórico** que nasceu ali, pra rodar solta.
- **schematize-pentest** — o **oráculo** do "feito de verdade". A auditoria empresta da pentest
  a disciplina de que **suspeita ≠ achado**: um `[x]` sem evidência é suspeito; só a prova
  (teste/commit/arquivo/gate que passa) o promove a fato. Mesma postura do red-first.
- **schematize-web / go / rust / elixir / c# / zig / ruby / node** — a auditoria é
  agnóstica: ela audita os checklists **de qualquer stack**; a prova de cada item roda no gate
  daquela linguagem (`/<slug>-review`, testes, lint).

<!-- herdado:engineering/pisos-22-29:bloco -->**Herda os pisos 22–29 da `schematize-engineering`** (texto completo em `assets/CLAUDE.md` dela): 22 tudo no git — sem remote, push falho ou HEAD≠origin a demanda NÃO se conclui; 23 deploy só do git (VETADO scp/rsync/tar|ssh/docker save|load/git bundle); 24 o ops é o gate da IA — a IA nunca muda a VPS direto nem escreve SQL, só operação nomeada (`ssh vps "ops <op>"`); 25 sem agents inúteis (entregou, morreu); 26 relatório a cada 30 min e handoff a cada 6 h; 27 CI remoto só antes do hml, a pedido ou em tag (`workflow_dispatch` + `hml-*`/`v*`; VETADO `pull_request`, `push` em branch, `workflow_run`, cron sem justificativa); 28 microserviço autônomo (fila durável + 7 testes de resiliência); 29 build/teste na máquina dev/hml quando existe (ponte só no workspace de build, nunca prd) + higiene (`scripts/higiene.sh`).<!-- /herdado -->
