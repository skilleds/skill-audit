# CLAUDE.md — Auditoria de Histórico da Casa (sempre on)

> Copie para a **raiz do repositório** e ajuste `<project>`. Fica pinado no contexto de toda
> tarefa e garante o piso mesmo quando a skill `schematize-audit` não dispara sozinha. Em repo
> multi-skill, use **junto** com os `CLAUDE.md` das skills de engenharia (rode `/audit-claude`
> que mescla, sem sobrescrever os outros blocos).

## Regra mestre

Todo checklist criado neste repo é uma **promessa** — e promessa é **dívida até ser sanada**.
A skill `schematize-audit` rege como se prova que o prometido foi entregue e verificado. Em
conflito entre "já era, deixa pra lá" e este piso, **o piso vence**. Consulte o reference antes
de agir — não trabalhe de memória.

## Pisos inegociáveis (VETADO — sem exceção)

1. **Nenhum checklist criado fica órfão.** Todo item aberto (`- [ ]`), on-hold (`- [~]`),
   pergunta parkeada (`PERGUNTAS-OVERDEV.txt`) ou ADR `proposed` precisa de **desfecho
   comprovado**. Fim de marco, retomada de projeto parado e release não passam com órfão pendente.
2. **"Feito" exige PROVA — checkbox sem evidência é suspeito, não fato.** Um `- [x]` cujo
   teste/commit/arquivo não existe, ou cujo gate não passa **hoje**, **volta a aberto**. É a
   mesma guarda do red-first e do "suspeito ≠ achado" da `schematize-pentest`. A auditoria julga
   o estado de **hoje**, não a intenção da época — regressão silenciosa reabre o item.
3. **Enumeração exaustiva por CONTAGEM.** Toda fonte de checklist do archive **e** do histórico
   git entra na auditoria; a cobertura é `A` auditados / `A` existentes e **tem que bater**.
   Artefato de fora = auditoria incompleta.
4. **O gate TRAVA em órfão RED.** Histórico são = **zero órfãos RED** (aberto nunca fechado,
   on-hold sem resposta, pergunta parkeada pendente, ADR proposed órfão, "feito" sem prova).
   Qualquer um deles = **não fecha**. Sem waiver silencioso: órfão só sai quando **sanado** ou
   **reclassificado com desfecho datado**.
5. **Órfão vira saneamento.** Os órfãos RED viram um **novo checklist** (candidato a
   `/eng-overdev`): reabrir + resolver + verificar + reteste. Apontar sem gerar o conserto é meia-auditoria.
6. **A auditoria NÃO fecha item — ela verifica.** Marcar `[x]` durante a auditoria é proibido;
   quem fecha é o run de saneamento, com prova. A auditoria é read-mostly sobre o histórico.
7. **Saída durável no archive.** Todo relatório (MD + JSON) mora em
   `<project>_archive/audit/<data>` (§28), nunca no root. Sem archive, a auditoria não aconteceu.

## Como se audita aqui

- **Plan-first (`/audit-plan`):** enumera e **conta** as fontes (overdev CHECKLIST/OBJETIVO/
  premature-stops/PERGUNTAS/DECISOES/PLAN, Q.A., handoffs FEITO-vs-ABERTO, planos, ADRs, scans,
  qualquer MD com `- [ ]`/`- [~]`/"EM ABERTO"), fixa a cobertura-alvo e o recorte, pede aprovação.
- **Auditoria (`/audit-run`):** classifica cada item, cruza com o código/testes/archive
  (overdev "concluído" com item aberto que sumiu? premature-stop nunca feito? pergunta parkeada
  sem resposta? ADR proposed órfão? achado de scan sem desfecho?), faz **spot-check de prova** por
  risco, acha os **órfãos RED**, gera o checklist de saneamento e o **JSON** machine-readable.
- **Relatório (`/audit-report`):** cobertura A/A + inventário `F1..Fn` + órfãos por tipo com
  origem + saneamento + veredito, gravado no archive.
- **Ciclo:** `auditar → sanear (/eng-overdev) → reauditar`. O órfão só morre quando a
  reauditoria não o vê mais.

## Relação com as outras skills

- **schematize-engineering** — a base: a auditoria consome o **overdev**, a **DoD (§35)**, o
  **archive (§28)** e o **índice/MAPA (§39)**; fecha o loop `scan → plan → refactor → overdev`.
- **schematize-pentest** — o oráculo do "feito de verdade": suspeita ≠ achado; só a prova promove.

## Gestão de contexto (sessões longas)

Ao se aproximar do teto de contexto: **PARE e** gere o handoff em
`<project>_archive/context/` (estado + FEITO vs EM ABERTO, cobertura `A/A`) **antes** de
compactar (`/audit-cc`).

## Orquestração

<!-- herdado:engineering/orquestracao:curto -->**Orquestrador não desenvolve; subagent barato executa.** O agent principal só planeja, despacha e revisa; ação onerosa vira micro-tasks para o executor mais barato que resolve: `haiku` (mecânico) / `sonnet` (código; falhou → mesmo subagent corrige, até 2 rodadas) → Codex `gpt-5.6-terra` → Cursor → subagent `opus` (motivo) → `park`; **visual vai direto ao Codex**; **imagem nunca pelo Claude: detectar Codex/Gemini e perguntar ao usuário qual usar (Codex é a sugestão), nunca API de imagem paga**; papéis em `agentes.toml`. No overdev, cada item do checklist vai a um subagent e o principal revisa antes do `- [x]`. **Sem frota ociosa:** idle com pendência volta ao trabalho; dependente de outro agent → mata e enfileira com gatilho; terminou → mata (§9.6). Detalhe: `schematize-engineering` → `references/orquestracao.md` §9.<!-- /herdado -->

<!-- herdado:engineering/pisos-22-29:bloco -->**Herda os pisos 22–29 da `schematize-engineering`** (texto completo em `assets/CLAUDE.md` dela): 22 tudo no git — sem remote, push falho ou HEAD≠origin a demanda NÃO se conclui; 23 deploy só do git (VETADO scp/rsync/tar|ssh/docker save|load/git bundle); 24 o ops é o gate da IA — a IA nunca muda a VPS direto nem escreve SQL, só operação nomeada (`ssh vps "ops <op>"`); 25 sem agents inúteis (entregou, morreu); 26 relatório a cada 30 min e handoff a cada 6 h; 27 CI remoto só antes do hml, a pedido ou em tag (`workflow_dispatch` + `hml-*`/`v*`; VETADO `pull_request`, `push` em branch, `workflow_run`, cron sem justificativa); 28 microserviço autônomo (fila durável + 7 testes de resiliência); 29 build/teste na máquina dev/hml quando existe (ponte só no workspace de build, nunca prd) + higiene (`scripts/higiene.sh`).<!-- /herdado -->
