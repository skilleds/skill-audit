---
description: schematize-audit — carrega à força TODO o corpo normativo (auditoria, metodologia, evidências, relatório) e passa a aplicá-lo
---

Carregue **à força** e passe a aplicar **integralmente** os Padrões de Auditoria de Histórico da
Casa (skill `schematize-audit`) neste projeto. A partir de agora, nesta sessão, isto **não é
opcional**.

1. **Leia agora, na íntegra, TODOS os references** — não trabalhe de memória. Caminho:
   `.claude/skills/schematize-audit/references/*.md` (projeto) ou
   `~/.claude/skills/schematize-audit/references/*.md` (global):
   - `auditoria.md` — a **disciplina**: as fontes de checklist (enumerar e CONTAR), classificação
     por item (feito/aberto/on-hold), os cruzamentos que pegam o buraco, "fechou de verdade"
     (prova, não fé), a definição operacional de **órfão RED**, saída/gate, quando rodar.
   - `metodologia.md` — o **como**: plan-first, enumeração exaustiva por contagem, cruzamento
     com grep dirigido, **saída machine-readable (JSON)**, o **gate que trava em órfão RED**,
     integração com CI/agendado, o ciclo `auditar → sanear → reauditar`.
   - `evidencias.md` — o que conta como **prova** de que um item foi sanado (teste/commit/
     arquivo/gate que passa hoje), o **spot-check** por risco, o mecanismo do "volta a aberto",
     e o registro da evidência mínima no archive.
   - `relatorio.md` — a **anatomia do relatório** (sumário/veredito, cobertura A/A com inventário
     `F1..Fn`, órfãos por tipo com origem, checklist de saneamento, evidências) e onde gravar.

2. **Confirme ao usuário** que leu (1 linha por arquivo).

3. Deste ponto, aplique como regra inegociável: **enumeração exaustiva por contagem**
   (cobertura A/A tem que bater), **"feito" exige prova** (checkbox sem evidência volta a
   aberto), **nenhum checklist criado fica órfão**, o **gate trava em órfão RED**, os órfãos
   viram um checklist de saneamento (candidato a `/eng-overdev`), a auditoria **não fecha** item
   (só verifica), e todo relatório mora em `<projeto>_archive/audit/`.

4. **Atualize o `CLAUDE.md` da raiz** com `assets/CLAUDE.md` da skill (mescla se já houver de
   outra skill) — é o `/audit-claude`.
