---
description: Context Compact — gera handoff (context.md + checklist.md) no <projeto>_archive e compacta
---

Antes de compactar, **arquive o handoff** (não perca o estado da auditoria):

1. `<projeto>_archive/context/<YYYY-MM-DD-HH-MM-SS>-context.md` — estado: recorte auditado,
   inventário de fontes `F1..Fn` e quantas já foram classificadas, órfãos RED encontrados até
   agora (por tipo, com origem), spot-checks pendentes, onde parou.
2. `<projeto>_archive/context/<YYYY-MM-DD-HH-MM-SS>-checklist.md` — **FEITO vs EM ABERTO**
   (artefatos auditados vs faltantes — cobertura `A/A`; itens ainda por provar).
3. Só então rode `/compact` (foco na tarefa corrente).
