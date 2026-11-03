# Metodologia — como conduzir a auditoria (exaustivo, plan-first, machine-readable, gate)

A auditoria não é "olhar os checklists e sentir". É um procedimento **exaustivo por contagem**,
**plan-first**, com **saída machine-readable** e um **gate** que trava em órfão RED. Este
reference é o *como*; a disciplina (o *o quê*) está em `auditoria.md`.

## 1. Plan-first — enumerar e fixar a cobertura ANTES de julgar

Auditar sem contar é auditar incompleto. O `/audit-plan` roda primeiro:

1. **Descoberta das fontes.** Varra `<projeto>_archive/` **e** o worktree **e** o histórico git.
   Comandos de partida (ajuste ao repo):
   - `find <projeto>_archive -name '*.md'` — todos os MDs do archive.
   - `grep -rn --exclude-dir=.git -- '- \[ \]\|- \[~\]\|- \[x\]' <projeto>_archive` — linhas de checklist.
   - `grep -rni 'EM ABERTO\|TODO\|PENDENTE\|FIXME\|on-hold' <projeto>_archive` — seções soltas.
   - `git log --diff-filter=D --name-only --pretty=format: | sort -u` — MDs de checklist que
     **sumiram** do rastro (podem esconder itens abandonados).
   - `ls .schematize/overdev/ .overdev/ ./PERGUNTAS-OVERDEV.txt <projeto>_archive/overdev/premature-stops.log 2>/dev/null` —
     os artefatos do overdev (procure em `.schematize/overdev/` no layout novo **E** em
     `.overdev/` no legado; `PERGUNTAS-OVERDEV.txt` fica na raiz do projeto em ambos).
2. **Inventário numerado.** Liste **cada** artefato encontrado com um índice (`F1..Fn`). Esse
   `n` é a **cobertura-alvo**: a auditoria só fecha quando os `n` foram lidos e classificados.
3. **Escopo e recorte.** Projeto grande? recorte por marco/módulo/janela de data — mas **declare
   o recorte** (auditar `<projeto>_archive/overdev/**` de 2026-Q2 é honesto; dizer "auditei tudo"
   tendo lido metade não é).
4. **Plano em MD + aprovação.** Grave `<projeto>_archive/audit/<data>-plano.md` com o inventário
   `F1..Fn`, o recorte e a cobertura-alvo. Peça aprovação antes de varrer item a item se a
   auditoria for cara (muitos artefatos, spot-check pesado).

## 2. Enumeração exaustiva por contagem (a garantia anti-preguiça)

A cobertura é `A_auditados / A_existentes` e **tem que bater**. Para cada `Fi` do inventário:

- conte os itens por estado dentro dele (`abertos / feitos / on-hold`);
- classifique **cada** item (§2 do `auditoria.md`) — nada de "li por cima";
- registre a origem por linha (`Fi:linha`), pra rastrear o órfão até a fonte.

O total do sistema é a soma: `Σ abertos`, `Σ feitos`, `Σ on-hold`. Um artefato lido sem
contagem por estado é artefato **não** auditado — a cobertura não o conta.

## 3. Cruzamento com a realidade (grep dirigido)

Classificar não basta: cada estado tem um cruzamento (§2/§3 do `auditoria.md`). Operacionalize:

- **`- [x]` de caminho crítico → spot-check de prova** (`evidencias.md`): existe o
  teste/commit/arquivo? o gate passa **hoje**? (`git log --oneline -S'<símbolo>'`, roda o teste
  nomeado, `/<slug>-review` no diff).
- **`premature-stops.log` → grep por item:** cada item que faltava aparece feito no
  código/testes/archive? `grep -rn '<termo do item>'`.
- **`PERGUNTAS-OVERDEV.txt` → resposta em algum lugar?** a pergunta foi respondida (commit,
  ADR, decisão, mensagem)? senão, on-hold correspondente é órfão.
- **ADR `proposed` → estado final?** `grep -rn 'status:.*proposed'` cruzado com o histórico.

## 4. Saída machine-readable (JSON) — o control-plane da auditoria

> **Isto tem schema, validador e exit code.** `assets/schemas/audit-run.schema.json` é o formato;
> `scripts/audit-gate.mjs` valida e dá o veredito (`0` são · `1` **reprova** · `2` documento
> inválido); `scripts/audit-gate.test.sh` é onde cada regra foi **vista reprovando**.
> Até 2026-08-21 isto era um exemplo em prosa — na skill que daria o veredito formal do catálogo.


Além do relatório humano (`relatorio.md`), a auditoria emite um **JSON** determinístico, pra CI
e pro painel poderem ler o veredito sem parsear prosa. Formato obrigatório
(`<projeto>_archive/audit/<data>.json`; schema em `assets/schemas/audit-run.schema.json`):

```json
{
  "schema": "schematize-audit/run@1",
  "audit_date": "2026-08-15",
  "scope": "<projeto>_archive/** + worktree + git-history",
  "coverage": { "artifacts_found": 12, "artifacts_audited": 12, "complete": true, "not_audited": [] },
  "totals": { "done": 84, "open": 5, "on_hold": 3, "done_unproven": 1 },
  "orphans_red": [
    {
      "kind": "open_never_closed",
      "source": "<projeto>_archive/overdev/OBJETIVO.md:41",
      "item": "migração reversível do schema de billing",
      "missing": "sem migration down; teste de rollback ausente",
      "since": "2026-06-02",
      "resolution": { "outcome": "sanado", "date": "2026-08-15", "why": "migration down criada e teste de rollback verde no CI (commit a1b2c3d)." }
    },
    {
      "kind": "done_unproven",
      "source": "<projeto>_archive/plan/2026-05-10.md:22",
      "item": "rate-limit no endpoint /login",
      "missing": "marcado [x] mas não há teste nem middleware no código atual → reaberto",
      "since": "2026-05-10",
      "resolution": { "outcome": "sanado", "date": "2026-08-15", "why": "middleware de rate-limit implementado e teste que prova 429 no estouro passa." }
    }
  ],
  "verdict": { "healthy": true, "blocking_orphans": 0 }
}
```

Este exemplo é o estado **depois do saneamento** (ambos os órfãos têm `resolution`): o gate dá
`exit 0`. Tire o `resolution` de um deles e `blocking_orphans` passa a 1, `healthy` a `false` e o
gate dá `exit 1`. O `schema` é **obrigatório** (sem ele, `exit 2`).

- `kind ∈ { open_never_closed, on_hold_unanswered, parked_question_pending, adr_proposed_orphan, done_unproven, ritmo_vencido, local_divergente }` — as sete espécies de órfão RED (§4 do `auditoria.md`).
- `verdict.healthy = (blocking_orphans == 0)`. É o campo que o gate lê — e ele **não acredita no
  campo**: recalcula a partir da lista. Relatório que se declara saudável com órfão vivo é **pior que
  nenhum relatório**, porque autoriza o release; o gate chama isso pelo nome (*o veredito mente*) e
  reprova.
- **`coverage.complete = false` reprova**, e reprova de novo se `not_audited` estiver vazio:
  auditoria que não sabe o que não viu. "Não achei" nunca é "não há".
- **`totals.done_unproven` tem de bater com os órfãos `done_unproven` listados**: feito sem prova
  volta a ABERTO **com nome**, não como número no resumo.
- Um órfão só sai da contagem bloqueante com `resolution` — **desfecho explícito, datado e com
  motivo escrito**. Motivo de uma palavra reprova; data no futuro reprova.

## 5. Gate — trava em órfão RED

O veredito é binário: **histórico são só com zero órfãos RED**.

- **Exit code / veredito:** `verdict.healthy == false` → a auditoria **reprova**. Em CI, sai
  não-zero; num run macro, bloqueia o "pronto". Concretamente:

  ```bash
  node .claude/skills/schematize-audit/scripts/audit-gate.mjs <projeto>_archive/audit/<data>.json --archive <projeto>_archive
  # o gate RECONTA o archive (itens, ADR proposed) e verifica a evidência do `sanado` (sha:/arquivo:); cobertura autodeclarada reprova
  # 0 = histórico são · 1 = REPROVA · 2 = documento inválido
  ```
- **Sem waiver silencioso:** um órfão só sai da lista quando **sanado** (fechado com prova) ou
  **reclassificado com desfecho explícito e datado** (ex.: ADR `proposed` → `rejected` com
  motivo). "Ignorar por ora" não zera o órfão — no máximo vira um item datado do saneamento.
- **A auditoria não fecha o item.** Marcar `[x]` durante a auditoria é proibido: quem fecha é o
  run de saneamento (`/eng-overdev`), com prova. A auditoria só **abre** (reabre o feito-sem-prova)
  e **aponta**.

## 6. Integração com CI e agendamento

O overdev cobre a **sessão viva** (Stop hook); a auditoria cobre o **rastro**. Para que o rastro
não acumule dívida invisível:

- **Periódico/agendado:** rode `/audit-run` por cron/rotina (semanal em projeto ativo, ou a cada
  marco). O JSON versionado no archive dá a série histórica (os órfãos estão diminuindo?).
- **CI de marco:** num pipeline de release, a auditoria é um **gate** — release não sai com
  `verdict.healthy == false`. O JSON é o artefato que o job lê.
- **Depois de scan/plan grande:** encadeie `/eng-scan` → `/audit-run` pra provar que os achados
  viraram itens fechados, não ruído.
- **Órfão → saneamento → reauditoria:** o checklist de saneamento (`relatorio.md`) vira um
  `/eng-overdev`; ao fim dele, **reaudite** — o órfão só morre quando a reauditoria não o vê mais.

> O ciclo saudável é `auditar → sanear (overdev) → reauditar`. A auditoria que só aponta e não
> gera saneamento, ou o saneamento que não é reauditado, deixam o buraco aberto.
