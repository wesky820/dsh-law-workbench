import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { __test } from '../index.js';

const { buildItem, mapStage, extractDocxText, browseDirs, searchMaterials, pdfPageWords } = __test;

test('buildItem: 期限必填日期', () => {
  const bad = buildItem('deadline', '/x', { title: '举证期限' });
  assert.equal(bad.error, '届满日期必填（YYYY-MM-DD）');
  const ok = buildItem('deadline', '/x', { title: '举证期限', dueDate: '2026-12-01', basis: '民诉法解释第99条' });
  assert.equal(ok.error, undefined);
  assert.equal(ok.caseDir, '/x');
  assert.equal(ok.kind, 'deadline');
  assert.equal(ok.done, false);
});

test('buildItem: 证据/主张/纪要/检索', () => {
  assert.equal(buildItem('evidence', '/x', {}).error, '证据名称必填');
  const ev = buildItem('evidence', '/x', { name: '借款合同' });
  assert.equal(ev.evidenceKind, '书证');
  assert.equal(ev.status, '待收集');

  assert.equal(buildItem('claim', '/x', {}).error, '主张标题必填');
  const claim = buildItem('claim', '/x', { title: '请求支付货款', basisLaw: '《民法典》第577条' });
  assert.equal(claim.verdict, '待定');

  assert.equal(buildItem('minute', '/x', {}).error, '纪要标题必填');
  assert.equal(buildItem('note', '/x', {}).error, '标题必填');
});

test('mapStage: 旧阶段名与空值都归一到六列', () => {
  assert.equal(mapStage('收案'), '待接案');
  assert.equal(mapStage(''), '待接案');
  assert.equal(mapStage('准备'), '调查取证');
  assert.equal(mapStage('待定策略'), '策略制定');
  assert.equal(mapStage('DRAFTING'), '文书起草');
  assert.equal(mapStage('review'), '待定稿送审');
  assert.equal(mapStage('结案'), '已结案');
});

test('browseDirs: 只列目录并排除点文件', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lw-browse-'));
  try {
    await mkdir(join(root, '乙案'));
    await mkdir(join(root, '甲案'));
    await writeFile(join(root, 'note.md'), '# x');
    await mkdir(join(root, '.hidden'));
    const out = await browseDirs(root);
    assert.equal(out.ok, true);
    assert.deepEqual(out.entries.map((e) => e.name), ['乙案', '甲案'].sort((a, b) => a.localeCompare(b, 'zh')));
    assert.ok(out.entries.every((e) => !e.name.startsWith('.')));
    assert.ok(Array.isArray(out.roots));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('browseDirs: 不存在的路径返回错误而非抛出', async () => {
  const out = await browseDirs('/definitely/not/here');
  assert.equal(out.ok, false);
  assert.match(out.error, /目录不存在/);
});

test('searchMaterials: 命中带行号与片段', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lw-search-'));
  const store = join(root, 'store.json');
  try {
    const caseDir = join(root, '案例甲');
    await mkdir(join(caseDir, '文书'), { recursive: true });
    await writeFile(join(caseDir, '文书', '起诉状.md'), '# 起诉状\n\n第一行\n判令被告偿还借款本金 100,000 元\n');
    const out = await searchMaterials(root, store, '借款', 10);
    assert.equal(out.ok, true);
    assert.equal(out.hits.length, 1);
    assert.equal(out.hits[0].file, '起诉状.md');
    assert.equal(out.hits[0].line, 4);
    assert.match(out.hits[0].snippet, /借款/);
    assert.equal(out.scanned, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const demoDocx = join(process.env.HOME || '', 'Law/Cases/【演示】材料阅读示例/文书/证据清单.docx');
test('extractDocxText: 从 docx 抽出正文', { skip: !existsSync(demoDocx) }, async () => {
  const { readFile } = await import('node:fs/promises');
  const text = extractDocxText(await readFile(demoDocx));
  assert.ok(text.length > 20);
  assert.match(text, /证据清单/);
});

const demoPdf = join(process.env.HOME || '', 'Law/Cases/【演示】材料阅读示例/证据/采购合同（节选）.pdf');
test('pdfPageWords: 返回词框与页面尺寸', { skip: !existsSync(demoPdf) }, () => {
  const out = pdfPageWords(demoPdf, 1);
  assert.ok(out.words.length > 5);
  assert.ok(out.width > 0 && out.height > 0);
  const w = out.words[0];
  assert.ok(typeof w.t === 'string' && w.t.length > 0);
  assert.ok(w.x >= 0 && w.y >= 0 && w.w > 0 && w.h > 0);
});
