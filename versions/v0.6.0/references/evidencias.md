# Evidências — o que conta como "prova" de que um item foi sanado

O coração da auditoria é a guarda no vermelho: **um `- [x]` sem evidência é suspeito, não
fato** (a mesma disciplina do red-first e do "suspeito ≠ achado" da `schematize-pentest`). Este
reference define **o que conta como prova**, como fazer o **spot-check** e como **registrar** a
evidência mínima no archive. Sem isso, "auditoria" vira leitura de checkbox — exatamente o que
ela existe pra desmascarar.

## 1. O oráculo — suspeita ≠ achado

Emprestado da pentest: você não tem um **achado** (aqui: "item de fato sanado") até ter um
**oráculo** que o prove. Marcar `[x]` é a *suspeita* de que foi feito; a *prova* é um artefato
verificável que existe **hoje** e responde "sim, está feito e continua feito".

> A auditoria julga o **estado de hoje**, não a intenção da época. "Estava feito quando marquei"
> não é prova se o código sumiu, o teste foi deletado ou o gate regrediu. Regressão silenciosa
> reabre o item igual a item nunca feito.

## 2. O que conta como prova (por tipo de item)

Ordene do mais forte ao mais fraco; use o mais forte que o item admite.

| Tipo de item | Prova forte (aceita) | Prova fraca / não-prova (rejeita) |
|---|---|---|
| Código/funcionalidade | commit que introduz o símbolo **+** o símbolo existe no worktree **+** teste que o exercita passa hoje | "tem um commit falando disso"; símbolo sumiu num refactor posterior |
| Correção de bug | teste de regressão que **falha sem** o fix e **passa com** ele | fix no código sem teste que trave a volta do bug |
| Teste/cobertura | a suíte roda verde agora; o teste nomeado existe e não está `.skip`/comentado | cobertura "atingida" sem o arquivo de teste; assert comentado |
| Segurança/IAM | teste de rejeição/authz que passa (`/pentest-*`, `/<slug>-review`); gate verde | "revisei e tá seguro" sem teste que prove a rejeição |
| Migração/schema | migration com `down` testada (aplica e reverte); reversibilidade provada | migration só com `up`; "rodei em dev uma vez" |
| Decisão (ADR) | ADR `accepted` **ou** `rejected` com motivo datado | ADR `proposed` parado; decisão "combinada" sem registro |
| Observabilidade/ops | dashboard/alerta versionado como código; endpoint de saúde responde | "tem métrica em algum lugar" |
| Documento/entrega | o arquivo prometido existe no caminho prometido, com o conteúdo prometido | "foi entregue" sem o arquivo no lugar |

Regra geral: **prova é um artefato que você pode apontar (`arquivo:linha`, commit SHA, nome do
teste, run do gate) e reexecutar/reinspecionar agora.** Se a prova é "eu lembro" ou "o checkbox
diz", é suspeita — o item **volta a aberto**.

## 3. Spot-check — como amostrar sem refazer o projeto

Provar cada `[x]` exaustivamente seria refazer o trabalho. Amostre por **risco**:

- **Sempre verifica (100%):** caminho crítico, segurança/IAM, dados/migração, dinheiro,
  qualquer item que a DoD (§35) ou os pisos (§37) da engenharia marcam como inegociável.
- **Amostra dirigida:** itens de risco médio — pegue uma amostra representativa por artefato;
  se a amostra mente (achou feito-sem-prova), **aprofunde** aquele artefato inteiro (um checkbox
  mentiroso é sinal de que os vizinhos também podem estar).
- **Amostra leve:** itens triviais/cosméticos — checagem barata (o arquivo existe? o texto está lá?).

Técnicas de spot-check (agnósticas):

- `git log --oneline -S'<símbolo>' -- <caminho>` — o código que prova o item entrou mesmo?
- `grep -rn '<símbolo/rota/flag>' <src>` — ainda existe hoje?
- rodar o **teste nomeado** do item (ou a suíte do módulo) — verde agora?
- rodar o **gate** da stack (`/<slug>-review`, lint, typecheck) no diff/arquivo tocado;
- para ADR: `grep -rn 'status:' <adr>` — `accepted`/`rejected`, não `proposed`.

## 4. Reabertura — o mecanismo do "volta a aberto"

Quando o spot-check falha, o item **não** é "quase feito": é **órfão RED do tipo
`done_unproven`** e volta a `- [ ]` no relatório. Registre:

- o item e sua origem (`Fi:linha`);
- **por que** não se prova (símbolo sumiu / teste inexistente / gate falha hoje / migration sem down);
- o que falta pra provar de verdade (vira linha do checklist de saneamento).

Reabrir é da auditoria; **fechar** é do run de saneamento com prova. A auditoria nunca marca `[x]`.

## 5. Registro da evidência mínima no archive

Toda verificação vira rastro — pra a próxima auditoria não refazer o trabalho e pra o veredito
ser auditável. No relatório (`relatorio.md`) e no JSON (`metodologia.md`), cada item verificado
carrega a **evidência mínima**:

- **Item provado (`done`):** `origem` + `prova` (commit SHA / nome do teste / `arquivo:linha` /
  run do gate) — uma linha, sem despejar log inteiro.
- **Item reaberto (`done_unproven`):** `origem` + `missing` (por que não se prova).
- **Órfão aberto/hold/parkeado:** `origem` + `missing` + `since` (desde quando está aberto, do
  git/data do artefato).

> Evidência mínima = o suficiente pra alguém reexecutar a checagem, não uma cópia do output. Um
> SHA e um nome de teste bastam; 200 linhas de log poluem o archive. Sanitize: nunca cole
> segredo/credencial/dado real de cliente na evidência (mesma higiene da pentest) — se achar
> segredo real no rastro, sinalize **rotação**.
