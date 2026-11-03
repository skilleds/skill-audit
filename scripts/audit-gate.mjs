#!/usr/bin/env node
// schematize-audit — o VALIDADOR e o EXIT CODE. A skill prometia saida machine-readable e gate que
// trava, e entregava um exemplo em prosa: sem schema, sem validador, sem exit code (vistoria de
// 2026-08-21). Como e a skill que daria o veredito formal, a falta era estrutural.
//
// uso: audit-gate.mjs <audit.json> --archive <dir-do-archive> [--repo <dir-git>] [--json]
//      audit-gate.mjs <audit.json> --declarada [...]     (aceita a cobertura SEM recontar — so p/ exemplo/teste)
//      0 = historico sao · 1 = REPROVA (orfao RED bloqueante) · 2 = documento invalido
//
// Cobertura e totais NAO sao acreditados: com --archive o gate RECONTA no disco (itens `- [ ]`/`[H ]` = open,
// `- [~]` = on_hold, `- [x]` = done; artefato = .md com item de checklist + todo ADR em decisoes/; `audit/` fica
// de fora) e compara com o JSON. Sem --archive nem --declarada: reprova (cobertura autodeclarada).
// `sanado` exige `resolution.evidence` VERIFICAVEL: `sha:<commit>` (existe no --repo, git cat-file) ou
// `arquivo:<caminho>[:linha]` (existe e a linha existe; relativo ao --repo, ou ao archive).
// ADR `proposed` em decisoes/ sem orfao correspondente na lista = reprova.
//
// O que ele nao deixa passar, e que um exemplo em prosa nunca impediria:
//  · `verdict.healthy: true` com orfao bloqueante na lista (o veredito que mente);
//  · `blocking_orphans` que nao bate com a contagem real;
//  · lista de orfaos vazia com `coverage.complete: false` — "nao achei" nao e "nao ha";
//  · orfao "resolvido" sem desfecho explicito e datado (o waiver silencioso).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, basename } from 'node:path'

const SCHEMA = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'schemas', 'audit-run.schema.json')

function valida(dado, esq, raiz, caminho = '$', erros = []) {
  if (esq.$ref) return valida(dado, esq.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], raiz), raiz, caminho, erros)
  if (esq.const !== undefined && dado !== esq.const) erros.push(`${caminho}: esperado ${JSON.stringify(esq.const)}`)
  if (esq.enum && !esq.enum.includes(dado)) erros.push(`${caminho}: "${dado}" fora de [${esq.enum.join('|')}]`)
  if (esq.type === 'string') {
    if (typeof dado !== 'string') { erros.push(`${caminho}: esperado string`); return erros }
    if (esq.minLength && dado.length < esq.minLength) erros.push(`${caminho}: string vazia`)
    if (esq.pattern && !new RegExp(esq.pattern).test(dado)) erros.push(`${caminho}: "${dado}" nao casa /${esq.pattern}/`)
  }
  if (esq.type === 'boolean' && typeof dado !== 'boolean') erros.push(`${caminho}: esperado booleano`)
  if (esq.type === 'integer') {
    if (!Number.isInteger(dado)) { erros.push(`${caminho}: esperado inteiro`); return erros }
    if (esq.minimum !== undefined && dado < esq.minimum) erros.push(`${caminho}: ${dado} < ${esq.minimum}`)
  }
  if (esq.type === 'array') {
    if (!Array.isArray(dado)) { erros.push(`${caminho}: esperado lista`); return erros }
    if (esq.items) dado.forEach((v, i) => valida(v, esq.items, raiz, `${caminho}[${i}]`, erros))
  }
  if (esq.type === 'object' || esq.properties) {
    if (dado === null || typeof dado !== 'object' || Array.isArray(dado)) { erros.push(`${caminho}: esperado objeto`); return erros }
    for (const req of esq.required || []) if (!(req in dado)) erros.push(`${caminho}: campo obrigatorio "${req}" ausente`)
    for (const [k, v] of Object.entries(dado)) {
      const sub = esq.properties?.[k]
      if (sub) valida(v, sub, raiz, `${caminho}.${k}`, erros)
      else if (esq.additionalProperties === false) erros.push(`${caminho}: campo desconhecido "${k}"`)
    }
  }
  return erros
}

const CHECK = /^\s*[-*]\s+\[( |x|X|~|H ?)\]/
function mds(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'audit') mds(p, acc) } else if (/\.md$/i.test(e.name)) acc.push(p)
  }
  return acc
}
/** recontagem independente do JSON: o que o archive realmente tem. */
function recontar(archive) {
  const r = { artifacts: 0, open: 0, on_hold: 0, done: 0, adrsProposed: [] }
  for (const f of mds(archive)) {
    const txt = readFileSync(f, 'utf8')
    let itens = 0
    for (const l of txt.split('\n')) {
      const m = l.match(CHECK)
      if (!m) continue
      itens++
      if (m[1] === ' ' || m[1].startsWith('H')) r.open++
      else if (m[1] === '~') r.on_hold++
      else r.done++
    }
    const adr = /[\\/]decisoes[\\/]/.test(f)
    if (itens > 0 || adr) r.artifacts++
    if (adr && /^\W*(?:status|situa[cç][aã]o)\W*[:：]?\**\s*`?proposed/im.test(txt)) r.adrsProposed.push(basename(f))
  }
  return r
}
/** evidencia verificavel de um `sanado`: devolve null se vale, ou o motivo. */
function checaEvidencia(ev, repo, archive) {
  if (!ev || !ev.trim()) return 'sem `resolution.evidence`'
  let m = ev.match(/^sha:([0-9a-f]{7,40})$/i)
  if (m) {
    try { execFileSync('git', ['-C', repo, 'cat-file', '-e', `${m[1]}^{commit}`], { stdio: 'ignore' }); return null }
    catch { return `commit ${m[1]} nao existe em ${repo}` }
  }
  m = ev.match(/^(?:arquivo|file):(.+?)(?::(\d+))?$/)
  if (m) {
    const cand = [resolve(repo, m[1]), archive ? resolve(archive, m[1]) : null].filter(Boolean).find(c => existsSync(c) && statSync(c).isFile())
    if (!cand) return `arquivo ${m[1]} nao existe`
    if (m[2] && Number(m[2]) > readFileSync(cand, 'utf8').split('\n').length) return `${m[1]} nao tem a linha ${m[2]}`
    return null
  }
  return `evidencia "${ev}" fora do formato sha:<commit> ou arquivo:<caminho>[:linha]`
}

function gate(a, ctx = {}) {
  const falhas = [], avisos = []
  const bloqueantes = a.orphans_red.filter(o => !o.resolution)

  // 1. Coerencia do veredito. Um relatorio que se declara saudavel com orfao na lista e pior que
  //    nenhum relatorio: ele autoriza o release.
  if (a.verdict.healthy && bloqueantes.length > 0) {
    falhas.push(`verdict.healthy = true com ${bloqueantes.length} orfao(s) RED sem desfecho — o veredito mente`)
  }
  if (a.verdict.blocking_orphans !== bloqueantes.length) {
    falhas.push(`verdict.blocking_orphans = ${a.verdict.blocking_orphans}, mas ha ${bloqueantes.length} orfao(s) sem desfecho na lista`)
  }
  if (!a.verdict.healthy && bloqueantes.length === 0) {
    avisos.push('verdict.healthy = false sem orfao bloqueante — ou falta orfao na lista, ou o veredito esta desatualizado')
  }

  // 2. Cobertura: "nao achei" nao e "nao ha".
  const { artifacts_found: achados, artifacts_audited: auditados, complete, not_audited: naoAuditados = [] } = a.coverage
  if (auditados > achados) falhas.push(`coverage: auditados (${auditados}) > encontrados (${achados})`)
  if (complete && auditados < achados) falhas.push(`coverage.complete = true com ${achados - auditados} artefato(s) nao auditado(s) — cobertura e medida, nao sentida`)
  if (!complete) {
    falhas.push(`coverage.complete = false — auditoria parcial nao fecha o gate${naoAuditados.length ? ` (faltou: ${naoAuditados.slice(0, 5).join(', ')})` : '; e nem lista o que faltou'}`)
  }
  if (achados === 0) falhas.push('coverage: nenhum artefato encontrado — auditoria sem material nao e historico sao, e ausencia de rastro')
  if (!complete && naoAuditados.length === 0) falhas.push('coverage incompleta sem `not_audited` — auditoria que nao sabe o que nao viu')

  // 2b. Recontagem no disco: o JSON nao e acreditado.
  if (ctx.archive) {
    const r = recontar(ctx.archive)
    if (r.artifacts !== achados) falhas.push(`coverage.artifacts_found = ${achados}, mas o archive tem ${r.artifacts} artefato(s) com checklist/ADR — cobertura autodeclarada nao vale`)
    for (const [k, v] of [['open', r.open], ['on_hold', r.on_hold], ['done', r.done]]) {
      if (a.totals[k] !== v) falhas.push(`totals.${k} = ${a.totals[k]}, mas o archive tem ${v} — recontagem diverge`)
    }
    for (const adr of r.adrsProposed) {
      if (!a.orphans_red.some(o => o.source.includes(adr))) falhas.push(`ADR proposed ${adr} sem orfao adr_proposed_orphan na lista — "nao achei" nao e "nao ha"`)
    }
  } else if (!ctx.declarada) {
    falhas.push('cobertura autodeclarada: passe --archive <dir> para o gate recontar no disco (ou --declarada, so em exemplo/teste)')
  } else {
    avisos.push('--declarada: cobertura e totais NAO foram recontados')
  }

  // 3. `done_unproven` e reabertura, nao anotacao: tem de aparecer na lista de orfaos.
  const naLista = a.orphans_red.filter(o => o.kind === 'done_unproven').length
  if (a.totals.done_unproven !== naLista) {
    falhas.push(`totals.done_unproven = ${a.totals.done_unproven}, mas ha ${naLista} orfao(s) done_unproven listado(s) — feito sem prova volta a ABERTO, com nome`)
  }

  // 4. Desfecho: sem waiver silencioso.
  for (const [i, o] of a.orphans_red.entries()) {
    if (o.resolution && o.resolution.outcome !== 'sanado' && !/\S{10,}/.test(o.resolution.why || '')) {
      falhas.push(`orphans_red[${i}] (${o.kind}): reclassificado sem motivo escrito — "ignorar por ora" nao zera orfao`)
    }
    if (o.resolution && o.resolution.outcome === 'sanado') {
      const motivo = checaEvidencia(o.resolution.evidence, ctx.repo, ctx.archive)
      if (motivo) falhas.push(`orphans_red[${i}] (${o.kind}): "sanado" sem prova — ${motivo}`)
    }
    if (o.resolution && o.resolution.date && a.audit_date && o.resolution.date > a.audit_date) {
      falhas.push(`orphans_red[${i}]: desfecho datado no FUTURO (${o.resolution.date} > ${a.audit_date})`)
    }
  }

  // 5. Orfao bloqueante = reprova. E o piso da skill.
  if (bloqueantes.length) {
    for (const o of bloqueantes.slice(0, 20)) falhas.push(`ORFAO RED (${o.kind}) em ${o.source}: "${o.item}" — falta: ${o.missing}`)
  }

  return { falhas, avisos, bloqueantes: bloqueantes.length }
}

const argv = process.argv.slice(2)
const valorDe = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
const opArchive = valorDe('--archive'), opRepo = valorDe('--repo')
const arq = argv.find((x, i) => !x.startsWith('--') && argv[i - 1] !== '--archive' && argv[i - 1] !== '--repo')
if (!arq) { console.error('uso: audit-gate.mjs <audit.json> --archive <dir> [--repo <dir-git>] [--json]\n      0 = sao · 1 = REPROVA · 2 = documento invalido'); process.exit(2) }
let a, esquema
try { esquema = JSON.parse(readFileSync(SCHEMA, 'utf8')) } catch (e) { console.error(`schema ilegivel: ${e.message}`); process.exit(2) }
try { a = JSON.parse(readFileSync(arq, 'utf8')) } catch (e) { console.error(`✖ ${arq}: JSON invalido — ${e.message}`); process.exit(2) }
const erros = valida(a, esquema, esquema)
if (erros.length) {
  if (argv.includes('--json')) console.log(JSON.stringify({ veredito: 'invalido', erros }, null, 2))
  else { console.error(`✖ ${arq} nao casa com o schema (${erros.length}):`); erros.forEach(e => console.error(`  · ${e}`)) }
  process.exit(2)
}
if (opArchive && !existsSync(opArchive)) { console.error(`✖ --archive ${opArchive} nao existe`); process.exit(2) }
const { falhas, avisos, bloqueantes } = gate(a, { archive: opArchive ? resolve(opArchive) : null, repo: resolve(opRepo || '.'), declarada: argv.includes('--declarada') })
if (argv.includes('--json')) {
  console.log(JSON.stringify({ veredito: falhas.length ? 'reprovado' : 'aprovado', bloqueantes, falhas, avisos }, null, 2))
} else {
  avisos.forEach(x => console.error(`  ! ${x}`))
  if (falhas.length) {
    console.error(`\n✖ AUDITORIA REPROVADA — ${falhas.length} bloqueio(s):`)
    falhas.forEach(f => console.error(`  · ${f}`))
    console.error('\nOrfao so sai da lista SANADO (fechado com prova) ou com desfecho explicito e datado.')
  } else {
    console.log(`✔ historico sao — 0 orfao RED bloqueante, cobertura completa (${a.coverage.artifacts_audited}/${a.coverage.artifacts_found}).`)
  }
}
process.exit(falhas.length ? 1 : 0)
