#!/usr/bin/env bash
# Vermelho primeiro do gate da auditoria. O caso que mais importa e o `veredito-que-mente`:
# relatorio que se declara saudavel com orfao na lista e PIOR que nenhum relatorio, porque ele
# autoriza o release.
# EXCEÇÃO DECLARADA de strict mode (`schematize-shell` -> `references/piso.md` secao 1):
# harness de teste roda sem `-e` de propósito — ele precisa continuar depois de um caso
# vermelho para reportar TODOS, em vez de parar no primeiro.
set -u
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
G="$AQUI/audit-gate.mjs"
BASE="$AQUI/../assets/templates/audit.exemplo.json"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ok=0; fail=0

muta() { local nome="$1" esp="$2" agulha="$3" prog="$4"
  local arq="$TMP/$nome.json"
  python3 -c "
import json
d=json.load(open('$BASE',encoding='utf8'))
$prog
json.dump(d,open('$arq','w',encoding='utf8'),ensure_ascii=False)" || { echo "  ✖ $nome: mutacao falhou"; fail=$((fail+1)); return; }
  local saida; saida="$(node "$G" "$arq" --declarada --repo "$AQUI/.." 2>&1)"; local rc=$?
  if [ "$rc" != "$esp" ]; then echo "  ✖ $nome: exit $rc, esperado $esp"; sed 's/^/      /' <<<"$saida"; fail=$((fail+1)); return; fi
  if [ -n "$agulha" ] && ! grep -qF -- "$agulha" <<<"$saida"; then echo "  ✖ $nome: exit certo, saida sem \"$agulha\""; sed 's/^/      /' <<<"$saida"; fail=$((fail+1)); return; fi
  echo "  ✔ $nome"; ok=$((ok+1)); }

# O exemplo distribuido e um relatorio REALISTA: reprova, porque tem um orfao vivo.
echo "== o exemplo reprova (e por isso ele e util como exemplo) =="
muta exemplo-reprova 1 "ORFAO RED (done_unproven)" "pass"

# Sanar o orfao (com desfecho) e zerar o contador -> verde. E a unica forma de ficar verde.
SANO="d['orphans_red'][0]['resolution']={'outcome':'sanado','date':'2026-08-21','why':'middleware + teste de rate-limit no commit a1b2c3d, gate roda hoje','evidence':'arquivo:SKILL.md'}; d['verdict']={'healthy':True,'blocking_orphans':0}; d['totals']['done_unproven']=1"
echo "== verde de partida =="
muta sano 0 "historico sao" "$SANO"

echo "== o veredito que mente =="
muta veredito-mente 1 "o veredito mente" "d['verdict']={'healthy':True,'blocking_orphans':0}"
muta contagem-errada 1 "mas ha 1 orfao(s) sem desfecho" "d['verdict']={'healthy':False,'blocking_orphans':7}"

echo "== cobertura: 'nao achei' nao e 'nao ha' =="
muta cobertura-parcial 1 "auditoria parcial nao fecha o gate" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':9,'complete':False,'not_audited':['chats/2026-07.md','decisoes/']}"
muta cobertura-parcial-cega 1 "nao sabe o que nao viu" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':9,'complete':False}"
muta cobertura-mentirosa 1 "cobertura e medida, nao sentida" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':9,'complete':True}"
muta cobertura-zero 1 "ausencia de rastro" "$SANO; d['coverage']={'artifacts_found':0,'artifacts_audited':0,'complete':True,'not_audited':[]}"
muta auditados-demais 1 "auditados (30) > encontrados" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':30,'complete':True,'not_audited':[]}"

echo "== feito sem prova volta a aberto, COM NOME =="
muta unproven-sem-nome 1 "feito sem prova volta a ABERTO" "$SANO; d['totals']['done_unproven']=4"

echo "== sem waiver silencioso =="
muta waiver-sem-motivo 1 "nao zera orfao" "$SANO; d['orphans_red'][1]['resolution']={'outcome':'reclassificado','date':'2026-08-21','why':'ok'}"
muta desfecho-no-futuro 1 "datado no FUTURO" "$SANO; d['orphans_red'][1]['resolution']['date']='2027-01-01'"

echo "== sanado exige EVIDENCIA verificavel (nao basta dizer) =="
muta sanado-sem-evidencia 1 "sanado\" sem prova" "$SANO; del d['orphans_red'][0]['resolution']['evidence']"
muta sanado-sha-inexistente 1 "nao existe em" "$SANO; d['orphans_red'][0]['resolution']['evidence']='sha:deadbeefdeadbeef'"
muta sanado-arquivo-inexistente 1 "nao existe" "$SANO; d['orphans_red'][0]['resolution']['evidence']='arquivo:src/nao-existe.go:3'"
muta sanado-linha-inexistente 1 "nao tem a linha" "$SANO; d['orphans_red'][0]['resolution']['evidence']='arquivo:SKILL.md:99999'"
muta sanado-prosa 1 "fora do formato" "$SANO; d['orphans_red'][0]['resolution']['evidence']='ok, ja resolvido'"
muta sanado-sha-real 0 "historico sao" "$SANO; import subprocess; d['orphans_red'][0]['resolution']['evidence']='sha:'+subprocess.check_output(['git','-C','$AQUI/..','rev-parse','HEAD']).decode().strip()"

echo "== cobertura RECONTADA no disco (--archive), nao autodeclarada =="
ARQ="$TMP/archive"; mkdir -p "$ARQ/plan" "$ARQ/decisoes" "$ARQ/audit"
printf '# plano\n- [x] a\n- [ ] b\n- [~] c\n' > "$ARQ/plan/p.md"
printf '# ADR-1\nStatus: proposed\nData: 2026-01-01\n' > "$ARQ/decisoes/ADR-0001-x.md"
cat > "$TMP/real.json" <<J
{"schema":"schematize-audit/run@1","audit_date":"2026-11-03","scope":"teste",
 "coverage":{"artifacts_found":2,"artifacts_audited":2,"complete":true,"not_audited":[]},
 "totals":{"done":1,"open":1,"on_hold":1,"done_unproven":0},
 "orphans_red":[
  {"kind":"open_never_closed","source":"plan/p.md:3","item":"b","missing":"fechar","resolution":{"outcome":"reclassificado","date":"2026-11-03","why":"vira item do proximo marco, registrado"}},
  {"kind":"adr_proposed_orphan","source":"decisoes/ADR-0001-x.md:2","item":"ADR-0001","missing":"decidir","resolution":{"outcome":"rejeitado","date":"2026-11-03","why":"substituido por outra decisao, datada"}}],
 "verdict":{"healthy":true,"blocking_orphans":0}}
J
rodaA() { # nome exit agulha arquivo-json
  local saida; saida="$(node "$G" "$4" --archive "$ARQ" --repo "$AQUI/.." 2>&1)"; local rc=$?
  if [ "$rc" != "$2" ]; then echo "  ✖ $1: exit $rc, esperado $2"; sed 's/^/      /' <<<"$saida"; fail=$((fail+1)); return; fi
  if [ -n "$3" ] && ! grep -qF -- "$3" <<<"$saida"; then echo "  ✖ $1: sem \"$3\""; sed 's/^/      /' <<<"$saida"; fail=$((fail+1)); return; fi
  echo "  ✔ $1"; ok=$((ok+1)); }
rodaA recontagem-confere 0 "historico sao" "$TMP/real.json"
python3 -c "
import json;d=json.load(open('$TMP/real.json'));d['coverage']['artifacts_found']=9;d['coverage']['artifacts_audited']=9
json.dump(d,open('$TMP/inflada.json','w'))"
rodaA cobertura-inflada 1 "cobertura autodeclarada nao vale" "$TMP/inflada.json"
python3 -c "
import json;d=json.load(open('$TMP/real.json'));d['totals']['open']=0
json.dump(d,open('$TMP/totais.json','w'))"
rodaA totais-divergem 1 "recontagem diverge" "$TMP/totais.json"
python3 -c "
import json;d=json.load(open('$TMP/real.json'));d['orphans_red']=d['orphans_red'][:1]
json.dump(d,open('$TMP/sem-adr.json','w'))"
rodaA adr-proposed-escondido 1 "ADR proposed ADR-0001-x.md sem orfao" "$TMP/sem-adr.json"
printf -- '- [ ] escondido\n' >> "$ARQ/plan/p.md"
rodaA item-novo-no-archive 1 "totals.open = 1, mas o archive tem 2" "$TMP/real.json"
node "$G" "$TMP/real.json" >/dev/null 2>&1; [ $? = 1 ] && { echo "  ✔ sem --archive nem --declarada reprova"; ok=$((ok+1)); } || { echo "  ✖ sem --archive"; fail=$((fail+1)); }

echo "== schema =="
muta kind-inventado 2 "fora de" "d['orphans_red'][0]['kind']='mais_ou_menos'"
muta orfao-sem-origem 2 "string vazia" "d['orphans_red'][0]['source']=''"
muta sem-veredito 2 'campo obrigatorio "verdict" ausente' "del d['verdict']"
muta data-torta 2 "nao casa" "d['audit_date']='21/08/2026'"
muta campo-desconhecido 2 "campo desconhecido" "d['inventado']=1"
muta healthy-string 2 "esperado booleano" "d['verdict']['healthy']='sim'"

echo "== uso errado =="
node "$G" >/dev/null 2>&1; [ $? = 2 ] && { echo "  ✔ sem argumento -> exit 2"; ok=$((ok+1)); } || { echo "  ✖ sem argumento"; fail=$((fail+1)); }
printf '{"nao' > "$TMP/torto.json"
node "$G" "$TMP/torto.json" >/dev/null 2>&1; [ $? = 2 ] && { echo "  ✔ JSON invalido -> exit 2"; ok=$((ok+1)); } || { echo "  ✖ JSON invalido"; fail=$((fail+1)); }

echo; echo "audit-gate: $ok ok, $fail falha(s)"; [ "$fail" = 0 ]
