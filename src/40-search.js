    function CreateCaseModal(props) {
      const { onClose, mutate, busy, stages, hostCtx } = props;
      const [more, setMore] = React.useState(false);
      const [form, setForm] = React.useState({ title: '', dir: '', caseNumber: '', court: '', caseType: '民事', stage: '待接案', summary: '', partiesText: '' });
      const [browsing, setBrowsing] = React.useState(false);
      // 默认走应用内目录浏览器：系统对话框在部分环境打不开，且失败时没有反馈。
      const pickDir = () => setBrowsing(true);
      const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
      const submit = async () => {
        const parties = form.partiesText
          .split(/[、,，\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name, role: '' }));
        const ok = await mutate('createCase', { ...form, parties });
        if (ok) onClose();
      };
      return h(
        'div',
        { className: 'lw-overlay', onClick: (e) => e.target === e.currentTarget && onClose() },
        h(
          'div',
          { className: 'lw-modal', role: 'dialog', 'aria-modal': 'true' },
          browsing
            ? h(DirBrowser, {
                hostCtx,
                onClose: () => setBrowsing(false),
                onPick: (pick) => {
                  const nm = pick.split('/').filter(Boolean).pop() || '';
                  setForm((f) => ({ ...f, dir: pick, title: f.title || nm }));
                  setBrowsing(false);
                },
              })
            : null,
          h('div', { className: 'lw-modal-head' }, h('div', { className: 'lw-modal-title' }, '新建案件'), h('button', { className: 'lw-close', onClick: onClose, 'aria-label': '关闭' }, '×')),
          h(
            'div',
            { className: 'lw-modal-body' },
            h(
              'div',
              { className: 'lw-field' },
              h('label', { className: 'lw-label' }, '案件名称 ', h('span', { className: 'lw-required' }, '*')),
              h('input', { className: 'lw-input', autoFocus: true, placeholder: '如「张三诉李四民间借贷纠纷」', value: form.title, onChange: set('title') }),
              h('div', { className: 'lw-dim' }, '只填名称就能建案，其余信息随时在案件里补。'),
            ),
            h(
              'div',
              { className: 'lw-field' },
              h('label', { className: 'lw-label' }, '案件目录'),
              h(
                'div',
                { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                h('input', { className: 'lw-input', placeholder: '留空则在 ~/Law/Cases 下新建；也可选已有文件夹', value: form.dir, onChange: (e) => setForm({ ...form, dir: e.target.value }) }),
                h('button', { className: 'lw-btn lw-btn-sm', type: 'button', onClick: pickDir, style: { flex: 'none' } }, '选择…'),
              ),
            ),
            h('button', { className: 'lw-more', onClick: () => setMore(!more) }, more ? '收起更多信息 ▴' : '更多信息（可稍后补）▾'),
            more
              ? h(
                  React.Fragment,
                  null,
                  h(
                    'div',
                    { className: 'lw-grid2' },
                    h('div', { className: 'lw-field' }, h('label', { className: 'lw-label' }, '案号'), h('input', { className: 'lw-input', placeholder: '(2026)沪0113民初1234号', value: form.caseNumber, onChange: set('caseNumber') })),
                    h('div', { className: 'lw-field' }, h('label', { className: 'lw-label' }, '受理法院'), h('input', { className: 'lw-input', placeholder: '上海市宝山区人民法院', value: form.court, onChange: set('court') })),
                  ),
                  h(
                    'div',
                    { className: 'lw-grid2' },
                    h(
                      'div',
                      { className: 'lw-field' },
                      h('label', { className: 'lw-label' }, '案件类型'),
                      h('select', { className: 'lw-select', value: form.caseType, onChange: set('caseType') }, ['民事', '刑事', '行政', '仲裁', '非诉', '其他'].map((t) => h('option', { key: t, value: t }, t))),
                    ),
                    h(
                      'div',
                      { className: 'lw-field' },
                      h('label', { className: 'lw-label' }, '阶段'),
                      h('select', { className: 'lw-select', value: form.stage, onChange: set('stage') }, stages.map((s) => h('option', { key: s, value: s }, s))),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'lw-field' },
                    h('label', { className: 'lw-label' }, '当事人'),
                    h('input', { className: 'lw-input', placeholder: '多个用顿号分隔，如「张三、李四」', value: form.partiesText, onChange: set('partiesText') }),
                  ),
                  h('div', { className: 'lw-field' }, h('label', { className: 'lw-label' }, '案情摘要'), h('textarea', { className: 'lw-textarea', placeholder: '简要事实与诉求', value: form.summary, onChange: set('summary') })),
                )
              : null,
            h('div', { className: 'lw-dim' }, '提交后会在 ~/Law/Cases 下创建案件目录（文书 / 证据 / 检索 / 预演）。'),
          ),
          h(
            'div',
            { className: 'lw-modal-foot' },
            h('button', { className: 'lw-btn', onClick: onClose }, '取消'),
            h('button', { className: 'lw-btn lw-btn-primary', disabled: busy || !form.title.trim(), onClick: submit }, busy ? '创建中…' : '创建案件'),
          ),
        ),
      );
    }


    // ── 材料阅读器 ──────────────────────────────────────────────────────────
    function renderInline(text, keyBase) {
      // 只处理 **粗体** 与 `代码`，其余原样输出
      const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) return h('strong', { key: `${keyBase}-b${i}` }, p.slice(2, -2));
        if (/^`[^`]+`$/.test(p)) return h('code', { key: `${keyBase}-c${i}` }, p.slice(1, -1));
        return p;
      });
    }

    function renderMarkdown(text) {
      const lines = String(text || '').split('\n');
      const out = [];
      let list = null;
      let code = null;
      let table = null;
      const flushList = () => {
        if (!list) return;
        out.push(
          h(
            list.ordered ? 'ol' : 'ul',
            { key: `l${out.length}` },
            list.items.map((it, i) => h('li', { key: i }, renderInline(it, `li${out.length}-${i}`))),
          ),
        );
        list = null;
      };
      const flushTable = () => {
        if (!table) return;
        const rows = table.rows;
        const header = table.hasHeader ? rows[0] : null;
        const body = table.hasHeader ? rows.slice(1) : rows;
        const cell = (text2, tag, key) => h(tag, { key }, renderInline(text2.trim(), key));
        out.push(
          h(
            'div',
            { key: `tw${out.length}`, className: 'lw-table-scroll' },
            h(
              'table',
              { className: 'lw-md-table' },
              header ? h('thead', null, h('tr', null, header.map((c, i) => cell(c, 'th', `th${i}`)))) : null,
              h('tbody', null, body.map((r, ri) => h('tr', { key: ri }, r.map((c, ci) => cell(c, 'td', `td${ri}-${ci}`))))),
            ),
          ),
        );
        table = null;
      };
      const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
      const isSeparator = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);
      const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');

      for (const line of lines) {
        if (/^\s*```/.test(line)) {
          if (code) {
            out.push(h('pre', { key: `p${out.length}` }, h('code', null, code.join('\n'))));
            code = null;
          } else {
            flushList();
            flushTable();
            code = [];
          }
          continue;
        }
        if (code) {
          code.push(line);
          continue;
        }
        if (isTableRow(line)) {
          flushList();
          if (!table) table = { rows: [splitRow(line)], hasHeader: false };
          else if (isSeparator(line) && table.rows.length === 1) table.hasHeader = true;
          else table.rows.push(splitRow(line));
          continue;
        }
        flushTable();
        const heading = /^(#{1,4})\s+(.*)$/.exec(line);
        if (heading) {
          flushList();
          const level = Math.min(heading[1].length, 4);
          out.push(h(`h${level + 2}`, { key: `h${out.length}` }, renderInline(heading[2], `h${out.length}`)));
          continue;
        }
        if (/^\s*([-*+])\s+/.test(line)) {
          if (!list || list.ordered) {
            flushList();
            list = { ordered: false, items: [] };
          }
          list.items.push(line.replace(/^\s*([-*+])\s+/, ''));
          continue;
        }
        if (/^\s*\d+\.\s+/.test(line)) {
          if (!list || !list.ordered) {
            flushList();
            list = { ordered: true, items: [] };
          }
          list.items.push(line.replace(/^\s*\d+\.\s+/, ''));
          continue;
        }
        if (/^\s*>\s?/.test(line)) {
          flushList();
          out.push(h('blockquote', { key: `q${out.length}` }, renderInline(line.replace(/^\s*>\s?/, ''), `q${out.length}`)));
          continue;
        }
        if (/^\s*---+\s*$/.test(line)) {
          flushList();
          out.push(h('hr', { key: `r${out.length}` }));
          continue;
        }
        if (!line.trim()) {
          flushList();
          continue;
        }
        flushList();
        out.push(h('p', { key: `t${out.length}` }, renderInline(line, `t${out.length}`)));
      }
      flushList();
      flushTable();
      if (code) out.push(h('pre', { key: `p${out.length}` }, h('code', null, code.join('\n'))));
      return out;
    }
