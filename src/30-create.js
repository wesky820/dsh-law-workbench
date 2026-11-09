    function DirBrowser(props) {
      const { hostCtx, onPick, onClose } = props;
      const [current, setCurrent] = React.useState('');
      const [res, setRes] = React.useState(null);
      const [err, setErr] = React.useState('');
      let ui;
      try {
        ui = typeof hostCtx.get === 'function' ? hostCtx.get('uiWorkspace') : undefined;
      } catch {
        ui = undefined;
      }
      const load = React.useCallback(async (target) => {
        try {
          const q = target ? `?path=${encodeURIComponent(target)}` : '';
          const r = await fetch(`${API}/browse${q}`, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
          const body = await r.json();
          if (!body.ok) {
            setErr(body.error || '读取失败');
            return;
          }
          setRes(body);
          setErr('');
          setCurrent(body.path || '');
        } catch (e) {
          setErr(String(e && e.message ? e.message : e));
        }
      }, []);
      React.useEffect(() => {
        load('');
      }, [load]);
      const dirs = (res && res.entries) || [];
      const parent = (res && res.parent) || '';
      const roots = (res && res.roots) || [];
      const crumbs = current ? current.split('/').filter(Boolean) : [];
      return h(
        'div',
        { className: 'lw-overlay', onClick: (e) => e.target === e.currentTarget && onClose() },
        h(
          'div',
          { className: 'lw-modal', role: 'dialog', 'aria-modal': 'true', style: { width: 'min(680px,94%)', zIndex: 30 } },
          h('div', { className: 'lw-modal-head' }, h('div', { className: 'lw-modal-title' }, '选择案件文件夹'), h('button', { className: 'lw-close', onClick: onClose, 'aria-label': '关闭' }, '×')),
          h(
            'div',
            { className: 'lw-modal-body', style: { gap: 8 } },
            h('div', { className: 'lw-dim' }, current || '选择要作为案件目录的文件夹'),
            h(
              'div',
              { className: 'lw-card-row' },
              parent ? h('button', { className: 'lw-btn lw-btn-sm', onClick: () => load(parent) }, '↑ 上一级') : null,
              h('button', { className: 'lw-btn lw-btn-sm', onClick: () => load('') }, '回主目录'),
              h(
                'button',
                {
                  className: 'lw-btn lw-btn-sm',
                  onClick: async () => {
                    try {
                      if (ui && typeof ui.pickDirectory === 'function') {
                        const picked = await ui.pickDirectory();
                        if (picked) onPick(picked);
                      }
                    } catch (e) {
                      setErr(String(e && e.message ? e.message : e));
                    }
                  },
                },
                '用系统对话框',
              ),
              roots.map((r, i) =>
                h('button', { key: `root-${i}`, className: 'lw-btn lw-btn-sm', onClick: () => load(r.path) }, r.name),
              ),
            ),
            err ? h('div', { className: 'lw-dim', style: { color: 'var(--danger-ink)' } }, `读取失败：${err}`) : null,
            h(
              'div',
              { className: 'lw-list', style: { maxHeight: 320, overflow: 'auto' } },
              dirs.length === 0
                ? h('div', { className: 'lw-dim', style: { padding: 12 } }, err ? '无法列出目录' : '这里没有子文件夹')
                : dirs.map((e, i) => {
                    const name = e.name || String(e.path || '').split('/').filter(Boolean).pop() || '';
                    const full = e.path || (current ? `${current.replace(/\/+$/, '')}/${name}` : name);
                    return h(
                      'button',
                      { key: i, className: 'lw-row', onClick: () => load(full) },
                      h('div', { className: 'lw-row-main' }, h('div', { className: 'lw-row-title' }, `📁 ${name}`)),
                      h('span', { className: 'lw-dim' }, '进入'),
                    );
                  }),
            ),
          ),
          h(
            'div',
            { className: 'lw-modal-foot' },
            h('button', { className: 'lw-btn', onClick: onClose }, '取消'),
            h('button', { className: 'lw-btn lw-btn-primary', disabled: !current, onClick: () => onPick(current) }, '选择此文件夹'),
          ),
        ),
      );
    }
