    function CaseDrawer(props) {
      const { item, onClose, mutate, busy, flash, stages, openChat, onPreview, onReveal } = props;
      const [tab, setTab] = React.useState('overview');
      const writable = Boolean(item.writable);
      const tabs = [
        ['overview', '概览'],
        ['deadlines', `期限 ${item.deadlines.length}`],
        ['claims', `主张 ${item.claims.length}`],
        ['evidence', `证据 ${item.evidence.length}`],
        ['documents', `文书 ${item.documents.length}`],
        ['materials', `材料 ${item.fileCount}`],
        ['notes', `检索 ${item.notes.length}`],
        ['minutes', `纪要 ${item.minutes.length}`],
      ];
      return h(
        'aside',
        { className: 'lw-drawer' },
        h(
          'div',
          { className: 'lw-drawer-head' },
          h('div', { className: 'lw-drawer-title' }, h('h3', null, item.title), h('button', { className: 'lw-close', onClick: onClose, 'aria-label': '关闭' }, '×')),
          h(
            'div',
            { className: 'lw-card-row' },
            h('span', { className: 'lw-pill accent' }, item.stage),
            item.caseNumber ? h('span', { className: 'lw-card-no' }, item.caseNumber) : null,
            writable ? h('span', { className: 'lw-pill ok' }, '可编辑') : h('span', { className: 'lw-pill' }, '外部来源 · 只读'),
            item.sessionId ? h('span', { className: 'lw-pill accent' }, '已绑定会话') : null,
          ),
          h(
            'div',
            { className: 'lw-card-row' },
            h('button', { className: 'lw-btn lw-btn-primary lw-btn-sm', onClick: () => openChat && openChat(item, false) }, '打开 AI 对话'),
            h('button', { className: 'lw-btn lw-btn-sm', onClick: () => openChat && openChat(item, true) }, '新开会话'),
            writable
              ? null
              : h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-sm',
                    disabled: busy,
                    title: '把外部来源的案件纳入工作台，之后可改阶段、加期限/证据/主张/纪要',
                    onClick: async () => {
                      const ok = await mutate('adoptCase', { dir: item.caseDir, title: item.title, caseNumber: item.caseNumber, court: item.court, stage: item.stage });
                      if (ok) flash('已纳入工作台，现在可以编辑了');
                    },
                  },
                  '纳入工作台管理',
                ),
            writable
              ? h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-sm',
                    disabled: busy,
                    title: '只删除工作台记录与台账，不会删除案件文件夹',
                    onClick: async () => {
                      const ok = window.confirm(`从工作台移除「${item.title}」？\n只删工作台记录与台账，不会删除案件文件夹。`);
                      if (!ok) return;
                      const done = await mutate('removeCase', { dir: item.caseDir });
                      if (done) {
                        flash('已从工作台移除');
                        onClose && onClose();
                      }
                    },
                  },
                  '从工作台移除',
                )
              : null,
            h('span', { className: 'lw-dim' }, '工作目录 = 案件目录 · 法律模式'),
          ),
        ),
        h(
          'div',
          { className: 'lw-tabs' },
          tabs.map(([k, label]) => h('button', { key: k, className: `lw-tab ${tab === k ? 'on' : ''}`, onClick: () => setTab(k) }, label)),
        ),
        h(
          'div',
          { className: 'lw-drawer-body' },
          tab === 'overview'
            ? h(OverviewTab, { item, writable, mutate, busy, flash, stages })
            : tab === 'deadlines'
              ? h(DeadlineTab, { item, writable, mutate, busy, flash })
              : tab === 'claims'
                ? h(ClaimTab, { item, writable, mutate, busy, flash })
                : tab === 'evidence'
                  ? h(EvidenceTab, { item, writable, mutate, busy, flash })
                  : tab === 'documents'
                    ? h(DocumentList, { item })
                    : tab === 'materials'
                      ? h(MaterialList, { item, onOpen: onPreview, mutate, busy, flash, onReveal })
                      : tab === 'notes'
                        ? h(NoteTab, { item, writable, mutate, busy, flash })
                        : h(MinuteTab, { item, writable, mutate, busy, flash }),
        ),
      );
    }

    function OverviewTab(props) {
      const { item, writable, mutate, busy, flash, stages } = props;
      const [form, setForm] = React.useState({
        title: item.title || '',
        caseNumber: item.caseNumber || '',
        court: item.court || '',
        caseType: item.caseType || '民事',
        summary: item.summary || '',
        partiesText: (item.parties || []).map((p) => p.name).join('、'),
      });
      const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

      const save = async () => {
        const parties = form.partiesText
          .split(/[、,，\n]/)
          .map((one) => one.trim())
          .filter(Boolean)
          .map((name) => ({ name, role: '' }));
        const ok = await mutate('updateCase', {
          dir: item.caseDir,
          title: form.title,
          caseNumber: form.caseNumber,
          court: form.court,
          caseType: form.caseType,
          summary: form.summary,
          parties,
        });
        if (ok) flash('案件信息已保存');
      };

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'lw-section' },
          h('div', { className: 'lw-label' }, '阶段'),
          h(
            'select',
            {
              className: 'lw-select',
              value: item.stage,
              disabled: !writable || busy,
              onChange: async (e) => {
                const ok = await mutate('updateCase', { dir: item.caseDir, stage: e.target.value });
                if (ok) flash(`已移动到「${e.target.value}」`);
              },
            },
            stages.map((s2) => h('option', { key: s2, value: s2 }, s2)),
          ),
          writable ? null : h('div', { className: 'lw-dim' }, '外部来源案件的阶段不可改。'),
        ),
        h(
          'div',
          { className: 'lw-section' },
          h('div', { className: 'lw-label' }, '案件信息'),
          h('input', { className: 'lw-input', placeholder: '案件名称', value: form.title, disabled: !writable, onChange: set('title') }),
          h(
            'div',
            { className: 'lw-grid2' },
            h('input', { className: 'lw-input', placeholder: '案号', value: form.caseNumber, disabled: !writable, onChange: set('caseNumber') }),
            h('input', { className: 'lw-input', placeholder: '受理法院', value: form.court, disabled: !writable, onChange: set('court') }),
          ),
          h(
            'div',
            { className: 'lw-grid2' },
            h(
              'select',
              { className: 'lw-select', value: form.caseType, disabled: !writable, onChange: set('caseType') },
              ['民事', '刑事', '行政', '仲裁', '非诉', '其他'].map((t2) => h('option', { key: t2, value: t2 }, t2)),
            ),
            h('input', { className: 'lw-input', placeholder: '当事人（顿号分隔）', value: form.partiesText, disabled: !writable, onChange: set('partiesText') }),
          ),
        ),
        h(
          'div',
          { className: 'lw-section' },
          h('div', { className: 'lw-label' }, '案情摘要'),
          h('textarea', { className: 'lw-textarea', value: form.summary, placeholder: '简要事实与诉求', disabled: !writable, onChange: set('summary') }),
        ),
        writable
          ? h(
              'div',
              { style: { display: 'flex', justifyContent: 'flex-end' } },
              h('button', { className: 'lw-btn lw-btn-primary lw-btn-sm', disabled: busy || !form.title.trim(), onClick: save }, busy ? '保存中…' : '保存案件信息'),
            )
          : null,
        h(
          'div',
          { className: 'lw-section' },
          h('div', { className: 'lw-label' }, '案件目录'),
          h(
            'div',
            { className: 'lw-item' },
            h('div', { className: 'lw-item-main' }, h('div', { className: 'lw-item-title' }, item.caseDir || '未关联'), h('div', { className: 'lw-item-sub' }, '文书 / 证据 / 检索 / 预演')),
          ),
        ),
      );
    }

    function DeadlineTab(props) {
      const { item, writable, mutate, busy, flash } = props;
      const [form, setForm] = React.useState({ title: '', dueDate: todayISO(), basis: '' });
      const [editing, setEditing] = React.useState('');
      const [draft, setDraft] = React.useState({ dueDate: '', basis: '' });
      return h(
        React.Fragment,
        null,
        item.deadlines.length === 0
          ? h('div', { className: 'lw-dim' }, '还没有期限记录')
          : item.deadlines.map((d, i) =>
              h(
                'div',
                { key: d.id || i, className: 'lw-item' },
                h(
                  'button',
                  {
                    className: `lw-check ${d.done ? 'on' : ''}`,
                    title: d.done ? '标记为未完成' : '标记为已完成',
                    disabled: !d.writable || busy,
                    onClick: async () => {
                      const ok = await mutate('toggleItem', { kind: 'deadline', id: d.id });
                      if (ok) flash(d.done ? '已标记未完成' : '已完成');
                    },
                  },
                  '✓',
                ),
                h(
                  'div',
                  { className: 'lw-item-main' },
                  h('div', { className: 'lw-item-title', style: d.done ? { textDecoration: 'line-through', color: 'var(--ink-3)' } : null }, d.title),
                  h('div', { className: 'lw-item-sub' }, [d.dueDate || '未定', d.basis, d.origin].filter(Boolean).join(' · ')),
                ),
                h('span', { className: `lw-pill ${d.done ? 'ok' : dueClass(d.daysLeft)}` }, d.done ? '已完成' : d.daysLeft === null ? '未定期' : d.daysLeft < 0 ? `逾期 ${Math.abs(d.daysLeft)} 天` : `${d.daysLeft} 天`),
                d.writable && d.id
                  ? h(
                      'button',
                      {
                        className: 'lw-link',
                        disabled: busy,
                        title: '修改届满日与依据',
                        onClick: () => {
                          setEditing(editing === d.id ? '' : d.id);
                          setDraft({ dueDate: d.dueDate || todayISO(), basis: d.basis || '' });
                        },
                      },
                      '改期',
                    )
                  : null,
                d.writable ? h('button', { className: 'lw-del', title: '删除', disabled: busy, onClick: () => mutate('deleteItem', { kind: 'deadline', id: d.id }) }, '×') : null,
              ),
            ),
            item.deadlines.map((d, i) =>
              d.id && editing === d.id
                ? h(
                    'div',
                    { key: `edit-${d.id}`, className: 'lw-add', style: { marginLeft: 24 } },
                    h('div', { className: 'lw-label' }, `改期：${d.title}`),
                    h(
                      'div',
                      { className: 'lw-grid2' },
                      h('input', { className: 'lw-input', type: 'date', value: draft.dueDate, onChange: (e) => setDraft({ ...draft, dueDate: e.target.value }) }),
                      h('input', { className: 'lw-input', placeholder: '法律依据（可选）', value: draft.basis, onChange: (e) => setDraft({ ...draft, basis: e.target.value }) }),
                    ),
                    h(
                      'div',
                      { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
                      h('button', { className: 'lw-btn lw-btn-sm', onClick: () => setEditing('') }, '取消'),
                      h(
                        'button',
                        {
                          className: 'lw-btn lw-btn-primary lw-btn-sm',
                          disabled: busy,
                          onClick: async () => {
                            const ok = await mutate('updateItem', { id: d.id, patch: { dueDate: draft.dueDate, basis: draft.basis } });
                            if (ok) {
                              flash('已改期');
                              setEditing('');
                            }
                          },
                        },
                        '保存',
                      ),
                    ),
                  )
                : null,
            ),
        writable
          ? h(
              'div',
              { className: 'lw-add' },
              h('div', { className: 'lw-label' }, '添加期限'),
              h('input', { className: 'lw-input', placeholder: '名称，如「一审举证期限届满」', value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) }),
              h(
                'div',
                { className: 'lw-grid2' },
                h('input', { className: 'lw-input', type: 'date', value: form.dueDate, onChange: (e) => setForm({ ...form, dueDate: e.target.value }) }),
                h('input', { className: 'lw-input', placeholder: '法律依据（可选）', value: form.basis, onChange: (e) => setForm({ ...form, basis: e.target.value }) }),
              ),
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'flex-end' } },
                h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-primary lw-btn-sm',
                    disabled: busy || !form.title.trim(),
                    onClick: async () => {
                      const ok = await mutate('addItem', { kind: 'deadline', dir: item.caseDir, ...form });
                      if (ok) {
                        flash('期限已添加');
                        setForm({ title: '', dueDate: todayISO(), basis: '' });
                      }
                    },
                  },
                  '添加',
                ),
              ),
            )
          : null,
      );
    }

    function ClaimTab(props) {
      const { item, writable, mutate, busy, flash } = props;
      const [form, setForm] = React.useState({ title: '', statement: '', basisLaw: '' });
      return h(
        React.Fragment,
        null,
        item.claims.length === 0
          ? h('div', { className: 'lw-dim' }, '还没有主张记录。主张 = 请求权基础 + 事实支撑，写清「请求什么、依据哪条」。')
          : item.claims.map((c, i) =>
              h(
                'div',
                { key: c.id || i, className: 'lw-note' },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  h('strong', { style: { fontSize: '.8125rem', flex: 1 } }, c.title),
                  c.writable && c.id
                    ? h(
                        'button',
                        {
                          className: 'lw-pill accent',
                          title: '点击切换：待定 → 成立 → 不成立',
                          disabled: busy,
                          onClick: async () => {
                            const order = { 待定: '成立', 成立: '不成立', 不成立: '待定' };
                            const next = order[c.verdict] || '待定';
                            const ok = await mutate('updateItem', { id: c.id, patch: { verdict: next } });
                            if (ok) flash(`结论：${next}`);
                          },
                        },
                        c.verdict || '待定',
                      )
                    : h('span', { className: 'lw-pill' }, c.verdict || '待定'),
                  c.writable ? h('button', { className: 'lw-del', disabled: busy, onClick: () => mutate('deleteItem', { kind: 'claim', id: c.id }) }, '×') : null,
                ),
                c.statement ? h('p', null, c.statement) : null,
                c.basisLaw ? h('div', { className: 'lw-dim', style: { marginTop: 4 } }, `依据：${c.basisLaw}`) : null,
              ),
            ),
        writable
          ? h(
              'div',
              { className: 'lw-add' },
              h('div', { className: 'lw-label' }, '添加主张'),
              h('input', { className: 'lw-input', placeholder: '主张，如「请求判令被告支付货款 664,000 元」', value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) }),
              h('textarea', { className: 'lw-textarea', placeholder: '事实与理由', value: form.statement, onChange: (e) => setForm({ ...form, statement: e.target.value }) }),
              h('input', { className: 'lw-input', placeholder: '请求权基础，如《民法典》第577条、第626条', value: form.basisLaw, onChange: (e) => setForm({ ...form, basisLaw: e.target.value }) }),
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'flex-end' } },
                h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-primary lw-btn-sm',
                    disabled: busy || !form.title.trim(),
                    onClick: async () => {
                      const ok = await mutate('addItem', { kind: 'claim', dir: item.caseDir, ...form });
                      if (ok) {
                        flash('主张已添加');
                        setForm({ title: '', statement: '', basisLaw: '' });
                      }
                    },
                  },
                  '添加',
                ),
              ),
            )
          : null,
      );
    }

    function MinuteTab(props) {
      const { item, writable, mutate, busy, flash } = props;
      const [form, setForm] = React.useState({ title: '', summary: '' });
      return h(
        React.Fragment,
        null,
        item.minutes.length === 0
          ? h('div', { className: 'lw-dim' }, '还没有会话纪要')
          : item.minutes.map((m, i) =>
              h(
                'div',
                { key: m.id || i, className: 'lw-note' },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  h('strong', { style: { fontSize: '.8125rem', flex: 1 } }, m.title),
                  h('span', { className: 'lw-pill' }, fmtTime(m.at)),
                  m.writable ? h('button', { className: 'lw-del', disabled: busy, onClick: () => mutate('deleteItem', { kind: 'minute', id: m.id }) }, '×') : null,
                ),
                m.summary ? h('p', null, m.summary) : null,
              ),
            ),
        writable
          ? h(
              'div',
              { className: 'lw-add' },
              h('div', { className: 'lw-label' }, '添加纪要'),
              h('input', { className: 'lw-input', placeholder: '标题，如「5/12 与客户沟通举证方向」', value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) }),
              h('textarea', { className: 'lw-textarea', placeholder: '结论、待办、风险点', value: form.summary, onChange: (e) => setForm({ ...form, summary: e.target.value }) }),
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'flex-end' } },
                h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-primary lw-btn-sm',
                    disabled: busy || !form.title.trim(),
                    onClick: async () => {
                      const ok = await mutate('addItem', { kind: 'minute', dir: item.caseDir, ...form });
                      if (ok) {
                        flash('纪要已添加');
                        setForm({ title: '', summary: '' });
                      }
                    },
                  },
                  '添加',
                ),
              ),
            )
          : null,
      );
    }

    function EvidenceTab(props) {
      const { item, writable, mutate, busy, flash } = props;
      const [form, setForm] = React.useState({ name: '', evidenceKind: '书证', status: '待收集' });
      return h(
        React.Fragment,
        null,
        item.evidence.length === 0
          ? h('div', { className: 'lw-dim' }, '还没有证据记录')
          : item.evidence.map((e, i) =>
              h(
                'div',
                { key: e.id || i, className: 'lw-item' },
                h('div', { className: 'lw-item-main' }, h('div', { className: 'lw-item-title' }, e.name), h('div', { className: 'lw-item-sub' }, [e.kind, e.origin].filter(Boolean).join(' · '))),
                e.writable && e.id
                  ? h(
                      'button',
                      {
                        className: 'lw-pill accent',
                        title: '点击切换：待收集 → 已收集 → 已提交',
                        disabled: busy,
                        onClick: async () => {
                          const order = { 待收集: '已收集', 已收集: '已提交', 已提交: '待收集' };
                          const next = order[e.status] || '待收集';
                          const ok = await mutate('updateItem', { id: e.id, patch: { status: next } });
                          if (ok) flash(`状态：${next}`);
                        },
                      },
                      e.status || '待收集',
                    )
                  : h('span', { className: 'lw-pill' }, e.status || '—'),
                e.writable ? h('button', { className: 'lw-del', title: '删除', disabled: busy, onClick: () => mutate('deleteItem', { kind: 'evidence', id: e.id }) }, '×') : null,
              ),
            ),
        writable
          ? h(
              'div',
              { className: 'lw-add' },
              h('div', { className: 'lw-label' }, '添加证据'),
              h('input', { className: 'lw-input', placeholder: '证据名称，如「借款合同」', value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
              h(
                'div',
                { className: 'lw-grid2' },
                h(
                  'select',
                  { className: 'lw-select', value: form.evidenceKind, onChange: (e) => setForm({ ...form, evidenceKind: e.target.value }) },
                  ['书证', '物证', '电子数据', '证人证言', '鉴定意见', '勘验笔录', '视听资料'].map((k) => h('option', { key: k, value: k }, k)),
                ),
                h(
                  'select',
                  { className: 'lw-select', value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }) },
                  ['待收集', '已收集', '已提交'].map((k) => h('option', { key: k, value: k }, k)),
                ),
              ),
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'flex-end' } },
                h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-primary lw-btn-sm',
                    disabled: busy || !form.name.trim(),
                    onClick: async () => {
                      const ok = await mutate('addItem', { kind: 'evidence', dir: item.caseDir, ...form });
                      if (ok) {
                        flash('证据已添加');
                        setForm({ name: '', evidenceKind: '书证', status: '待收集' });
                      }
                    },
                  },
                  '添加',
                ),
              ),
            )
          : null,
      );
    }

    function DocumentList(props) {
      const { item } = props;
      if (!item.documents.length) return h('div', { className: 'lw-dim' }, '还没有文书记录。文书由「律师工作模式」的文书工具写入案件目录后出现在这里。');
      return item.documents.map((d, i) =>
        h(
          'div',
          { key: i, className: 'lw-item' },
          h('div', { className: 'lw-item-main' }, h('div', { className: 'lw-item-title' }, d.title), h('div', { className: 'lw-item-sub' }, [d.docType, `v${d.versions}`, d.origin].filter(Boolean).join(' · '))),
          h('span', { className: `lw-pill ${d.finalized ? 'ok' : 'warn'}` }, d.finalized ? '已定稿' : '未定稿'),
        ),
      );
    }

    function MaterialList(props) {
      const { item, onOpen, mutate, busy, flash, onReveal } = props;
      const [selected, setSelected] = React.useState([]);
      const [batchKind, setBatchKind] = React.useState('书证');
      const [batchStatus, setBatchStatus] = React.useState('待收集');

      if (!item.files.length) return h('div', { className: 'lw-dim' }, '案件目录里还没有材料');

      const picked = new Set(selected);
      const all = item.files.flatMap((g) => g.items.map((f) => f.path));
      const toggle = (path) => {
        setSelected((cur) => (cur.includes(path) ? cur.filter((one) => one !== path) : [...cur, path]));
      };
      const toggleAll = () => setSelected(selected.length === all.length ? [] : all);

      const registerEvidence = async () => {
        const rows = item.files
          .flatMap((g) => g.items)
          .filter((f) => picked.has(f.path))
          .map((f) => ({ name: f.name.replace(/\.[^.]+$/, ''), evidenceKind: batchKind, status: batchStatus }));
        if (rows.length === 0) return;
        const ok = await mutate('addItems', { kind: 'evidence', dir: item.caseDir, items: rows });
        if (ok) {
          flash(`已登记 ${rows.length} 份证据`);
          setSelected([]);
        }
      };

      const bar = selected.length
        ? h(
            'div',
            { className: 'lw-add', style: { gap: 8 } },
            h(
              'div',
              { className: 'lw-card-row' },
              h('span', { className: 'lw-label' }, `已选 ${selected.length} 个文件`),
              h('button', { className: 'lw-btn lw-btn-sm', onClick: toggleAll }, selected.length === all.length ? '取消全选' : '全选'),
              h('button', { className: 'lw-btn lw-btn-sm', onClick: () => setSelected([]) }, '清除'),
            ),
            h(
              'div',
              { className: 'lw-card-row' },
              h('span', { className: 'lw-label' }, '登记为证据：'),
              h(
                'select',
                { className: 'lw-select', style: { width: 120 }, value: batchKind, onChange: (e) => setBatchKind(e.target.value) },
                ['书证', '物证', '电子数据', '证人证言', '鉴定意见', '勘验笔录', '视听资料'].map((k) => h('option', { key: k, value: k }, k)),
              ),
              h(
                'select',
                { className: 'lw-select', style: { width: 110 }, value: batchStatus, onChange: (e) => setBatchStatus(e.target.value) },
                ['待收集', '已收集', '已提交'].map((k) => h('option', { key: k, value: k }, k)),
              ),
              h('button', { className: 'lw-btn lw-btn-primary lw-btn-sm', disabled: busy, onClick: registerEvidence }, '批量登记'),
              h(
                'button',
                {
                  className: 'lw-btn lw-btn-sm',
                  disabled: busy || !onReveal,
                  onClick: async () => {
                    for (const one of selected) await onReveal(one);
                    flash(`已在访达中定位 ${selected.length} 个文件`);
                  },
                },
                '在访达中显示',
              ),
            ),
            h('div', { className: 'lw-dim' }, '证据名称取文件名（去扩展名），类型与状态按上面选择。'),
          )
        : null;

      return h(
        React.Fragment,
        null,
        bar,
        item.files.map((g) =>
          h(
            'div',
            { key: g.kind, className: 'lw-section' },
            h('div', { className: 'lw-section-title' }, `${g.kind} · ${g.count}`),
            h(
              'div',
              { style: { border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)' } },
              g.items.map((f) =>
                h(
                  'div',
                  { key: f.path, className: 'lw-file', title: f.path, style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  h(
                    'button',
                    {
                      className: `lw-check ${picked.has(f.path) ? 'on' : ''}`,
                      'aria-label': picked.has(f.path) ? '取消选择' : '选择',
                      onClick: () => toggle(f.path),
                    },
                    '✓',
                  ),
                  h(
                    'button',
                    {
                      className: 'nm',
                      style: { background: 'transparent', border: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                      onClick: () => onOpen && onOpen({ path: f.path, name: f.name }),
                    },
                    f.name,
                  ),
                  h('span', { className: 'sz' }, fmtSize(f.size)),
                  h('button', { className: 'lw-link', onClick: () => onOpen && onOpen({ path: f.path, name: f.name }) }, '阅读 →'),
                ),
              ),
            ),
          ),
        ),
      );
    }

    function NoteTab(props) {
      const { item, writable, mutate, busy, flash } = props;
      const [form, setForm] = React.useState({ title: '', source: '', summary: '' });
      return h(
        React.Fragment,
        null,
        item.notes.length === 0
          ? h('div', { className: 'lw-dim' }, '还没有检索记录')
          : item.notes.map((n, i) =>
              h(
                'div',
                { key: n.id || i, className: 'lw-note' },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  h('strong', { style: { fontSize: '.8125rem', flex: 1 } }, n.title),
                  n.source ? h('span', { className: 'lw-pill' }, n.source) : null,
                  n.writable ? h('button', { className: 'lw-del', disabled: busy, onClick: () => mutate('deleteItem', { kind: 'note', id: n.id }) }, '×') : null,
                ),
                n.summary ? h('p', null, n.summary) : null,
              ),
            ),
        writable
          ? h(
              'div',
              { className: 'lw-add' },
              h('div', { className: 'lw-label' }, '添加检索记录'),
              h('input', { className: 'lw-input', placeholder: '标题，如「民间借贷利率上限」', value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) }),
              h(
                'select',
                { className: 'lw-select', value: form.source, onChange: (e) => setForm({ ...form, source: e.target.value }) },
                h('option', { value: '' }, '来源（可选）'),
                ['法答网', '人民法院案例库', '北大法宝', '元典', '官方网站', '其他'].map((s) => h('option', { key: s, value: s }, s)),
              ),
              h('textarea', { className: 'lw-textarea', placeholder: '结论摘要', value: form.summary, onChange: (e) => setForm({ ...form, summary: e.target.value }) }),
              h(
                'div',
                { style: { display: 'flex', justifyContent: 'flex-end' } },
                h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-primary lw-btn-sm',
                    disabled: busy || !form.title.trim(),
                    onClick: async () => {
                      const ok = await mutate('addItem', { kind: 'note', dir: item.caseDir, ...form });
                      if (ok) {
                        flash('检索记录已添加');
                        setForm({ title: '', source: '', summary: '' });
                      }
                    },
                  },
                  '添加',
                ),
              ),
            )
          : null,
      );
    }

    /** 应用内目录浏览器：不依赖系统对话框，失败也把原因显示出来。 */