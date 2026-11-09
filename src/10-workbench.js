    function Workbench(props) {
      const compact = Boolean(props && props.compact);
      const hostCtx = (props && props.hostCtx) || {};
      const slotProps = (props && props.slotProps) || {};
      let wsSnapshot;
      try {
        wsSnapshot = typeof slotProps.useWorkspaces === 'function' ? slotProps.useWorkspaces((s) => s) : undefined;
      } catch {
        wsSnapshot = undefined;
      }
      const [state, setState] = React.useState({ loading: true, data: null, error: null });
      const [view, setView] = React.useState('home');
      const [query, setQuery] = React.useState('');
      const [stageFilter, setStageFilter] = React.useState('');
      const [quick, setQuick] = React.useState('');
      const [active, setActive] = React.useState(null);
      const [creating, setCreating] = React.useState(false);
      const [archiveOpen, setArchiveOpen] = React.useState(false);
      const [preview, setPreview] = React.useState(null);
      const [toast, setToast] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const timer = React.useRef(0);

      const flash = React.useCallback((msg) => {
        setToast(msg);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setToast(''), 2200);
      }, []);

      const load = React.useCallback(
        (manual) => {
          setState((s) => ({ ...s, loading: true }));
          fetch(`${API}/overview`, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((data) => {
              setState({ loading: false, data, error: null });
              if (manual === true) flash('已刷新');
            })
            .catch((e) => setState({ loading: false, data: null, error: String(e.message || e) }));
        },
        [flash],
      );

      React.useEffect(() => {
        load();
      }, [load]);

      const mutate = React.useCallback(
        async (op, data) => {
          setBusy(true);
          try {
            const res = await fetch(`${API}/mutate`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ op, data }),
            });
            const body = await res.json();
            if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
            setState({ loading: false, data: body.snapshot, error: null });
            return true;
          } catch (e) {
            flash(`操作失败：${e.message}`);
            return false;
          } finally {
            setBusy(false);
          }
        },
        [flash],
      );

      const data = state.data;
      const stages = (data && data.stages) || ['待接案', '调查取证', '策略制定', '文书起草', '待定稿送审', '已结案'];
      const allCases = (data && data.cases) || [];
      const quickMatch = React.useCallback(
        (c) => {
          if (quick === 'active') return c.active !== false;
          if (quick === 'overdue') return c.deadlines.some((d) => !d.done && d.daysLeft !== null && d.daysLeft < 0);
          if (quick === 'dueSoon') return c.deadlines.some((d) => !d.done && d.daysLeft !== null && d.daysLeft >= 0 && d.daysLeft <= 7);
          if (quick === 'withFiles') return c.fileCount > 0;
          if (quick === 'withClaims') return c.claims.length > 0;
          if (quick === 'withMinutes') return c.minutes.length > 0;
          return true;
        },
        [quick],
      );
      const cases = React.useMemo(() => {
        const q = query.trim();
        return allCases.filter((c) => {
          if (stageFilter && c.stage !== stageFilter) return false;
          if (!quickMatch(c)) return false;
          if (!q) return true;
          return `${c.title} ${c.caseNumber} ${c.court} ${(c.parties || []).map((p) => p.name).join(' ')}`.includes(q);
        });
      }, [allCases, query, stageFilter, quickMatch]);
      const current = allCases.find((c) => c.id === active) || null;
      const openCase = (id) => setActive(id);
      const ensureWorkspace = React.useCallback(
        async (dir) => {
          const svc = (name) => {
            try {
              return typeof hostCtx.get === 'function' ? hostCtx.get(name) : undefined;
            } catch {
              return undefined;
            }
          };
          const ui = svc('uiWorkspace');
          const wss = svc('workspaces');
          if (!ui) return { error: '宿主没有暴露 uiWorkspace，无法打开会话' };
          let workspaceId = findWorkspaceId(wsSnapshot, dir);
          if (!workspaceId && wss && typeof wss.create === 'function') {
            const view = await wss.create({ path: dir });
            workspaceId = view && (view.id || view.workspaceId);
          }
          if (!workspaceId) return { error: '没能为这个目录建立工作区' };
          return { ui, workspaceId };
        },
        [hostCtx, wsSnapshot],
      );

      const askAbout = React.useCallback(
        async (file, quote) => {
          const item = allCases.find((c) => c.caseDir && String(file.path).startsWith(c.caseDir));
          const presetAvailable = ((state.data && state.data.presets) || []).map((p) => p.id);
          const presetId = presetAvailable.includes(PRESET) ? PRESET : presetAvailable.includes('lawyer-mode') ? 'lawyer-mode' : '';
          const target = item || { title: file.name, caseDir: '' };
          const { ui, workspaceId, error } = await ensureWorkspace(item ? item.caseDir : file.path.replace(/\/[^/]+$/, ''));
          if (error) {
            flash(error);
            return;
          }
          const prompt = `【材料摘录】\n案件：${target.title}\n文件：${file.name}\n\n> ${String(quote).split('\n').join('\n> ')}\n\n请结合本案材料分析这段内容。`;
          const svc2 = (name) => {
            try {
              return typeof hostCtx.get === 'function' ? hostCtx.get(name) : undefined;
            } catch {
              return undefined;
            }
          };
          const sessions = svc2('sessions');
          try {
            let sid = '';
            if (sessions && typeof sessions.create === 'function') {
              try {
                sid = await sessions.create({ workspaceId, cwd: item ? item.caseDir : undefined, agentPreset: presetId || undefined });
              } catch {
                // 预设装配失败时退回默认模式，不阻断提问
                sid = await sessions.create({ workspaceId, cwd: item ? item.caseDir : undefined });
              }
            } else if (typeof ui.connectWorkspace === 'function') {
              sid = await ui.connectWorkspace(workspaceId, presetId ? { agentPreset: presetId } : undefined);
            }
            if (sid) {
              ui.openSession(sid);
              if (item) await mutate('bindSession', { dir: item.caseDir, sessionId: sid });
              const binding = typeof sessions.binding === 'function' ? sessions.binding(sid) : undefined;
              if (binding && binding.session && typeof binding.session.prompt === 'function') {
                await binding.session.prompt([{ type: 'text', text: prompt }], 'queue');
              } else {
                navigator.clipboard?.writeText(prompt);
                flash('摘录已复制到剪贴板，请粘贴到对话');
              }
            } else {
              ui.startSession(workspaceId, { prompt });
            }
          } catch (e) {
            try {
              navigator.clipboard?.writeText(prompt);
            } catch {
              /* ignore */
            }
            flash(`自动发送失败，摘录已复制：${e && e.message ? e.message : e}`);
          }
        },
        [allCases, ensureWorkspace, flash, state.data],
      );

      const collectPageRefs = React.useCallback(
        async (file) => {
          const item = allCases.find((c) => c.caseDir && String(file.path).startsWith(c.caseDir));
          if (!item || !item.sessionId) return [];
          const sessions = readService(hostCtx, 'sessions');
          if (!sessions || typeof sessions.using !== 'function') return [];
          try {
            return await sessions.using(item.sessionId, { source: 'controllerOperation' }, async (ref) => {
              const win = ref.binding.eventSource.getSnapshot();
              return extractPageRefs(win && win.entries);
            });
          } catch {
            return [];
          }
        },
        [allCases, hostCtx],
      );

      const bindPreviewSession = React.useCallback(
        async (dir, sid) => {
          if (!dir || !sid) return;
          await mutate('bindSession', { dir, sessionId: sid });
        },
        [mutate],
      );

      const openPreview = React.useCallback(
        (f) => {
          const c = allCases.find((x) => x.caseDir && String(f.path).startsWith(x.caseDir));
          setPreview({
            ...f,
            caseDir: (c && c.caseDir) || '',
            sessionId: (c && c.sessionId) || '',
            caseTitle: (c && c.title) || '',
            presetIds: ((state.data && state.data.presets) || []).map((x) => x && x.id).filter(Boolean),
          });
        },
        [allCases, state.data],
      );

      const reveal = React.useCallback(async (filePath) => {
        try {
          const r = await fetch(`${API}/reveal`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ path: filePath }),
          });
          const body = await r.json();
          if (!body.ok) flash(body.error || '打开失败');
        } catch (e) {
          flash(String(e && e.message ? e.message : e));
        }
      }, [flash]);

      const openChat = React.useCallback(
        async (item, fresh) => {
          const dir = item && item.caseDir;
          if (!dir) {
            flash('这个案件还没有关联目录');
            return;
          }
          const svc = (name) => {
            try {
              return typeof hostCtx.get === 'function' ? hostCtx.get(name) : undefined;
            } catch {
              return undefined;
            }
          };
          const ui = svc('uiWorkspace');
          const wss = svc('workspaces');
          if (!ui) {
            flash('宿主没有暴露 uiWorkspace，无法打开会话');
            return;
          }
          try {
            if (!fresh && item.sessionId) {
              ui.openSession(item.sessionId);
              return;
            }
            const available = ((state.data && state.data.presets) || []).map((p) => p.id);
            const presetId = available.includes(PRESET)
              ? PRESET
              : available.includes('lawyer-mode')
                ? 'lawyer-mode'
                : '';
            let workspaceId = findWorkspaceId(wsSnapshot, dir);
            if (!workspaceId && wss && typeof wss.create === 'function') {
              const view = await wss.create({ path: dir });
              workspaceId = view && (view.id || view.workspaceId);
            }
            if (!workspaceId) {
              flash('没能为这个目录建立工作区');
              return;
            }
            // 优先自己建会话（可指定预设），再选中它；会话服务不可用时退回 openWorkspace。
            const sessions = svc('sessions');

            if (fresh && sessions && typeof sessions.create === 'function') {
              let created = '';
              try {
                created = await sessions.create({ workspaceId, cwd: dir, agentPreset: presetId || undefined });
              } catch {
                created = await sessions.create({ workspaceId, cwd: dir });
              }
              if (created) {
                await mutate('bindSession', { dir, sessionId: created });
                ui.openSession(created);
                return;
              }
            }
            if (typeof ui.connectWorkspace === 'function' && presetId) {
              try {
                const sid = await ui.connectWorkspace(workspaceId, { agentPreset: presetId });
                if (sid) {
                  await mutate('bindSession', { dir, sessionId: sid });
                  ui.openSession(sid);
                  return;
                }
              } catch {
                /* 落到 openWorkspace */
              }
            }
            if (!presetId) {
              await ui.openWorkspace(workspaceId);
              flash('没有找到法律模式预设，已用默认模式打开');
              return;
            }
            try {
              await ui.openWorkspace(workspaceId, undefined, { agentPreset: presetId });
            } catch (err) {
              if (/preset/i.test(String(err && err.message))) {
                await ui.openWorkspace(workspaceId);
                flash(`预设「${presetId}」不可用，已用默认模式打开`);
              } else {
                throw err;
              }
            }
          } catch (e) {
            flash(`打开会话失败：${e && e.message ? e.message : e}`);
          }
        },
        [flash, hostCtx, wsSnapshot, state.data],
      );

      return h(
        'div',
        { className: `lw-root ${compact ? 'lw-compact' : ''}` },
        h('style', null, CSS),
        h(
          'div',
          { className: 'lw-head' },
          h('div', null, h('h1', { className: 'lw-title' }, '律师工作台'), h('div', { className: 'lw-sub' }, '中国法实务 · 案件 / 期限 / 证据 / 文书 / 材料')),
          h('span', { className: 'lw-spacer' }),
          h('button', { className: 'lw-btn lw-btn-primary', onClick: () => setCreating(true), disabled: busy }, '＋ 新建案件'),
          h('button', { className: 'lw-btn', onClick: () => load(true), disabled: state.loading }, state.loading ? '刷新中…' : '刷新'),
        ),
        data ? h(SourceBar, { sources: data.sources }) : null,
        h(
          'div',
          { className: 'lw-toolbar' },
          h('input', {
            className: 'lw-input lw-search',
            placeholder: '搜索案件、案号、当事人…',
            value: query,
            onChange: (e) => setQuery(e.target.value),
          }),
          h(
            'div',
            { className: 'lw-chips' },
            h('button', { className: `lw-chip ${stageFilter === '' ? 'on' : ''}`, onClick: () => setStageFilter('') }, `全部 ${allCases.length}`),
            stages.map((s) =>
              h(
                'button',
                { key: s, className: `lw-chip ${stageFilter === s ? 'on' : ''}`, onClick: () => setStageFilter(stageFilter === s ? '' : s) },
                `${s} ${allCases.filter((c) => c.stage === s).length}`,
              ),
            ),
            quick
              ? h(
                  'button',
                  { className: 'lw-chip on', onClick: () => setQuick(''), title: '清除筛选' },
                  `${QUICK_LABEL[quick] || quick} ${cases.length} ✕`,
                )
              : null,
          ),
          h('span', { className: 'lw-spacer' }),
          data && data.archived && data.archived.length
            ? h('button', { className: 'lw-chip', onClick: () => setArchiveOpen(true), title: '已从工作台移除的案件，可恢复' }, `已归档 ${data.archived.length}`)
            : null,
          h(
            'div',
            { className: 'lw-seg' },
            h('button', { className: view === 'home' ? 'on' : '', onClick: () => setView('home') }, '首页'),
            h('button', { className: view === 'board' ? 'on' : '', onClick: () => setView('board') }, '看板'),
            h('button', { className: view === 'table' ? 'on' : '', onClick: () => setView('table') }, '表格'),
            h('button', { className: view === 'search' ? 'on' : '', onClick: () => setView('search') }, '检索'),
          ),
        ),
        state.error ? h('div', { className: 'lw-empty' }, `读取失败：${state.error}`, h('button', { className: 'lw-btn', onClick: () => load(true) }, '重试')) : null,
        !data && !state.error ? h('div', { className: 'lw-empty' }, '正在读取本机案件数据…') : null,
        data && allCases.length === 0
          ? h(
              'div',
              { className: 'lw-empty' },
              h('div', null, '还没有案件'),
              h('div', { className: 'lw-sub' }, '点「＋ 新建案件」开始录入；工作台会为它建好案件目录'),
              h('button', { className: 'lw-btn lw-btn-primary', onClick: () => setCreating(true) }, '＋ 新建案件'),
            )
          : null,
        data && allCases.length > 0 && view === 'home'
          ? h(HomeView, {
              data,
              quick,
              onOpen: openCase,
              onStage: (st) => { setStageFilter(st); setQuick(''); setView('board'); },
              onQuick: (k) => { setQuick(k); setStageFilter(''); setView('board'); },
            })
          : null,
        data && allCases.length > 0 && view === 'board'
          ? h(
              'div',
              { className: 'lw-body' },
              h(
                'div',
                { className: 'lw-board' },
                stages.map((stage) => {
                  const list = cases.filter((c) => c.stage === stage);
                  return h(
                    'div',
                    { key: stage, className: 'lw-col' },
                    h('div', { className: 'lw-col-head' }, h('span', { className: 'lw-col-name' }, stage), h('span', { className: 'lw-col-count' }, String(list.length))),
                    list.length === 0
                      ? h('div', { className: 'lw-dim', style: { padding: '4px 2px 8px' } }, STAGE_HINT[stage] || '')
                      : list.map((c) => h(CaseCard, { key: c.id, item: c, onOpen: () => openCase(c.id) })),
                  );
                }),
              ),
            )
          : null,
        data && allCases.length > 0 && view === 'table'
          ? h('div', { className: 'lw-body' }, h(CaseTable, { cases, onOpen: openCase }))
          : null,
        data && view === 'search' ? h(SearchView, { flash, onOpenFile: (f) => setPreview(f) }) : null,
        current ? h(CaseDrawer, { key: current.id, item: current, onClose: () => setActive(null), mutate, busy, flash, stages, openChat, hostCtx, onPreview: openPreview, onReveal: reveal }) : null,
        preview ? h(FileReader, { file: preview, onClose: () => setPreview(null), onReveal: reveal, flash, onAsk: askAbout, onRefs: collectPageRefs, hostCtx, onSession: bindPreviewSession }) : null,
        creating ? h(CreateCaseModal, { onClose: () => setCreating(false), mutate, busy, stages, hostCtx }) : null,
        archiveOpen && data && data.archived ? h(ArchiveModal, { items: data.archived, busy, onClose: () => setArchiveOpen(false), mutate, flash }) : null,
        toast ? h('div', { className: 'lw-toast' }, toast) : null,
        h(
          'div',
          { className: 'lw-foot' },
          h('span', null, data ? `快照 ${fmtTime(data.generatedAt)}` : '—'),
          data ? h('span', null, `· ${data.aggregate.caseCount} 案件 · ${data.aggregate.overdue} 逾期 · ${data.aggregate.fileCount} 材料`) : null,
          h('span', { className: 'lw-spacer' }),
          h('span', null, '数据仅存本机'),
        ),
      );
    }

    // ── 首页 ────────────────────────────────────────────────────────────────
    function HomeView(props) {
      const { data, onOpen } = props;
      const a = data.aggregate;
      const [day, setDay] = React.useState(null);

      const kpis = [
        { key: 'active', label: '在办案件', value: a.activeCount, tone: '' },
        { key: 'overdue', label: '已逾期', value: a.overdue, tone: a.overdue ? 'danger' : '' },
        { key: 'dueSoon', label: '7 日内', value: a.dueSoon, tone: a.dueSoon ? 'warn' : '' },
        { key: 'withFiles', label: '材料文件', value: a.fileCount, tone: '' },
        { key: 'withClaims', label: '主张', value: a.claimCount, tone: '' },
        { key: 'withMinutes', label: '纪要', value: a.minuteCount, tone: '' },
      ];
      const todo = day ? (a.week.find((d) => d.date === day) || { items: [] }).items : a.upcoming;

      return h(
        'div',
        { className: 'lw-body' },
        h(
          'div',
          { className: 'lw-kpis' },
          kpis.map((k) =>
            h(
              'button',
              {
                key: k.key,
                className: `lw-kpi ${k.tone} ${props.quick === k.key ? 'on' : ''}`,
                title: `点击查看${k.label} ${k.value}`,
                onClick: () => props.onQuick && props.onQuick(props.quick === k.key ? '' : k.key),
              },
              h('b', null, String(k.value)),
              h('span', null, k.label),
            ),
          ),
        ),
        h(
          'div',
          { className: 'lw-sec' },
          h('div', { className: 'lw-sec-head' }, h('span', { className: 'lw-sec-title' }, '本周排期'), h('span', { className: 'lw-sec-hint' }, '点日期看当天事项')),
          h(
            'div',
            { className: 'lw-week' },
            (a.week || []).map((d) => {
              const dt = new Date(`${d.date}T00:00:00`);
              return h(
                'button',
                { key: d.date, className: `lw-day ${d.offset === 0 ? 'today' : ''} ${day === d.date ? 'on' : ''}`, onClick: () => setDay(day === d.date ? null : d.date) },
                h('div', { className: 'lw-day-head' }, h('span', { className: 'lw-day-wd' }, d.offset === 0 ? '今天' : WEEKDAY[dt.getDay()]), h('span', { className: 'lw-day-date' }, d.date.slice(5)), h('span', { className: 'lw-day-n' }, d.count ? String(d.count) : '')),
                d.items.slice(0, 2).map((it, i) => h('span', { key: i, className: `lw-day-item ${dueClass(it.daysLeft)}` }, it.title)),
              );
            }),
          ),
        ),
        h(
          'div',
          { className: 'lw-grid2c' },
          h(
            'div',
            { className: 'lw-sec' },
            h('div', { className: 'lw-sec-head' }, h('span', { className: 'lw-sec-title' }, day ? `${day} 的事项` : '待办与临期'), h('span', { className: 'lw-sec-hint' }, day ? '再点一次日期返回全部' : '按紧迫程度排序')),
            h(
              'div',
              { className: 'lw-list' },
              todo.length === 0
                ? h('div', { className: 'lw-dim', style: { padding: '12px' } }, '没有待办事项')
                : todo.map((t, i) =>
                    h(
                      'button',
                      { key: i, className: 'lw-row', onClick: () => findCase(data.cases, t.caseTitle) && onOpen(findCase(data.cases, t.caseTitle).id) },
                      h('div', { className: 'lw-row-main' }, h('div', { className: 'lw-row-title' }, t.title), h('div', { className: 'lw-row-sub' }, `${t.caseTitle} · ${t.dueDate || '未定'}`)),
                      h('span', { className: `lw-pill ${dueClass(t.daysLeft)}` }, t.daysLeft === null ? '未定' : t.daysLeft < 0 ? `逾期 ${Math.abs(t.daysLeft)} 天` : `${t.daysLeft} 天`),
                    ),
                  ),
            ),
          ),
          h(
            'div',
            { className: 'lw-sec' },
            h('div', { className: 'lw-sec-head' }, h('span', { className: 'lw-sec-title' }, '最近材料'), h('span', { className: 'lw-sec-hint' }, '按修改时间')),
            h(
              'div',
              { className: 'lw-list' },
              (a.recent || []).length === 0
                ? h('div', { className: 'lw-dim', style: { padding: '12px' } }, '案件目录里还没有材料')
                : a.recent.map((f, i) =>
                    h(
                      'button',
                      { key: i, className: 'lw-row', onClick: () => findCase(data.cases, f.caseTitle) && onOpen(findCase(data.cases, f.caseTitle).id) },
                      h('div', { className: 'lw-row-main' }, h('div', { className: 'lw-row-title' }, f.name), h('div', { className: 'lw-row-sub' }, `${f.caseTitle} · ${f.kind} · ${fmtTime(f.mtime)}`)),
                      h('span', { className: 'lw-pill' }, (f.name.split('.').pop() || '').toUpperCase()),
                    ),
                  ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'lw-sec' },
          h('div', { className: 'lw-sec-head' }, h('span', { className: 'lw-sec-title' }, '案件概览'), h('span', { className: 'lw-sec-hint' }, '按阶段分布')),
          h(
            'div',
            { className: 'lw-chips' },
            (a.board || []).map((b) =>
              h('button', { key: b.stage, className: 'lw-chip', onClick: () => props.onStage && props.onStage(b.stage) }, `${b.stage} ${b.count}`),
            ),
          ),
        ),
      );
    }

    /** 在工作区快照里按绝对路径找 workspaceId（快照结构不固定，做一次深度扫描）。 */
    function readService(hostCtx, name) {
      try {
        return typeof hostCtx.get === 'function' ? hostCtx.get(name) : undefined;
      } catch {
        return undefined;
      }
    }

    /** 为某个目录准备一个工作区（优先复用已有），供「打开对话」和阅读器内嵌对话共用。 */
    async function ensureWorkspaceFor(hostCtx, dir) {
      const ui = readService(hostCtx, 'uiWorkspace');
      const wss = readService(hostCtx, 'workspaces');
      if (!ui) return { error: '宿主没有暴露 uiWorkspace，无法打开会话' };
      let workspaceId = '';
      try {
        const snap = wss && typeof wss.getSnapshot === 'function' ? wss.getSnapshot() : undefined;
        workspaceId = findWorkspaceId(snap, dir);
      } catch {
        workspaceId = '';
      }
      if (!workspaceId && wss && typeof wss.create === 'function') {
        const view = await wss.create({ path: dir });
        workspaceId = view && (view.id || view.workspaceId);
      }
      if (!workspaceId) return { error: '没能为这个目录建立工作区' };
      return { ui, workspaceId };
    }

    function findWorkspaceId(snapshot, path) {
      if (!snapshot || !path) return '';
      const seen = new Set();
      let found = '';
      const walk = (node, depth) => {
        if (found || !node || typeof node !== 'object' || depth > 6) return;
        if (seen.has(node)) return;
        seen.add(node);
        if (Array.isArray(node)) {
          for (const item of node) walk(item, depth + 1);
          return;
        }
        if (typeof node.path === 'string' && node.path === path) {
          const id = node.id || node.workspaceId;
          if (typeof id === 'string') found = id;
        }
        for (const key of Object.keys(node)) walk(node[key], depth + 1);
      };
      try {
        walk(snapshot, 0);
      } catch {
        /* 快照结构变化时忽略 */
      }
      return found;
    }

    function findCase(cases, title) {
      return cases.find((c) => c.title === title) || null;
    }

    /** 已归档案件：查看与恢复（恢复会把目录重新登记成可编辑案件）。 */
    function ArchiveModal(props) {
      const { items, busy, onClose, mutate, flash } = props;
      return h(
        'div',
        { className: 'lw-overlay', onClick: (e) => e.target === e.currentTarget && onClose() },
        h(
          'div',
          { className: 'lw-modal', role: 'dialog', 'aria-modal': 'true', style: { width: 'min(620px,92%)' } },
          h('div', { className: 'lw-modal-head' }, h('div', { className: 'lw-modal-title' }, `已归档 ${items.length}`), h('button', { className: 'lw-close', onClick: onClose, 'aria-label': '关闭' }, '×')),
          h(
            'div',
            { className: 'lw-modal-body' },
            items.length === 0
              ? h('div', { className: 'lw-dim' }, '没有已归档的案件')
              : items.map((it) =>
                  h(
                    'div',
                    { key: it.dir, className: 'lw-item' },
                    h(
                      'div',
                      { className: 'lw-item-main' },
                      h('div', { className: 'lw-item-title' }, it.title),
                      h('div', { className: 'lw-item-sub' }, it.dir),
                    ),
                    h(
                      'button',
                      {
                        className: 'lw-btn lw-btn-sm',
                        disabled: busy,
                        onClick: async () => {
                          const ok = await mutate('restoreCase', { dir: it.dir });
                          if (ok) flash('已恢复');
                        },
                      },
                      '恢复',
                    ),
                  ),
                ),
            h('div', { className: 'lw-dim' }, '恢复不会移动文件；只是把目录重新登记进工作台。'),
          ),
          h('div', { className: 'lw-modal-foot' }, h('button', { className: 'lw-btn', onClick: onClose }, '关闭')),
        ),
      );
    }

    function SourceBar(props) {
      return h(
        'div',
        { className: 'lw-banner' },
        h('span', null, '数据源'),
        props.sources.map((s) =>
          h(
            'span',
            { key: s.id, title: `${s.path}${s.note ? ' · ' + s.note : ''}`, style: { display: 'inline-flex', alignItems: 'center', gap: 5 } },
            h('i', { className: `lw-dot ${s.ok ? 'ok' : 'off'}` }),
            `${s.label} ${s.ok ? s.count : '未同步'}`,
          ),
        ),
        h('span', { className: 'lw-spacer' }),
        h('span', { className: 'lw-dim' }, '外部数据只读 · 本工作台记录可写'),
      );
    }

    function CaseCard(props) {
      const { item, onOpen } = props;
      const w = worstDeadline(item);
      return h(
        'button',
        { className: 'lw-card', onClick: onOpen },
        h('div', { className: 'lw-card-title' }, item.title),
        item.caseNumber ? h('div', { className: 'lw-card-no' }, item.caseNumber) : null,
        w ? h('div', { className: 'lw-card-row' }, h('span', { className: `lw-pill ${dueClass(w.daysLeft)}` }, dueText(w))) : null,
        h(
          'div',
          { className: 'lw-card-meta' },
          h('span', null, item.parties.length ? item.parties.map((p) => p.name).join('、') : item.court || '未填写当事人'),
          h('span', { className: 'lw-spacer' }),
          item.fileCount ? h('span', null, `${item.fileCount} 材料`) : null,
        ),
      );
    }

    function CaseTable(props) {
      return h(
        'div',
        { className: 'lw-table-wrap' },
        h(
          'table',
          { className: 'lw-table' },
          h('thead', null, h('tr', null, h('th', null, '案件'), h('th', null, '案号'), h('th', null, '阶段'), h('th', null, '最近期限'), h('th', null, '主张'), h('th', null, '证据'), h('th', null, '文书'), h('th', null, '材料'))),
          h(
            'tbody',
            null,
            props.cases.map((c) => {
              const w = worstDeadline(c);
              return h(
                'tr',
                { key: c.id, onClick: () => props.onOpen(c.id) },
                h('td', null, c.title),
                h('td', { className: 'lw-num' }, c.caseNumber || '—'),
                h('td', null, h('span', { className: 'lw-pill accent' }, c.stage)),
                h('td', null, w ? h('span', { className: `lw-pill ${dueClass(w.daysLeft)}` }, dueText(w)) : h('span', { className: 'lw-dim' }, '—')),
                h('td', { className: 'lw-num' }, String(c.claims.length)),
                h('td', { className: 'lw-num' }, String(c.evidence.length)),
                h('td', { className: 'lw-num' }, String(c.documents.length)),
                h('td', { className: 'lw-num' }, String(c.fileCount)),
              );
            }),
          ),
        ),
      );
    }
