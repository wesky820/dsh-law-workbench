import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../index.js';

/** 挂载插件并拿到路由处理器（不需要真实 Host）。 */
function mount(casesRoot, storePath) {
  let route;
  const ctx = {
    webServer: { register: (r) => { route = r; return () => {}; } },
    get: () => undefined,
    effect: (fn) => { fn(); return () => {}; },
    inject: () => {},
    logger: { warn: () => {} },
  };
  apply(ctx, { casesRoot, storePath, kernelPath: join(casesRoot, 'no-kernel.json'), benchPath: join(casesRoot, 'no-bench.json') });
  assert.ok(route, 'route registered');
  return route.handler;
}

function makeReq(method, url, body) {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    method,
    url,
    headers: { host: '127.0.0.1:1234' },
    async *[Symbol.asyncIterator]() {
      if (text) yield Buffer.from(text);
    },
  };
}

function makeRes() {
  return {
    status: 0,
    text: '',
    writeHead(code) { this.status = code; },
    end(chunk) { this.text = chunk; },
    json() { return JSON.parse(this.text); },
  };
}

async function call(handler, method, url, body) {
  const res = makeRes();
  await handler(makeReq(method, url, body), res);
  return res;
}

test('ops: 建案 → 加证据 → 改状态 → 移除 → 恢复', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lw-ops-'));
  try {
    const store = join(root, 'store.json');
    await mkdir(root, { recursive: true });
    const handler = mount(root, store);

    const created = await call(handler, 'POST', '/law-workbench/api/mutate', {
      op: 'createCase', data: { title: '测试案', caseType: '民事', stage: '待接案' },
    });
    assert.equal(created.status, 200);
    assert.equal(created.json().ok, true);
    const dir = join(root, '测试案');

    const added = await call(handler, 'POST', '/law-workbench/api/mutate', {
      op: 'addItem', data: { kind: 'evidence', dir, name: '合同', evidenceKind: '书证', status: '待收集' },
    });
    assert.equal(added.json().ok, true);

    const saved = JSON.parse(await readFile(store, 'utf8'));
    const ev = saved.items.find((i) => i.kind === 'evidence');
    assert.ok(ev && ev.id);

    const bad = await call(handler, 'POST', '/law-workbench/api/mutate', {
      op: 'updateItem', data: { id: ev.id, patch: { status: '不存在' } },
    });
    assert.equal(bad.status, 400);
    assert.match(bad.json().error, /待收集/);

    const ok = await call(handler, 'POST', '/law-workbench/api/mutate', {
      op: 'updateItem', data: { id: ev.id, patch: { status: '已提交' } },
    });
    assert.equal(ok.json().ok, true);
    const after = JSON.parse(await readFile(store, 'utf8'));
    assert.equal(after.items.find((i) => i.id === ev.id).status, '已提交');

    const info = await call(handler, 'POST', '/law-workbench/api/mutate', {
      op: 'updateCase',
      data: { dir, title: '测试案（改）', caseNumber: '(2026)沪0113民初0001号', court: '上海市某法院', caseType: '仲裁', parties: [{ name: '甲公司' }, { name: '乙公司' }] },
    });
    assert.equal(info.json().ok, true);
    const infoStore = JSON.parse(await readFile(store, 'utf8'));
    const meta = infoStore.cases.find((c) => c.dir === dir);
    assert.equal(meta.title, '测试案（改）');
    assert.equal(meta.court, '上海市某法院');
    assert.equal(meta.caseType, '仲裁');
    assert.deepEqual(meta.parties.map((x) => x.name), ['甲公司', '乙公司']);

    const removed = await call(handler, 'POST', '/law-workbench/api/mutate', { op: 'removeCase', data: { dir } });
    assert.equal(removed.json().ok, true);
    const hidden = JSON.parse(await readFile(store, 'utf8'));
    assert.deepEqual(hidden.hidden, [dir]);
    assert.equal(hidden.cases.length, 0);

    const restored = await call(handler, 'POST', '/law-workbench/api/mutate', { op: 'restoreCase', data: { dir } });
    assert.equal(restored.json().ok, true);
    const back = JSON.parse(await readFile(store, 'utf8'));
    assert.deepEqual(back.hidden, []);
    assert.equal(back.cases.length, 1);

    const overview = await call(handler, 'GET', '/law-workbench/api/overview');
    const snap = overview.json();
    assert.equal(snap.ok, true);
    assert.equal(snap.cases.length, 1);
    assert.equal(snap.archived.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ops: 批量登记返回成功数', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lw-ops2-'));
  try {
    const store = join(root, 'store.json');
    const handler = mount(root, store);
    await call(handler, 'POST', '/law-workbench/api/mutate', { op: 'createCase', data: { title: '批量案', caseType: '民事', stage: '待接案' } });
    const dir = join(root, '批量案');
    const res = await call(handler, 'POST', '/law-workbench/api/mutate', {
      op: 'addItems',
      data: {
        kind: 'evidence',
        dir,
        items: [
          { name: '甲证据', evidenceKind: '书证', status: '待收集' },
          { name: '乙证据', evidenceKind: '物证', status: '已收集' },
          { name: '', evidenceKind: '书证', status: '待收集' },
        ],
      },
    });
    const body = res.json();
    assert.equal(body.ok, true);
    assert.equal(body.result.added, 2);
    assert.equal(body.result.failed.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
