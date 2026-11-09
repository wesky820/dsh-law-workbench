    function SearchView(props) {
      const { flash, onOpenFile } = props;
      const [q, setQ] = React.useState('');
      const [state, setState] = React.useState({ loading: false, hits: [], scanned: 0, ran: false, truncated: false });

      const run = React.useCallback(async () => {
        const text = q.trim();
        if (!text) return;
        setState((s2) => ({ ...s2, loading: true }));
        try {
          const r = await fetch(`${API}/search?q=${encodeURIComponent(text)}`, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
          const body = await r.json();
          if (!body.ok) throw new Error(body.error || '检索失败');
          setState({ loading: false, hits: body.hits || [], scanned: body.scanned || 0, ran: true, truncated: Boolean(body.truncated) });
        } catch (e) {
          setState({ loading: false, hits: [], scanned: 0, ran: true, truncated: false });
          flash(`检索失败：${e.message || e}`);
        }
      }, [q, flash]);

      return h(
        'div',
        { className: 'lw-body' },
        h(
          'div',
          { className: 'lw-card-row', style: { marginBottom: 12 } },
          h('input', {
            className: 'lw-input',
            style: { maxWidth: 420 },
            placeholder: '在全部案件材料里搜关键词（md / docx / pdf / txt）',
            value: q,
            onChange: (e) => setQ(e.target.value),
            onKeyDown: (e) => {
              if (e.key === 'Enter') run();
            },
          }),
          h('button', { className: 'lw-btn lw-btn-primary', onClick: run, disabled: state.loading || !q.trim() }, state.loading ? '检索中…' : '检索'),
          state.ran ? h('span', { className: 'lw-dim' }, `扫描 ${state.scanned} 个文件 · 命中 ${state.hits.length}${state.truncated ? '（已截断）' : ''}`) : null,
        ),
        h(
          'div',
          { className: 'lw-list' },
          state.hits.length === 0
            ? h('div', { className: 'lw-dim', style: { padding: 12 } }, state.ran ? '没有命中' : '输入关键词后回车或点「检索」')
            : state.hits.map((hit, i) =>
                h(
                  'button',
                  { key: i, className: 'lw-row', onClick: () => onOpenFile({ path: hit.path, name: hit.file, query: q, line: hit.line }) },
                  h(
                    'div',
                    { className: 'lw-row-main' },
                    h('div', { className: 'lw-row-title' }, `${hit.file} · 第 ${hit.line} 行`),
                    h('div', { className: 'lw-row-sub' }, `${hit.case} · ${hit.kind}`),
                    h('div', { className: 'lw-row-sub', style: { whiteSpace: 'normal' } }, hit.snippet),
                  ),
                  h('span', { className: 'lw-link' }, '打开 →'),
                ),
              ),
        ),
      );
    }

    function FileReader(props) {
      const { file, onClose, onReveal, flash, onAsk, onRefs, hostCtx } = props;
      const [chatOpen, setChatOpen] = React.useState(true);
      const [refs, setRefs] = React.useState([]);
      const [state, setState] = React.useState({ loading: true, data: null, error: '' });
      const [sel, setSel] = React.useState('');
      const [jump, setJump] = React.useState('');
      const [mode, setMode] = React.useState('image');
      const [pageState, setPageState] = React.useState({ page: 1, pageCount: 0, loading: false, dataUrl: '', error: '', words: [], pageWidth: 0, pageHeight: 0 });
      const [dpi, setDpi] = React.useState(110);
      const [layout, setLayout] = React.useState('single');
      const [cont, setCont] = React.useState({ pages: [], loading: false });
      const sentinelRef = React.useRef(null);
      const [pxPerPt, setPxPerPt] = React.useState(0);
      const bodyRef = React.useRef(null);

      React.useEffect(() => {
        let alive = true;
        fetch(`${API}/file?path=${encodeURIComponent(file.path)}`, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
          .then((r) => r.json())
          .then((d) => {
            if (!alive) return;
            if (!d.ok) setState({ loading: false, data: null, error: d.error || '读取失败' });
            else {
              setState({ loading: false, data: d, error: '' });
              if (d.format === 'paged') setPageState((s2) => ({ ...s2, pageCount: d.pageCount || 0 }));
            }
          })
          .catch((e) => alive && setState({ loading: false, data: null, error: String(e.message || e) }));
        return () => {
          alive = false;
        };
      }, [file.path]);

      const d = state.data;
      const paged = d && d.kind === 'text' && d.format === 'paged';
      const useImage = paged && mode === 'image';

      const loadPage = React.useCallback(
        async (n) => {
          const total = pageState.pageCount || (d && d.pageCount) || 1;
          const page = Math.min(Math.max(Number(n) || 1, 1), total);
          setPageState((s2) => ({ ...s2, page, loading: true, error: '' }));
          try {
            const r = await fetch(`${API}/page?path=${encodeURIComponent(file.path)}&n=${page}&dpi=${dpi}&words=1`, { credentials: 'same-origin' });
            const body = await r.json();
            if (!body.ok) throw new Error(body.error || '渲染失败');
            setPageState({
              page: body.page,
              pageCount: body.pageCount || total,
              loading: false,
              dataUrl: body.dataUrl,
              error: '',
              words: body.words || [],
              pageWidth: body.pageWidth || 0,
              pageHeight: body.pageHeight || 0,
            });
          } catch (e) {
            setPageState((s2) => ({ ...s2, loading: false, error: String(e.message || e) }));
          }
        },
        [file.path, pageState.pageCount, d, dpi],
      );

      React.useEffect(() => {
        if (useImage && !pageState.dataUrl && !pageState.loading) loadPage(1);
      }, [useImage, pageState.dataUrl, pageState.loading, loadPage]);

      const total = pageState.pageCount || (d && d.pageCount) || 0;
      const loadContPage = React.useCallback(
        async (n) => {
          if (!n || (total && n > total)) return;
          setCont((c) => ({ ...c, loading: true }));
          try {
            const r = await fetch(`${API}/page?path=${encodeURIComponent(file.path)}&n=${n}&dpi=${dpi}`, { credentials: 'same-origin' });
            const body = await r.json();
            if (body.ok) {
              setCont((c) =>
                c.pages.some((pg) => pg.n === body.page) ? { ...c, loading: false } : { pages: [...c.pages, { n: body.page, dataUrl: body.dataUrl }], loading: false },
              );
            } else {
              setCont((c) => ({ ...c, loading: false }));
            }
          } catch {
            setCont((c) => ({ ...c, loading: false }));
          }
        },
        [dpi, file.path, total],
      );

      // 进入连续模式先铺前两页
      React.useEffect(() => {
        if (layout !== 'cont' || !useImage) return;
        if (cont.pages.length === 0 && total > 0) {
          loadContPage(1);
          if (total > 1) loadContPage(2);
        }
      }, [layout, useImage, cont.pages.length, total, loadContPage]);

      // 底部哨兵：滚到就加载下一页
      React.useEffect(() => {
        if (layout !== 'cont' || !useImage) return undefined;
        const node = sentinelRef.current;
        if (!node) return undefined;
        const next = (cont.pages.length || 0) + 1;
        if (total && next > total) return undefined;
        const io = new IntersectionObserver(
          (list) => {
            if (list.some((e) => e.isIntersecting) && !cont.loading) loadContPage(next);
          },
          { root: null, rootMargin: '400px' },
        );
        io.observe(node);
        return () => io.disconnect();
      }, [layout, useImage, cont.pages.length, cont.loading, total, loadContPage]);

      React.useEffect(() => {
        if (useImage && pageState.dataUrl) loadPage(pageState.page);
        // 只在 dpi 变化时重载；pageState 变化不触发（避免循环）
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [dpi]);

      React.useEffect(() => {
        const host = bodyRef.current;
        const q = file && file.query ? String(file.query).trim() : '';
        if (!host || !q) return undefined;
        host.querySelectorAll('mark.lw-hit').forEach((m) => {
          const text = document.createTextNode(m.textContent || '');
          m.replaceWith(text);
          text.parentNode && text.parentNode.normalize();
        });
        const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) =>
            node.parentElement && node.parentElement.closest('.lw-pdf-textlayer') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        let count = 0;
        let first = null;
        for (const node of nodes) {
          if (count >= 200) break;
          const text = node.nodeValue || '';
          const at = text.toLowerCase().indexOf(q.toLowerCase());
          if (at < 0) continue;
          try {
            const rest = node.splitText(at);
            const tail = rest.splitText(q.length);
            const mark = document.createElement('mark');
            mark.className = 'lw-hit';
            rest.parentNode.insertBefore(mark, rest);
            mark.appendChild(rest);
            if (!first) first = mark;
            count += 1;
            void tail;
          } catch {
            /* 分页/重排时节点可能失效，忽略 */
          }
        }
        if (first) window.setTimeout(() => first.scrollIntoView({ block: 'center' }), 80);
        return undefined;
      }, [file.path, file.query, state.data]);

      React.useEffect(() => {
        let alive = true;
        setRefs([]);
        if (!onRefs) return undefined;
        onRefs(file)
          .then((nums) => {
            if (alive) setRefs(Array.isArray(nums) ? nums : []);
          })
          .catch(() => {
            /* 拿不到引用不影响阅读 */
          });
        return () => {
          alive = false;
        };
      }, [file.path, onRefs]);

      const captureSelection = () => {
        const host = bodyRef.current;
        if (!host) return;
        const active = window.getSelection && window.getSelection();
        if (!active || active.isCollapsed) {
          setSel('');
          return;
        }
        if (!host.contains(active.anchorNode)) return;
        const text = String(active.toString() || '').trim();
        setSel(text.length > 1200 ? text.slice(0, 1200) : text);
        const layer = host.querySelector('.lw-pdf-textlayer');
        if (layer) {
          layer.querySelectorAll('span.hl').forEach((sp) => sp.classList.remove('hl'));
          const range = active.rangeCount ? active.getRangeAt(0) : null;
          if (range) {
            layer.querySelectorAll('span').forEach((sp) => {
              try {
                if (range.intersectsNode(sp)) sp.classList.add('hl');
              } catch {
                /* 跨文档节点忽略 */
              }
            });
          }
        }
      };

      return h(
        'div',
        { className: 'lw-reader' },
        h(
          'div',
          { className: 'lw-reader-head' },
          h('button', { className: 'lw-btn lw-btn-sm', onClick: onClose }, '← 返回'),
          h('span', { className: 'lw-reader-title', title: file.path }, file.name),
          d ? h('span', { className: 'lw-dim' }, paged ? `${pageState.pageCount || d.pageCount} 页 · ${fmtSize(d.size)}` : fmtSize(d.size)) : null,
          h('span', { className: 'lw-spacer' }),
          paged
            ? h(
                'span',
                { className: 'lw-seg', style: { marginRight: 4 } },
                h('button', { className: useImage ? 'on' : '', onClick: () => setMode('image') }, '版面'),
                h('button', { className: useImage ? '' : 'on', onClick: () => setMode('text') }, '文本'),
              )
            : null,
          paged && refs.length
            ? h(
                'span',
                { className: 'lw-refs', title: 'AI 回答里提到的页码，点一下跳过去' },
                h('span', { className: 'lw-refs-label' }, '回答引用'),
                refs.map((n) =>
                  h('button', { key: n, className: `lw-chip ${pageState.page === n ? 'on' : ''}`, onClick: () => loadPage(n) }, `第 ${n} 页`),
                ),
              )
            : null,
          paged && useImage
            ? h(
                'span',
                { className: 'lw-seg', style: { marginRight: 4 } },
                h('button', { className: layout === 'single' ? 'on' : '', onClick: () => setLayout('single') }, '单页'),
                h('button', { className: layout === 'cont' ? 'on' : '', onClick: () => setLayout('cont') }, '连续'),
              )
            : null,
          paged && useImage
            ? h(
                'span',
                { className: 'lw-seg', style: { marginRight: 4 }, title: 'PDF 渲染清晰度' },
                [
                  [110, '标准'],
                  [150, '高清'],
                  [200, '超高'],
                ].map(([v, label]) => h('button', { key: v, className: dpi === v ? 'on' : '', onClick: () => setDpi(v) }, label)),
              )
            : null,
          paged
            ? h(
                'span',
                { style: { display: 'inline-flex', gap: 6, alignItems: 'center' } },
                h(
                  'button',
                  { className: 'lw-btn lw-btn-sm', disabled: (pageState.page || 1) <= 1, onClick: () => loadPage((pageState.page || 1) - 1) },
                  '‹ 上一页',
                ),
                h('input', {
                  className: 'lw-input',
                  style: { width: 76 },
                  placeholder: '页码',
                  value: jump,
                  onChange: (e) => setJump(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') loadPage(jump);
                  },
                }),
                h('button', { className: 'lw-btn lw-btn-sm', onClick: () => loadPage(jump) }, '跳转'),
                h(
                  'button',
                  {
                    className: 'lw-btn lw-btn-sm',
                    disabled: (pageState.page || 1) >= (pageState.pageCount || 1),
                    onClick: () => loadPage((pageState.page || 1) + 1),
                  },
                  '下一页 ›',
                ),
              )
            : null,
          h('button', { className: `lw-btn lw-btn-sm ${chatOpen ? 'lw-btn-primary' : ''}`, onClick: () => setChatOpen((v) => !v), title: '在右侧展开/收起对话' }, chatOpen ? '对话 ▸' : '对话'),
          h('button', { className: 'lw-btn lw-btn-sm', onClick: () => onReveal && onReveal(file.path) }, '在访达中显示'),
          h('button', { className: 'lw-btn lw-btn-sm', onClick: () => { navigator.clipboard?.writeText(file.path); flash && flash('已复制路径'); } }, '复制路径'),
        ),
        sel
          ? h(
              'div',
              { className: 'lw-selbar' },
              h('span', { className: 'lw-selbar-text' }, `已选 ${sel.length} 字`),
              h('button', { className: 'lw-btn lw-btn-primary lw-btn-sm', onClick: () => onAsk && onAsk(file, sel) }, '就这段问 AI'),
              h('button', { className: 'lw-btn lw-btn-sm', onClick: () => { navigator.clipboard?.writeText(sel); flash && flash('已复制选中内容'); } }, '复制'),
              h('button', { className: 'lw-btn lw-btn-sm', onClick: () => setSel('') }, '取消'),
            )
          : null,
        h(
          'div',
          { className: 'lw-reader-split' },
        h(
          'div',
          { className: 'lw-reader-body', ref: bodyRef, onMouseUp: captureSelection, onKeyUp: captureSelection },
          state.loading ? h('div', { className: 'lw-dim' }, '读取中…') : null,
          state.error ? h('div', { className: 'lw-dim', style: { color: 'var(--danger-ink)' } }, state.error) : null,
          d && d.kind === 'text' && d.format === 'markdown' ? h('div', { className: 'lw-prose' }, renderMarkdown(d.text)) : null,
          d && d.kind === 'text' && d.format === 'plain' ? h('pre', { className: 'lw-plain' }, d.text) : null,
          useImage && layout === 'cont'
            ? h(
                'div',
                { className: 'lw-pdf-cont' },
                cont.pages
                  .slice()
                  .sort((a, b) => a.n - b.n)
                  .map((pg) =>
                    h(
                      'section',
                      { key: pg.n, className: 'lw-page' },
                      h('div', { className: 'lw-page-label' }, `第 ${pg.n} 页`),
                      h('img', { className: 'lw-pdf-page', src: pg.dataUrl, alt: `第 ${pg.n} 页` }),
                    ),
                  ),
                total && cont.pages.length < total
                  ? h('div', { ref: sentinelRef, className: 'lw-dim', style: { padding: '16px 0' } }, cont.loading ? '加载中…' : '继续下滑加载')
                  : h('div', { className: 'lw-dim', style: { padding: '16px 0' } }, '已到最后一页'),
              )
            : null,
          useImage && layout === 'single'
            ? h(
                'div',
                { className: 'lw-pdf-wrap' },
                pageState.loading ? h('div', { className: 'lw-dim' }, '渲染版面中…') : null,
                pageState.error ? h('div', { className: 'lw-dim', style: { color: 'var(--danger-ink)' } }, pageState.error) : null,
                pageState.dataUrl
                  ? h(
                      'div',
                      { className: 'lw-pdf-canvas' },
                      h('img', {
                        className: 'lw-pdf-page',
                        src: pageState.dataUrl,
                        alt: `第 ${pageState.page} 页`,
                        onLoad: (e) => {
                          const img = e.target;
                          if (pageState.pageHeight > 0 && img.clientHeight > 0) setPxPerPt(img.clientHeight / pageState.pageHeight);
                        },
                      }),
                      pxPerPt > 0 && pageState.words.length
                        ? h(
                            'div',
                            { className: 'lw-pdf-textlayer' },
                            pageState.words.map((wd, i) =>
                              h('span', {
                                key: i,
                                style: {
                                  left: `${(wd.x / pageState.pageWidth) * 100}%`,
                                  top: `${(wd.y / pageState.pageHeight) * 100}%`,
                                  height: `${(wd.h / pageState.pageHeight) * 100}%`,
                                  fontSize: `${Math.max(wd.h * pxPerPt, 1).toFixed(2)}px`,
                                },
                              }, wd.t),
                            ),
                          )
                        : null,
                    )
                  : null,
                h(
                  'div',
                  { className: 'lw-pdf-foot' },
                  `第 ${pageState.page} / ${pageState.pageCount} 页`,
                  pageState.words.length ? ` · 可选中 ${pageState.words.length} 词` : '',
                ),
              )
            : null,
          paged && mode === 'text'
            ? h(
                'div',
                null,
                d.pages.map((pg, i) =>
                  h(
                    'section',
                    { key: i, 'data-page': i + 1, className: 'lw-page' },
                    h('div', { className: 'lw-page-label' }, `第 ${i + 1} 页`),
                    h('pre', { className: 'lw-plain' }, pg || '（本页无可抽取文本）'),
                  ),
                ),
              )
            : null,
          d && d.kind === 'image' ? h('img', { className: 'lw-reader-img', src: d.dataUrl, alt: d.name }) : null,
          d && d.kind === 'unsupported'
            ? h(
                'div',
                { className: 'lw-dim' },
                d.note || '暂不支持预览',
                h('div', { style: { marginTop: 12 } }, h('button', { className: 'lw-btn lw-btn-sm', onClick: () => onReveal && onReveal(file.path) }, '用系统程序打开')),
              )
            : null,
          d && d.note && d.kind === 'text' ? h('div', { className: 'lw-reader-note' }, d.note) : null,
        ),
          chatOpen ? h(ChatPane, { file, hostCtx, selection: sel, flash, onSession: props.onSession }) : null,
        ),
      );
    }
