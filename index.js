/**
 * dsh-law-workbench —— Host 半边。
 *
 * 路由（前缀 /law-workbench/api）：
 *   GET  /overview  只读快照：本机三处案件数据 + 工作台自有记录合并
 *   POST /mutate    写操作：新建案件 / 改阶段 / 加期限·证据·检索
 *
 * 数据来源：
 *   1. ~/Law/Cases/<案件名>/           真实案件目录
 *   2. ~/.dsh/dsh-law/kernel.json     律师工作台内核
 *   3. ~/.dsh/dsh-lawbench/data.json  案件卡数据
 *   4. ~/.dsh/law-workbench/store.json 本插件自己的记录（唯一可写处）
 *
 * 写入只落在 store.json 与新建的案件目录里，不改外部两套数据。
 */
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import { join, basename, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { homedir } from 'node:os';

const HOME = homedir();
const CASES_ROOT = join(HOME, 'Law', 'Cases');
const KERNEL_PATH = join(HOME, '.dsh', 'dsh-law', 'kernel.json');
const BENCH_PATH = join(HOME, '.dsh', 'dsh-lawbench', 'data.json');
const STORE_PATH = join(HOME, '.dsh', 'law-workbench', 'store.json');

/** 案件目录里被当作「材料分类」的子目录。 */
const KIND_DIRS = ['文书', '文书_docx', '证据', '检索', '预演', '客户材料', '庭审', '定稿与提交', '结案归档'];
const CASE_SUBDIRS = ['文书', '证据', '检索', '预演'];
const MAX_FILES_PER_KIND = 40;
const MAX_DIRS = 200;
const MAX_BODY = 256 * 1024;

/** 看板列（也是允许的阶段值）。 */
const STAGES = ['待接案', '调查取证', '策略制定', '文书起草', '待定稿送审', '已结案'];

export const inject = ['webServer'];

export function apply(ctx, config) {
  const root = typeof config?.casesRoot === 'string' ? config.casesRoot : CASES_ROOT;
  const storePath = typeof config?.storePath === 'string' ? config.storePath : STORE_PATH;
  const paths = {
    kernel: typeof config?.kernelPath === 'string' ? config.kernelPath : KERNEL_PATH,
    bench: typeof config?.benchPath === 'string' ? config.benchPath : BENCH_PATH,
  };
  let presetCache = { at: 0, list: [] };
  const toolState = { names: [] };
  const listPresets = async () => {
    if (Date.now() - presetCache.at < 30000) return presetCache.list;
    try {
      const service = typeof ctx.get === 'function' ? ctx.get('agentPresets') : undefined;
      const list = service && typeof service.list === 'function' ? await service.list() : [];
      presetCache = { at: Date.now(), list: (list || []).map((p) => ({ id: p.id, name: p.name })) };
    } catch {
      presetCache = { at: Date.now(), list: [] };
    }
    return presetCache.list;
  };

  const handler = async (req, res) => {
    if (!admit(ctx, req)) {
      writeJson(res, 403, { ok: false, error: 'forbidden' });
      return;
    }
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '');

    try {
      if (req.method === 'GET' && path === '/law-workbench/api/overview') {
        writeJson(res, 200, await buildSnapshot(root, storePath, await listPresets(), paths));
        return;
      }
      if (req.method === 'GET' && path === '/law-workbench/api/selftest') {
        const store = await loadStore(storePath);
        writeJson(res, 200, {
          ok: true,
          version: '1.0.0',
          tools: toolState.names,
          storePath,
          casesRoot: root,
          boundSessions: Object.keys(store.sessions || {}).length,
          cases: store.cases.length,
          items: store.items.length,
        });
        return;
      }
      if (req.method === 'GET' && path === '/law-workbench/api/page') {
        writeJson(
          res,
          200,
          await renderPdfPage(
            root,
            storePath,
            url.searchParams.get('path'),
            Number(url.searchParams.get('n') || 1),
            Number(url.searchParams.get('dpi') || 110),
            url.searchParams.get('words') === '1',
          ),
        );
        return;
      }
      if (req.method === 'GET' && path === '/law-workbench/api/search') {
        writeJson(res, 200, await searchMaterials(root, storePath, url.searchParams.get('q'), Number(url.searchParams.get('limit') || 40)));
        return;
      }
      if (req.method === 'GET' && path === '/law-workbench/api/file') {
        writeJson(res, 200, await readMaterial(root, storePath, url.searchParams.get('path')));
        return;
      }
      if (req.method === 'POST' && path === '/law-workbench/api/reveal') {
        const body = await readJsonBody(req);
        writeJson(res, 200, revealInFinder(root, storePath, body && body.path));
        return;
      }
      if (req.method === 'GET' && path === '/law-workbench/api/browse') {
        writeJson(res, 200, await browseDirs(url.searchParams.get('path')));
        return;
      }
      if (req.method === 'POST' && path === '/law-workbench/api/mutate') {
        const body = await readJsonBody(req);
        const result = await mutate(root, storePath, body);
        if (!result.ok) {
          writeJson(res, 400, result);
          return;
        }
        writeJson(res, 200, { ok: true, result, snapshot: await buildSnapshot(root, storePath, await listPresets(), paths) });
        return;
      }
      writeJson(res, 404, { ok: false, error: 'not-found' });
    } catch (error) {
      writeJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };

  if (typeof ctx.inject === 'function') {
    ctx.inject(['tools'], (scoped) => {
      scoped.effect(() => {
        const off = registerLawTools(scoped, storePath);
        toolState.names = LAW_TOOL_SPECS.map((s2) => s2.name).concat(['law_case_status']);
        return () => {
          toolState.names = [];
          if (typeof off === 'function') off();
        };
      }, 'law-workbench: tools');
    });
  }

  ctx.effect(() => {
    try {
      const off = ctx.webServer.register({ kind: 'prefix', path: '/law-workbench/api', handler });
      return () => {
        try {
          if (typeof off === 'function') off();
        } catch {
          /* 卸载失败不影响启动 */
        }
      };
    } catch (error) {
      try {
        ctx.logger?.warn?.(`[law-workbench] 路由注册失败：${error instanceof Error ? error.message : String(error)}`);
      } catch {
        /* ignore */
      }
      return undefined;
    }
  }, 'law-workbench: routes');
}

// ── 写操作 ──────────────────────────────────────────────────────────────────

async function mutate(root, storePath, body) {
  const op = String(body?.op ?? '');
  const data = body?.data ?? {};
  const store = await loadStore(storePath);

  if (op === 'createCase') {
    const title = clean(data.title, 80);
    if (!title) return { ok: false, error: '案件名称必填' };
    let dir;
    if (typeof data.dir === 'string' && data.dir.trim()) {
      // 关联已有文件夹：必须已存在且是目录
      const wanted = data.dir.trim();
      let info;
      try {
        info = await stat(wanted);
      } catch {
        return { ok: false, error: `目录不存在：${wanted}` };
      }
      if (!info.isDirectory()) return { ok: false, error: '指定的不是文件夹' };
      dir = wanted;
    } else {
      dir = join(root, safeDirName(title));
    }
    await mkdir(dir, { recursive: true });
    for (const sub of CASE_SUBDIRS) await mkdir(join(dir, sub), { recursive: true });
    if (Array.isArray(store.hidden)) store.hidden = store.hidden.filter((h) => h !== dir);
    store.cases = store.cases.filter((c) => c.dir !== dir);
    store.cases.push({
      dir,
      title,
      caseNumber: clean(data.caseNumber, 60),
      court: clean(data.court, 60),
      caseType: clean(data.caseType, 20) || '民事',
      stage: STAGES.includes(data.stage) ? data.stage : '待接案',
      summary: clean(data.summary, 2000),
      parties: normalizeParties(data.parties),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await saveStore(storePath, store);
    return { ok: true, dir };
  }

  if (op === 'adoptCase') {
    const dir = String(data.dir ?? '');
    if (!dir) return { ok: false, error: '缺少案件目录' };
    if (store.cases.some((c) => c.dir === dir)) return { ok: true };
    let title = clean(data.title, 80) || basename(dir);
    store.cases.push({
      dir,
      title,
      caseNumber: clean(data.caseNumber, 60),
      court: clean(data.court, 60),
      caseType: clean(data.caseType, 20) || '民事',
      stage: STAGES.includes(data.stage) ? data.stage : '待接案',
      summary: clean(data.summary, 2000),
      parties: normalizeParties(data.parties),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await saveStore(storePath, store);
    return { ok: true };
  }

  if (op === 'bindSession') {
    const dir = String(data.dir ?? '');
    if (!dir) return { ok: false, error: '缺少案件目录' };
    store.sessions = store.sessions || {};
    if (data.sessionId) store.sessions[dir] = String(data.sessionId);
    else delete store.sessions[dir];
    await saveStore(storePath, store);
    return { ok: true };
  }

  if (op === 'removeCase') {
    const dir = String(data.dir ?? '');
    if (!dir) return { ok: false, error: '缺少案件目录' };
    const before = store.cases.length;
    store.cases = store.cases.filter((c) => c.dir !== dir);
    store.items = store.items.filter((i) => i.caseDir !== dir);
    if (store.sessions) delete store.sessions[dir];
    store.hidden = Array.isArray(store.hidden) ? store.hidden : [];
    if (!store.hidden.includes(dir)) store.hidden.push(dir);
    await saveStore(storePath, store);
    return { ok: true, removed: before - store.cases.length };
  }

  if (op === 'restoreCase') {
    const dir = String(data.dir ?? '');
    if (!dir) return { ok: false, error: '缺少案件目录' };
    store.hidden = Array.isArray(store.hidden) ? store.hidden.filter((h) => h !== dir) : [];
    if (!store.cases.some((c) => c.dir === dir)) {
      let isDir = false;
      try {
        isDir = (await stat(dir)).isDirectory();
      } catch {
        isDir = false;
      }
      if (!isDir) {
        await saveStore(storePath, store);
        return { ok: false, error: '目录已不存在，已从归档中移除' };
      }
      store.cases.push({
        dir,
        title: basename(dir),
        caseNumber: '',
        court: '',
        caseType: '民事',
        stage: '待接案',
        summary: '',
        parties: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await saveStore(storePath, store);
    return { ok: true };
  }

  if (op === 'updateCase') {
    const item = store.cases.find((c) => c.dir === data.dir);
    if (!item) return { ok: false, error: '外部来源的案件为只读，只能修改工作台新建的案件' };
    if (data.stage !== undefined) {
      if (!STAGES.includes(data.stage)) return { ok: false, error: '未知阶段' };
      item.stage = data.stage;
    }
    if (data.summary !== undefined) item.summary = clean(data.summary, 2000);
    if (data.caseNumber !== undefined) item.caseNumber = clean(data.caseNumber, 60);
    if (data.court !== undefined) item.court = clean(data.court, 60);
    if (data.caseType !== undefined) item.caseType = clean(data.caseType, 20) || item.caseType;
    if (data.title !== undefined) {
      const title = clean(data.title, 80);
      if (!title) return { ok: false, error: '案件名称不能为空' };
      item.title = title;
    }
    if (data.parties !== undefined) item.parties = normalizeParties(data.parties);
    if (data.sessionId !== undefined) item.sessionId = clean(data.sessionId, 80) || null;
    item.updatedAt = Date.now();
    await saveStore(storePath, store);
    return { ok: true };
  }

  if (op === 'updateItem') {
    const id = String(data.id ?? '');
    const patch = data.patch && typeof data.patch === 'object' ? data.patch : {};
    const item = store.items.find((i) => i.id === id);
    if (!item) return { ok: false, error: '记录不存在或来自外部数据源' };
    const allowed = {
      evidence: ['name', 'evidenceKind', 'status'],
      claim: ['title', 'verdict', 'statement', 'basisLaw'],
      deadline: ['title', 'dueDate', 'basis'],
      note: ['title', 'source', 'summary'],
      minute: ['title', 'summary'],
    }[item.kind] || [];
    for (const key of allowed) {
      if (patch[key] === undefined) continue;
      const value = clean(patch[key], key === 'statement' || key === 'summary' ? 2000 : 200);
      if (key === 'status' && !['待收集', '已收集', '已提交'].includes(value)) return { ok: false, error: '状态只能是待收集/已收集/已提交' };
      if (key === 'verdict' && !['待定', '成立', '不成立'].includes(value)) return { ok: false, error: '结论只能是待定/成立/不成立' };
      if (key === 'dueDate' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, error: '日期格式须为 YYYY-MM-DD' };
      if (!value && key !== 'basis' && key !== 'statement' && key !== 'summary') continue;
      item[key] = value;
    }
    item.updatedAt = Date.now();
    await saveStore(storePath, store);
    return { ok: true };
  }

  if (op === 'addItems') {
    const kind = String(data.kind ?? '');
    if (!['deadline', 'evidence', 'claim', 'note', 'minute'].includes(kind)) return { ok: false, error: '未知记录类型' };
    const list = Array.isArray(data.items) ? data.items : [];
    if (list.length === 0) return { ok: false, error: '没有要登记的内容' };
    const dir = String(data.dir ?? '');
    if (!dir) return { ok: false, error: '缺少案件目录' };
    const added = [];
    const failed = [];
    for (let i = 0; i < list.length; i += 1) {
      const item = buildItem(kind, dir, { ...list[i], dir });
      if (item.error) {
        failed.push({ index: i, error: item.error });
        continue;
      }
      store.items.push(item);
      added.push(item.id);
    }
    if (added.length > 0) await saveStore(storePath, store);
    return { ok: true, added: added.length, failed };
  }

  if (op === 'addItem' || op === 'toggleItem' || op === 'deleteItem') {
    const kind = String(data.kind ?? '');
    if (!['deadline', 'evidence', 'note', 'claim', 'minute'].includes(kind)) return { ok: false, error: '未知记录类型' };

    if (op === 'deleteItem') {
      store.items = store.items.filter((i) => i.id !== data.id);
      await saveStore(storePath, store);
      return { ok: true };
    }
    if (op === 'toggleItem') {
      const item = store.items.find((i) => i.id === data.id);
      if (!item) return { ok: false, error: '外部来源的记录为只读' };
      item.done = !item.done;
      item.updatedAt = Date.now();
      await saveStore(storePath, store);
      return { ok: true };
    }

    const item = buildItem(kind, data.dir, data);
    if (item.error) return { ok: false, error: item.error };
    store.items.push(item);
    await saveStore(storePath, store);
    return { ok: true };
  }

  return { ok: false, error: `未知操作：${op}` };
}

/** 目录浏览（只列目录名，不读文件内容）。 */
async function browseDirs(rawTarget) {
  const target = String(rawTarget || '').trim() || HOME;
  let info;
  try {
    info = await stat(target);
  } catch {
    return { ok: false, error: `目录不存在：${target}` };
  }
  if (!info.isDirectory()) return { ok: false, error: '不是文件夹' };
  let list = [];
  try {
    list = await readdir(target, { withFileTypes: true });
  } catch (error) {
    return { ok: false, error: `无法读取：${error instanceof Error ? error.message : String(error)}` };
  }
  const entries = list
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => ({ name: e.name, path: join(target, e.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const parent = dirname(target);
  return {
    ok: true,
    path: target,
    parent: parent === target ? null : parent,
    entries,
    roots: [
      { name: '主目录', path: HOME },
      { name: 'Law/Cases', path: join(HOME, 'Law', 'Cases') },
      { name: '文稿', path: join(HOME, 'Documents') },
      { name: '桌面', path: join(HOME, 'Desktop') },
      { name: '下载', path: join(HOME, 'Downloads') },
    ],
  };
}

/** 按类型构造一条台账记录；出错时返回 { error }。 */
function buildItem(kind, dir, data) {
  const item = {
    id: `it_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    caseDir: String(dir ?? ''),
    createdAt: Date.now(),
    done: false,
  };;
    if (kind === 'deadline') {
    const title = clean(data.title, 80);
    if (!title) return { error: '期限名称必填' };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.dueDate ?? ''))) return { error: '届满日期必填（YYYY-MM-DD）' };
    item.title = title;
    item.dueDate = String(data.dueDate);
    item.basis = clean(data.basis, 120);
    } else if (kind === 'evidence') {
    const name = clean(data.name, 80);
    if (!name) return { error: '证据名称必填' };
    item.name = name;
    item.evidenceKind = clean(data.evidenceKind, 20) || '书证';
    item.status = clean(data.status, 20) || '待收集';
    } else if (kind === 'claim') {
    const title = clean(data.title, 80);
    if (!title) return { error: '主张标题必填' };
    item.title = title;
    item.statement = clean(data.statement, 2000);
    item.basisLaw = clean(data.basisLaw, 200);
    item.verdict = clean(data.verdict, 20) || '待定';
    } else if (kind === 'minute') {
    const title = clean(data.title, 80);
    if (!title) return { error: '纪要标题必填' };
    item.title = title;
    item.summary = clean(data.summary, 4000);
    } else {
    const title = clean(data.title, 80);
    if (!title) return { error: '标题必填' };
    item.title = title;
    item.source = clean(data.source, 40);
    item.summary = clean(data.summary, 2000);
    }
  return item;
}

// ── 模型面工具：让 AI 在对话里直接登记台账 ────────────────────────────────

const LAW_TOOL_SPECS = [
  {
    kind: 'deadline',
    name: 'law_case_add_deadline',
    label: '期限',
    description:
      '把一条办案期限登记到当前案件台账。用户说「记一条期限」「举证期到 X 月 X 日」「上诉期哪天届满」时使用。dueDate 必须是 YYYY-MM-DD。',
    properties: {
      title: { type: 'string', description: '期限名称，如「一审举证期限届满」' },
      dueDate: { type: 'string', description: '届满日，YYYY-MM-DD' },
      basis: { type: 'string', description: '法律依据（可选），如《民事诉讼法》第171条' },
    },
    required: ['title', 'dueDate'],
  },
  {
    kind: 'evidence',
    name: 'law_case_add_evidence',
    label: '证据',
    description: '登记一份证据到当前案件台账。状态三态：待收集 / 已收集 / 已提交。',
    properties: {
      name: { type: 'string', description: '证据名称' },
      evidenceKind: { type: 'string', description: '证据类型：书证/物证/电子数据/证人证言/鉴定意见/勘验笔录/视听资料' },
      status: { type: 'string', description: '状态：待收集/已收集/已提交' },
    },
    required: ['name'],
  },
  {
    kind: 'claim',
    name: 'law_case_add_claim',
    label: '主张',
    description: '登记一条诉讼主张（请求 + 请求权基础）。用户讨论诉请、请求权基础时使用。',
    properties: {
      title: { type: 'string', description: '主张，如「请求判令被告支付货款 664,000 元」' },
      statement: { type: 'string', description: '事实与理由' },
      basisLaw: { type: 'string', description: '请求权基础，如《民法典》第577条' },
    },
    required: ['title'],
  },
  {
    kind: 'note',
    name: 'law_case_add_note',
    label: '检索',
    description: '登记一条法律检索结论到当前案件台账（来源：法答网/人民法院案例库/北大法宝/元典/官网）。',
    properties: {
      title: { type: 'string', description: '检索标题' },
      source: { type: 'string', description: '来源' },
      summary: { type: 'string', description: '结论摘要（含出处）' },
    },
    required: ['title'],
  },
  {
    kind: 'minute',
    name: 'law_case_add_minute',
    label: '纪要',
    description: '登记一段会话纪要（结论、待办、风险点）。重要讨论收尾时使用。',
    properties: {
      title: { type: 'string', description: '纪要标题' },
      summary: { type: 'string', description: '纪要正文' },
    },
    required: ['title'],
  },
];

function toolParameters(spec) {
  return {
    type: 'object',
    properties: {
      ...spec.properties,
      caseDir: { type: 'string', description: '案件目录绝对路径（可选；默认用当前会话绑定的案件）' },
    },
    required: spec.required,
    additionalProperties: false,
  };
}

function toolOutput() {
  return {
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean' }, message: { type: 'string' } },
      required: ['ok', 'message'],
      additionalProperties: false,
    },
    render: (args, value) => [{ type: 'text', text: (value && value.message) || '完成' }],
  };
}

/** 解析当前会话绑定的案件目录（工作台打开对话时会写回 sessions 映射）。 */
function resolveCaseDir(store, args, exec) {
  const explicit = String((args && args.caseDir) || '').trim();
  if (explicit) return explicit;
  const sessionId = exec && exec.agent && exec.agent.id;
  if (!sessionId) return '';
  for (const [dir, bound] of Object.entries(store.sessions || {})) {
    if (bound === sessionId) return dir;
  }
  return '';
}

async function addThroughTool(storePath, kind, args, exec) {
  const store = await loadStore(storePath);
  const dir = resolveCaseDir(store, args, exec);
  if (!dir) return { ok: false, message: '没有找到当前案件：先在工作台点「打开 AI 对话」，或在参数里传 caseDir。' };
  let info;
  try {
    info = await stat(dir);
  } catch {
    return { ok: false, message: `案件目录不存在：${dir}` };
  }
  if (!info.isDirectory()) return { ok: false, message: 'caseDir 不是文件夹' };
  if (!store.cases.some((c) => c.dir === dir)) {
    store.cases.push({
      dir,
      title: basename(dir),
      caseNumber: '',
      court: '',
      caseType: '民事',
      stage: '待接案',
      summary: '',
      parties: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  const item = buildItem(kind, dir, args || {});
  if (item.error) return { ok: false, message: item.error };
  store.items.push(item);
  await saveStore(storePath, store);
  return { ok: true, message: `已登记到「${basename(dir)}」：${item.title || item.name}` };
}

async function caseStatusTool(storePath, args, exec) {
  const store = await loadStore(storePath);
  const dir = resolveCaseDir(store, args, exec);
  if (!dir) return { ok: false, message: '没有找到当前案件：先在工作台点「打开 AI 对话」，或传 caseDir。' };
  const meta = store.cases.find((c) => c.dir === dir);
  const items = store.items.filter((i) => i.caseDir === dir);
  const by = (kind) => items.filter((i) => i.kind === kind).length;
  const deadlines = items.filter((i) => i.kind === 'deadline' && !i.done).map((i) => `${i.dueDate} ${i.title}`);
  return {
    ok: true,
    message: [
      `案件：${meta ? meta.title : basename(dir)}`,
      `阶段：${meta ? meta.stage : '—'}｜案号：${meta ? meta.caseNumber || '—' : '—'}`,
      `台账：期限 ${by('deadline')}｜证据 ${by('evidence')}｜主张 ${by('claim')}｜检索 ${by('note')}｜纪要 ${by('minute')}`,
      deadlines.length ? `未完成期限：${deadlines.slice(0, 8).join('；')}` : '未完成期限：无',
      `目录：${dir}`,
    ].join('\n'),
  };
}

function registerLawTools(scoped, storePath) {
  const tools = scoped.tools;
  if (!tools || typeof tools.register !== 'function') return undefined;
  const offs = LAW_TOOL_SPECS.map((spec) =>
    tools.register({
      name: spec.name,
      description: spec.description,
      parameters: toolParameters(spec),
      output: toolOutput(),
      execute: async (args, exec) => addThroughTool(storePath, spec.kind, args || {}, exec),
    }),
  );
  offs.push(
    tools.register({
      name: 'law_case_status',
      description: '读取当前案件的台账概况（阶段、案号、各类记录数量、未完成期限）。登记前不确定案件上下文时先调用。',
      parameters: {
        type: 'object',
        properties: { caseDir: { type: 'string', description: '案件目录绝对路径（可选）' } },
        additionalProperties: false,
      },
      output: toolOutput(),
      execute: async (args, exec) => caseStatusTool(storePath, args || {}, exec),
    }),
  );
  return () => {
    for (const off of offs) {
      try {
        if (typeof off === 'function') off();
      } catch {
        /* ignore */
      }
    }
  };
}

async function loadStore(storePath) {
  try {
    const parsed = JSON.parse(await readFile(storePath, 'utf8'));
    return {
      version: 1,
      cases: Array.isArray(parsed.cases) ? parsed.cases : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    };
  } catch {
    return { version: 1, cases: [], items: [], sessions: {}, hidden: [] };
  }
}

async function saveStore(storePath, store) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify({ version: 1, cases: store.cases, items: store.items, sessions: store.sessions || {}, hidden: store.hidden || [] }, null, 1), 'utf8');
}

function normalizeParties(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => ({ name: clean(p?.name, 40), role: clean(p?.role, 20) }))
    .filter((p) => p.name)
    .slice(0, 12);
}

function clean(value, max) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

function safeDirName(title) {
  const base = title.replace(/[/\\:*?"<>|]/g, '·').replace(/\s+/g, ' ').trim().slice(0, 60);
  return base || `案件-${Date.now()}`;
}

// ── 快照 ────────────────────────────────────────────────────────────────────

async function buildSnapshot(root, storePath, presets = [], paths = { kernel: KERNEL_PATH, bench: BENCH_PATH }) {
  const sources = [];
  const allDirs = await listCaseDirs(root);
  const hiddenList = (await loadStore(storePath)).hidden || [];
  const hidden = new Set(hiddenList);
  const dirs = allDirs.filter((d) => !hidden.has(d.path));
  sources.push({ id: 'dirs', label: '案件目录', path: root, ok: dirs.length > 0, count: dirs.length });
  if (dirs.length === 0) sources[sources.length - 1].note = '目录不存在或为空';

  const kernel = await readJson(paths.kernel);
  sources.push({ id: 'kernel', label: '工作台内核', path: paths.kernel, ok: Boolean(kernel?.cases?.length), count: kernel?.cases?.length ?? 0 });

  const bench = await readJson(paths.bench);
  sources.push({ id: 'bench', label: '案件卡', path: paths.bench, ok: Boolean(bench?.cases?.length), count: bench?.cases?.length ?? 0 });

  const store = await loadStore(storePath);

  const cases = [];
  const known = new Map();

  for (const dir of dirs) {
    const entry = blankCase(`dir:${dir.name}`);
    entry.title = dir.name;
    entry.caseDir = dir.path;
    entry.origin = ['dir'];
    entry.files = await collectFiles(dir.path);
    known.set(normKey(dir.name), entry);
    cases.push(entry);
  }

  for (const meta of store.cases) {
    const key = normKey(basename(meta.dir));
    let entry = known.get(key);
    if (!entry) {
      entry = blankCase(`store:${key}`);
      entry.title = meta.title || basename(meta.dir);
      entry.caseDir = meta.dir;
      known.set(key, entry);
      cases.push(entry);
    }
    entry.origin.push('store');
    entry.writable = true;
    entry.title = meta.title || entry.title;
    entry.caseNumber = meta.caseNumber || entry.caseNumber;
    entry.court = meta.court || entry.court;
    entry.caseType = meta.caseType || entry.caseType;
    entry.stageOverride = meta.stage || '';
    entry.summary = meta.summary || entry.summary;
    entry.sessionId = meta.sessionId || '';

    if (!entry.parties.length) entry.parties = meta.parties ?? [];
  }

  for (const raw of kernel?.cases ?? []) {
    if (raw?.deletedAt) continue;
    if (raw.caseDir && hidden.has(raw.caseDir)) continue;
    const key = normKey(raw.caseDir ? basename(raw.caseDir) : raw.name);
    const entry = known.get(key) ?? addCase(cases, known, key, raw.name);
    entry.origin.push('kernel');
    entry.caseNumber = entry.caseNumber || raw.caseNumber || '';
    entry.court = entry.court || raw.court || '';
    entry.stage = entry.stage || kernelStageLabel(raw.status);
    entry.caseType = entry.caseType || raw.caseType || '';
    entry.summary = entry.summary || raw.summary || '';
    if (!entry.parties.length) entry.parties = (raw.parties ?? []).map(toParty);
    if (!entry.caseDir && raw.caseDir) entry.caseDir = raw.caseDir;

    for (const d of kernelDeadlines(kernel, raw.caseId)) entry.deadlines.push(d);
    for (const e of kernelEvidence(kernel, raw.caseId)) entry.evidence.push(e);
    for (const doc of kernelDocuments(kernel, raw.caseId)) entry.documents.push(doc);
    for (const note of kernelNotes(kernel, raw.caseId)) entry.notes.push(note);
    for (const claim of kernel?.claims ?? []) {
      if (claim.caseId !== raw.caseId) continue;
      entry.claims.push({ id: '', title: claim.title ?? '未命名主张', statement: claim.statement ?? '', basisLaw: (claim.basisLaw ?? []).join('；'), verdict: claim.verdict ?? '待定', origin: '工作台内核', writable: false });
    }
  }

  for (const raw of bench?.cases ?? []) {
    if (raw.workspacePath && hidden.has(raw.workspacePath)) continue;
    const key = normKey(stripSamplePrefix(raw.title ?? ''));
    const entry = known.get(key) ?? addCase(cases, known, key, stripSamplePrefix(raw.title ?? ''));
    entry.origin.push('bench');
    entry.caseNumber = entry.caseNumber || raw.caseNumber || '';
    entry.court = entry.court || raw.court || '';
    entry.summary = entry.summary || raw.summary || '';
    entry.stage = entry.stage || stageLabel(raw.status);
    entry.caseType = entry.caseType || raw.type || '';
    if (!entry.parties.length) entry.parties = (raw.parties ?? []).map(toParty);
    if (!entry.caseDir && raw.workspacePath) entry.caseDir = raw.workspacePath;

    for (const d of benchDeadlines(raw.deadlines)) entry.deadlines.push(d);
    for (const e of raw.evidence ?? []) {
      entry.evidence.push({ id: '', name: e.name ?? '未命名证据', kind: e.kind ?? '', status: e.status ?? '', origin: '案件卡', done: false, writable: false });
    }
    for (const doc of raw.docs ?? []) {
      entry.documents.push({
        title: doc.title ?? doc.name ?? '未命名文书',
        docType: doc.docType ?? doc.type ?? '',
        versions: Number(doc.versions?.length ?? doc.versionCount ?? 1) || 1,
        finalized: Boolean(doc.finalizedAt),
        origin: '案件卡',
      });
    }
    for (const item of raw.research ?? []) {
      entry.notes.push({ id: '', title: item.title ?? item.query ?? '检索记录', source: item.source ?? '', summary: item.summary ?? '', origin: '案件卡', writable: false });
    }
  }

  for (const item of store.items) {
    const entry = cases.find((c) => c.caseDir && item.caseDir && c.caseDir === item.caseDir);
    if (!entry) continue;
    if (item.kind === 'deadline') {
      entry.deadlines.push({
        id: item.id,
        title: item.title,
        dueDate: item.dueDate || null,
        basis: item.basis || '',
        done: Boolean(item.done),
        origin: '工作台',
        writable: true,
      });
    } else if (item.kind === 'evidence') {
      entry.evidence.push({ id: item.id, name: item.name, kind: item.evidenceKind || '', status: item.status || '', origin: '工作台', done: Boolean(item.done), writable: true });
    } else if (item.kind === 'claim') {
      entry.claims.push({ id: item.id, title: item.title, statement: item.statement || '', basisLaw: item.basisLaw || '', verdict: item.verdict || '待定', origin: '工作台', writable: true });
    } else if (item.kind === 'minute') {
      entry.minutes.push({ id: item.id, title: item.title, summary: item.summary || '', at: item.createdAt, origin: '工作台', writable: true });
    } else {
      entry.notes.push({ id: item.id, title: item.title, source: item.source || '', summary: item.summary || '', origin: '工作台', writable: true });
    }
  }

  for (const entry of cases) {
    if (entry.caseDir && store.sessions && store.sessions[entry.caseDir]) entry.sessionId = store.sessions[entry.caseDir];
  }

  const today = startOfDay(new Date());
  for (const entry of cases) {
    entry.deadlines = dedupe(entry.deadlines, (d) => `${d.title}|${d.dueDate}`)
      .map((d) => ({ ...d, daysLeft: d.dueDate ? diffDays(today, d.dueDate) : null }))
      .sort((a, b) => sortKey(a) - sortKey(b) || String(a.title).localeCompare(String(b.title), 'zh'));
    entry.evidence = dedupe(entry.evidence, (e) => `${e.name}|${e.kind}`);
    entry.documents = dedupe(entry.documents, (d) => `${d.title}|${d.docType}`);
    entry.notes = dedupe(entry.notes, (n) => n.title);
    entry.claims = dedupe(entry.claims, (c) => c.title);
    entry.minutes = dedupe(entry.minutes, (m) => m.title);
    entry.materialCounts = countFiles(entry.files);
    entry.fileCount = entry.files.reduce((n, f) => n + f.items.length, 0);
    entry.risks = buildRisks(entry);
    entry.stage = mapStage(entry.stageOverride || entry.stage);
    entry.active = entry.stage !== '已结案';
  }

  const allDeadlines = cases.flatMap((c) =>
    c.deadlines.filter((d) => !d.done && d.daysLeft !== null).map((d) => ({ ...d, caseTitle: c.title })),
  );
  const archived = (hiddenList || [])
    .map((dir) => ({ dir, title: basename(dir) }))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh'));

  const aggregate = {
    caseCount: cases.length,
    activeCount: cases.filter((c) => c.active).length,
    overdue: allDeadlines.filter((d) => d.daysLeft < 0).length,
    dueSoon: allDeadlines.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 7).length,
    docCount: cases.reduce((n, c) => n + c.documents.length, 0),
    fileCount: cases.reduce((n, c) => n + c.fileCount, 0),
    upcoming: [...allDeadlines].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 12),
    risks: cases.flatMap((c) => c.risks.map((r) => ({ ...r, caseTitle: c.title }))).slice(0, 12),
    week: buildWeek(today, allDeadlines),
    recent: buildRecent(cases),
    board: STAGES.map((stage) => ({ stage, count: cases.filter((c) => c.stage === stage).length })),
    claimCount: cases.reduce((n, c) => n + c.claims.length, 0),
    minuteCount: cases.reduce((n, c) => n + c.minutes.length, 0),
  };

  cases.sort((a, b) => Number(b.active) - Number(a.active) || riskWeight(b) - riskWeight(a) || a.title.localeCompare(b.title, 'zh'));

  return { ok: true, generatedAt: Date.now(), stages: STAGES, presets, sources, aggregate, cases, archived };
}

// ── 目录与文件 ──────────────────────────────────────────────────────────────

async function listCaseDirs(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .slice(0, MAX_DIRS)
    .map((e) => ({ name: e.name, path: join(root, e.name) }));
}

async function collectFiles(caseDir) {
  const out = [];
  for (const kind of KIND_DIRS) {
    const dir = join(caseDir, kind);
    let items;
    try {
      items = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const files = [];
    for (const item of items) {
      if (!item.isFile() || item.name.startsWith('.')) continue;
      const full = join(dir, item.name);
      let size = 0;
      let mtime = 0;
      try {
        const info = await stat(full);
        size = info.size;
        mtime = info.mtimeMs;
      } catch {
        /* 单个文件读不到不影响整页 */
      }
      files.push({ name: item.name, path: full, ext: extname(item.name).slice(1), size, mtime });
    }
    files.sort((a, b) => b.mtime - a.mtime);
    if (files.length > 0) out.push({ kind, count: files.length, items: files.slice(0, MAX_FILES_PER_KIND) });
  }
  return out;
}

function countFiles(files) {
  const counts = {};
  for (const g of files) counts[g.kind] = g.count;
  return counts;
}

// ── 材料阅读 ────────────────────────────────────────────────────────────────

const TEXT_EXT = new Set(['md', 'markdown', 'txt', 'json', 'jsonl', 'csv', 'tsv', 'log', 'yml', 'yaml', 'xml', 'html', 'htm', 'srt', 'rtf']);
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']);
const MAX_TEXT_BYTES = 1_500_000;
const MAX_IMAGE_BYTES = 12_000_000;

/** 只允许读案件目录里的文件（防止借接口读任意路径）。 */
async function isInsideCase(root, storePath, target) {
  const store = await loadStore(storePath);
  const roots = [root, ...store.cases.map((c) => c.dir).filter(Boolean)];
  for (const base of roots) {
    if (!base) continue;
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    if (target === base || target.startsWith(normalizedBase)) return true;
  }
  return false;
}

async function readMaterial(root, storePath, rawPath) {
  const target = String(rawPath || '').trim();
  if (!target) return { ok: false, error: '缺少文件路径' };
  if (!(await isInsideCase(root, storePath, target))) return { ok: false, error: '只允许读取案件目录内的文件' };
  let info;
  try {
    info = await stat(target);
  } catch {
    return { ok: false, error: '文件不存在' };
  }
  if (!info.isFile()) return { ok: false, error: '不是文件' };
  const name = basename(target);
  const ext = extname(name).slice(1).toLowerCase();
  const base = { ok: true, name, path: target, size: info.size, mtime: info.mtimeMs, ext };

  if (IMAGE_EXT.has(ext)) {
    if (info.size > MAX_IMAGE_BYTES) return { ...base, kind: 'unsupported', note: '图片过大（>12MB），请用系统程序打开' };
    const buf = await readFile(target);
    return { ...base, kind: 'image', dataUrl: `data:${imageMime(ext)};base64,${buf.toString('base64')}` };
  }

  if (ext === 'docx') {
    try {
      const text = extractDocxText(await readFile(target));
      return { ...base, kind: 'text', format: 'markdown', text: text.slice(0, MAX_TEXT_BYTES), note: text.length > MAX_TEXT_BYTES ? '内容较长，仅显示前 1.5MB' : '' };
    } catch (error) {
      return { ...base, kind: 'unsupported', note: `docx 解析失败：${error instanceof Error ? error.message : String(error)}` };
    }
  }

  if (ext === 'pdf') {
    const text = pdfToText(target);
    if (text) {
      const pages = text.split('\f').map((pg) => pg.replace(/\s+$/, ''));
      if (pages.length > 1 && pages[pages.length - 1] === '') pages.pop();
      return {
        ...base,
        kind: 'text',
        format: 'paged',
        pages,
        pageCount: pages.length,
        text: text.slice(0, MAX_TEXT_BYTES),
        note: 'PDF 文本层抽取（按页切分）；扫描件可能需要 OCR',
      };
    }
    return { ...base, kind: 'unsupported', note: 'PDF 文本层抽取不可用（未安装 pdftotext 或为扫描件）' };
  }

  if (ext === 'doc') {
    const text = docToText(target);
    if (text) return { ...base, kind: 'text', format: 'plain', text: text.slice(0, MAX_TEXT_BYTES), note: '由 textutil 转换' };
    return { ...base, kind: 'unsupported', note: '.doc 转换失败，请另存为 .docx' };
  }

  if (TEXT_EXT.has(ext) || !ext) {
    if (info.size > MAX_TEXT_BYTES) {
      const buf = await readFile(target);
      return { ...base, kind: 'text', format: ext === 'md' ? 'markdown' : 'plain', text: buf.toString('utf8').slice(0, MAX_TEXT_BYTES), note: '文件较大，仅显示前 1.5MB' };
    }
    const text = await readFile(target, 'utf8');
    return { ...base, kind: 'text', format: ext === 'md' || ext === 'markdown' ? 'markdown' : 'plain', text };
  }

  return { ...base, kind: 'unsupported', note: `暂不支持预览 .${ext} 文件` };
}

function imageMime(ext) {
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  return 'image/jpeg';
}

/** docx = zip + word/document.xml；用内置 zlib 解压后剥标签。 */
function extractDocxText(buffer) {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('不是有效的 docx');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const entryName = buffer.slice(offset + 46, offset + 46 + nameLength).toString('utf8');
    if (entryName === 'word/document.xml') {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const raw = buffer.slice(dataStart, dataStart + compressedSize);
      const xml = (method === 0 ? raw : inflateRawSync(raw)).toString('utf8');
      return docxXmlToText(xml);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error('docx 里找不到 word/document.xml');
}

function docxXmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pdfToText(path) {
  try {
    return execFileSync('pdftotext', ['-layout', path, '-'], { maxBuffer: 8 * 1024 * 1024, timeout: 20000 }).toString('utf8');
  } catch {
    return '';
  }
}

function docToText(path) {
  try {
    return execFileSync('textutil', ['-convert', 'txt', '-stdout', path], { maxBuffer: 8 * 1024 * 1024, timeout: 20000 }).toString('utf8');
  } catch {
    return '';
  }
}

const PAGE_CACHE = new Map();
const PAGE_CACHE_MAX = 24;

/** 把 PDF 某一页渲染成 PNG（版面视图）。 */
async function renderPdfPage(root, storePath, rawPath, rawPage, rawDpi, wantWords) {
  const target = String(rawPath || '').trim();
  if (!target) return { ok: false, error: '缺少文件路径' };
  if (!(await isInsideCase(root, storePath, target))) return { ok: false, error: '只允许读取案件目录内的文件' };
  if (extname(target).toLowerCase() !== '.pdf') return { ok: false, error: '只有 PDF 支持版面渲染' };
  let info;
  try {
    info = await stat(target);
  } catch {
    return { ok: false, error: '文件不存在' };
  }
  const dpi = Math.min(Math.max(Math.round(rawDpi) || 110, 72), 200);
  let pageCount = pdfPageCount(target);
  const page = Math.min(Math.max(Math.round(rawPage) || 1, 1), Math.max(pageCount, 1));
  const cacheKey = `${target}|${info.mtimeMs}|${page}|${dpi}`;
  if (PAGE_CACHE.has(cacheKey)) {
    const hit = PAGE_CACHE.get(cacheKey);
    PAGE_CACHE.delete(cacheKey);
    PAGE_CACHE.set(cacheKey, hit);
    return { ok: true, page, pageCount, dpi, dataUrl: hit };
  }
  const tmp = join(tmpdir(), `lw-page-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  try {
    execFileSync('pdftoppm', ['-png', '-r', String(dpi), '-f', String(page), '-l', String(page), '-singlefile', target, tmp], {
      timeout: 30000,
      maxBuffer: 16 * 1024 * 1024,
    });
    const buf = await readFile(`${tmp}.png`);
    const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
    PAGE_CACHE.set(cacheKey, dataUrl);
    while (PAGE_CACHE.size > PAGE_CACHE_MAX) PAGE_CACHE.delete(PAGE_CACHE.keys().next().value);
    if (!pageCount) pageCount = page;
    const payload = { ok: true, page, pageCount, dpi, dataUrl };
    if (wantWords) {
      const words = pdfPageWords(target, page);
      payload.words = words.words;
      payload.pageWidth = words.width;
      payload.pageHeight = words.height;
    }
    return payload;
  } catch (error) {
    return { ok: false, error: `版面渲染失败：${error instanceof Error ? error.message : String(error)}` };
  } finally {
    try {
      const { unlink } = await import('node:fs/promises');
      await unlink(`${tmp}.png`);
    } catch {
      /* 临时文件清不掉不影响结果 */
    }
  }
}

const WORD_CACHE = new Map();
const WORD_CACHE_MAX = 48;

/** 用 pdftotext -bbox-layout 取某一页的词级坐标（点为单位）。 */
function pdfPageWords(path, page) {
  const key = `${path}|${page}`;
  if (WORD_CACHE.has(key)) return WORD_CACHE.get(key);
  let out = '';
  try {
    out = execFileSync('pdftotext', ['-bbox-layout', '-f', String(page), '-l', String(page), path, '-'], {
      timeout: 20000,
      maxBuffer: 32 * 1024 * 1024,
    }).toString('utf8');
  } catch {
    return { words: [], width: 0, height: 0 };
  }
  const pageMatch = /<page[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/.exec(out);
  const width = pageMatch ? Number(pageMatch[1]) : 0;
  const height = pageMatch ? Number(pageMatch[2]) : 0;
  const words = [];
  const re = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/word>/g;
  let m;
  while ((m = re.exec(out)) !== null) {
    const text = m[5]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
    if (!text) continue;
    words.push({ t: text, x: Number(m[1]), y: Number(m[2]), w: Number(m[3]) - Number(m[1]), h: Number(m[4]) - Number(m[2]) });
    if (words.length >= 4000) break;
  }
  const result = { words, width, height };
  WORD_CACHE.set(key, result);
  while (WORD_CACHE.size > WORD_CACHE_MAX) WORD_CACHE.delete(WORD_CACHE.keys().next().value);
  return result;
}

function pdfPageCount(path) {
  try {
    const out = execFileSync('pdfinfo', [path], { timeout: 10000 }).toString('utf8');
    const m = /^Pages:\s+(\d+)/m.exec(out);
    return m ? Number(m[1]) : 0;
  } catch {
    return 0;
  }
}

/** 跨案件全文检索：只扫案件目录内的文本类材料。 */
async function searchMaterials(root, storePath, rawQuery, limit) {
  const query = String(rawQuery || '').trim();
  const max = Math.min(Math.max(limit || 40, 1), 100);
  if (!query) return { ok: true, query: '', hits: [], scanned: 0, truncated: false };
  const needle = query.toLowerCase();
  const store = await loadStore(storePath);
  const dirs = new Set();
  for (const d of await listCaseDirs(root)) dirs.add(d.path);
  for (const c of store.cases) if (c.dir) dirs.add(c.dir);

  const hits = [];
  let scanned = 0;
  let truncated = false;
  for (const dir of dirs) {
    const caseName = basename(dir);
    for (const kind of KIND_DIRS) {
      const sub = join(dir, kind);
      let items;
      try {
        items = await readdir(sub, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const it of items) {
        if (!it.isFile() || it.name.startsWith('.')) continue;
        if (scanned >= 400) {
          truncated = true;
          break;
        }
        const ext = extname(it.name).slice(1).toLowerCase();
        const full = join(sub, it.name);
        let text = '';
        try {
          if (ext === 'docx') text = extractDocxText(await readFile(full));
          else if (ext === 'pdf') text = pdfToText(full);
          else if (TEXT_EXT.has(ext)) {
            const info = await stat(full);
            if (info.size > MAX_TEXT_BYTES) continue;
            text = await readFile(full, 'utf8');
          } else continue;
        } catch {
          continue;
        }
        scanned += 1;
        if (!text) continue;
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i += 1) {
          const at = lines[i].toLowerCase().indexOf(needle);
          if (at < 0) continue;
          const line = lines[i].trim();
          const start = Math.max(0, at - 40);
          hits.push({
            case: caseName,
            file: it.name,
            path: full,
            kind,
            line: i + 1,
            snippet: line.slice(start, start + 180),
          });
          break;
        }
        if (hits.length >= max) {
          truncated = true;
          break;
        }
      }
      if (truncated) break;
    }
    if (truncated) break;
  }
  return { ok: true, query, hits, scanned, truncated };
}

/** 在访达里定位文件（仅案件目录内）。 */
async function revealInFinder(root, storePath, rawPath) {
  const target = String(rawPath || '').trim();
  if (!target) return { ok: false, error: '缺少路径' };
  if (!(await isInsideCase(root, storePath, target))) return { ok: false, error: '只允许案件目录内的文件' };
  try {
    execFileSync('open', ['-R', target], { timeout: 5000 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ── 记录映射 ────────────────────────────────────────────────────────────────

function kernelDeadlines(kernel, caseId) {
  return (kernel.deadlines ?? [])
    .filter((d) => d.caseId === caseId)
    .map((d) => ({
      id: '',
      title: d.title ?? '未命名期限',
      dueDate: d.dueDate ?? addDays(d.startDate, d.days),
      basis: d.basis ?? '',
      done: Boolean(d.done),
      origin: '工作台内核',
      writable: false,
    }));
}

function kernelEvidence(kernel, caseId) {
  return (kernel.evidence ?? [])
    .filter((e) => e.caseId === caseId)
    .map((e) => ({ id: '', name: e.name ?? '未命名证据', kind: e.kind ?? '', status: e.status ?? '', origin: '工作台内核', done: false, writable: false }));
}

function kernelDocuments(kernel, caseId) {
  return (kernel.documents ?? [])
    .filter((d) => d.caseId === caseId)
    .map((d) => ({
      title: d.title ?? '未命名文书',
      docType: d.docType ?? '',
      versions: Array.isArray(d.versions) ? d.versions.length : 1,
      finalized: Boolean(d.finalizedAt),
      origin: '工作台内核',
    }));
}

function kernelNotes(kernel, caseId) {
  return (kernel.notes ?? [])
    .filter((n) => n.caseId === caseId)
    .map((n) => ({ id: '', title: n.title ?? '检索记录', source: n.source ?? '', summary: n.summary ?? '', origin: '工作台内核', writable: false }));
}

function benchDeadlines(list) {
  return (list ?? []).map((d) => ({
    id: '',
    title: d.title ?? '未命名期限',
    dueDate: d.dueDate ?? addDays(d.startDate, d.days),
    basis: d.basis ?? '',
    done: Boolean(d.done),
    origin: '案件卡',
    writable: false,
  }));
}

// ── 标签与派生 ──────────────────────────────────────────────────────────────

const STAGE_ALIAS = {
  intake: '待接案',
  conflict: '待接案',
  收案: '待接案',
  待接案: '待接案',
  调研: '调查取证',
  准备: '调查取证',
  evidence: '调查取证',
  举证: '调查取证',
  调查取证: '调查取证',
  待定策略: '策略制定',
  策略: '策略制定',
  strategy: '策略制定',
  策略制定: '策略制定',
  drafting: '文书起草',
  文书起草: '文书起草',
  review: '待定稿送审',
  reviewing: '待定稿送审',
  审核: '待定稿送审',
  待定稿送审: '待定稿送审',
  立案: '文书起草',
  filing: '文书起草',
  hearing: '待定稿送审',
  庭审: '待定稿送审',
  judgment: '待定稿送审',
  closed: '已结案',
  archived: '已结案',
  结案: '已结案',
  已结案: '已结案',
};

function mapStage(label) {
  const text = String(label ?? '').trim();
  if (STAGES.includes(text)) return text;
  return STAGE_ALIAS[text] ?? STAGE_ALIAS[text.toLowerCase()] ?? '待接案';
}

function stageLabel(status) {
  return mapStage(status);
}

function kernelStageLabel(status) {
  const map = {
    INTAKE: '待接案',
    PREPARING: '调查取证',
    STRATEGY_PENDING: '策略制定',
    DRAFTING: '文书起草',
    REVIEWING: '待定稿送审',
    FILING: '文书起草',
    HEARING: '待定稿送审',
    CLOSED: '已结案',
    ARCHIVED: '已结案',
  };
  return map[String(status ?? '').toUpperCase()] ?? '待接案';
}

function toParty(p) {
  return { name: p?.name ?? '未署名', role: p?.role ?? '' };
}

function riskWeight(entry) {
  return entry.risks.reduce((n, r) => n + (r.level === 'high' ? 3 : r.level === 'mid' ? 2 : 1), 0);
}

function buildRisks(entry) {
  const risks = [];
  for (const d of entry.deadlines) {
    if (d.done || d.daysLeft === null) continue;
    if (d.daysLeft < 0) risks.push({ level: 'high', text: `期限已过 ${Math.abs(d.daysLeft)} 天：${d.title}` });
    else if (d.daysLeft <= 7) risks.push({ level: 'mid', text: `${d.daysLeft} 天内到期：${d.title}` });
  }
  if (!entry.documents.length && entry.stage !== '已结案') risks.push({ level: 'low', text: '尚无文书记录' });
  return risks;
}

/** 未来 7 天的期限分布（首页周历条）。 */
function buildWeek(today, deadlines) {
  const out = [];
  for (let i = 0; i < 7; i += 1) {
    const date = ymd(new Date(today.getTime() + i * 86400000));
    const items = deadlines.filter((d) => d.dueDate === date).map((d) => ({ title: d.title, caseTitle: d.caseTitle, daysLeft: d.daysLeft }));
    out.push({ date, offset: i, count: items.length, items });
  }
  return out;
}

/** 最近变动的材料（跨案件，按 mtime 倒序）。 */
function buildRecent(cases) {
  const rows = [];
  for (const c of cases) {
    for (const group of c.files) {
      for (const f of group.items) {
        rows.push({ caseTitle: c.title, caseId: c.id, kind: group.kind, name: f.name, path: f.path, size: f.size, mtime: f.mtime });
      }
    }
  }
  return rows.sort((a, b) => b.mtime - a.mtime).slice(0, 10);
}

function blankCase(id) {
  return {
    id,
    title: '',
    caseNumber: '',
    court: '',
    caseType: '',
    stage: '',
    stageOverride: '',
    summary: '',
    caseDir: '',
    sessionId: '',
    parties: [],
    deadlines: [],
    evidence: [],
    documents: [],
    notes: [],
    claims: [],
    minutes: [],
    files: [],
    materialCounts: {},
    fileCount: 0,
    risks: [],
    active: true,
    writable: false,
    origin: [],
  };
}

function addCase(cases, known, key, title) {
  const entry = blankCase(`rec:${key}`);
  entry.title = title || '未命名案件';
  known.set(key, entry);
  cases.push(entry);
  return entry;
}

/** 测试出口：纯函数与 IO 助手，供 node --test 调用，不参与运行时逻辑。 */
export const __test = {
  buildItem,
  mapStage,
  extractDocxText,
  browseDirs,
  searchMaterials,
  pdfPageWords,
  loadStore,
  saveStore,
};

// ── 小工具 ──────────────────────────────────────────────────────────────────

function normKey(text) {
  return String(text ?? '')
    .replace(/^【示例】/, '')
    .replace(/[\s（）()【】\[\]·、，,。:：\-—_]/g, '')
    .toLowerCase();
}

function stripSamplePrefix(text) {
  return String(text ?? '').replace(/^【示例】/, '');
}

function dedupe(list, keyOf) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function addDays(startDate, days) {
  if (!startDate || typeof days !== 'number') return null;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  start.setDate(start.getDate() + days);
  return ymd(start);
}

function ymd(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function diffDays(today, isoDate) {
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function sortKey(deadline) {
  return deadline.daysLeft === null ? 100000 : deadline.daysLeft;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('请求体过大');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function writeJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  });
  res.end(text);
}

/** 只放行本机回环 + 同源；跨站读不到（无 CORS 头）。 */
function admit(ctx, req) {
  const headers = req?.headers ?? {};
  const hostOk = isLoopbackAuthority(headers.host);
  const origin = headers.origin;
  const originOk = origin === undefined || isLoopbackAuthority(String(origin).replace(/^https?:\/\//, ''));
  if (hostOk && originOk) return true;
  try {
    const connection = typeof ctx.get === 'function' ? ctx.get('connection') : undefined;
    const rejection = connection?.requestRejection?.(req);
    return rejection === undefined || rejection === null || rejection === false;
  } catch {
    return false;
  }
}

function isLoopbackAuthority(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return false;
  const host = text.replace(/^\[/, '').replace(/^([^\]]*)\].*$/, '$1');
  return ['127.0.0.1', 'localhost', '::1'].includes(host.split(':')[0]);
}
