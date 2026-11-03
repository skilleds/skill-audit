---
description: schematize-audit — cria ou mescla o CLAUDE.md sempre-on de auditoria na raiz do repo (não sobrescreve blocos de outras skills)
---

Instale/atualize a regra **sempre-on** de auditoria de histórico na raiz do repositório.

1. Pegue `assets/CLAUDE.md` da skill `schematize-audit` (projeto ou `~/.claude/skills/...`).
2. Se **não existe** `CLAUDE.md` na raiz: crie com esse conteúdo.
3. Se **já existe** (de outra skill — engineering/go/rust/web/pentest/...): **mescle** — adicione
   a seção de Auditoria de Histórico **sem sobrescrever** os blocos das outras skills. Em repo
   multi-skill, cada CLAUDE convive; o piso da auditoria é aditivo.
4. Se houver customização local, salve `./CLAUDE.md.bak` e reaplique por cima.
5. Confirme a versão aplicada e destaque o **piso**: nenhum checklist criado fica órfão; "feito"
   exige prova; o gate trava em órfão RED.
