---
description: Gera o handoff de contexto (context.md + checklist.md) no archive, SEM compactar
---

Gere o handoff da auditoria **sem** compactar — pra fim de sessão ou troca de tarefa:

1. `<projeto>_archive/context/<YYYY-MM-DD-HH-MM-SS>-context.md` — recorte auditado, inventário
   de fontes `F1..Fn`, classificação por artefato, órfãos RED (por tipo, com origem + o que
   falta), spot-checks feitos/pendentes, decisões, onde parou.
2. `<projeto>_archive/context/<YYYY-MM-DD-HH-MM-SS>-checklist.md` — **FEITO vs EM ABERTO**
   (cobertura `A/A`, itens por provar, veredito parcial).

Não rode `/compact` — só arquiva.
