    /** 从会话事件里尽力抽出可读文本（事件结构随版本变化，做防御式解析）。 */
    function eventText(ev) {
      const parts = [];
      const seen = new Set();
      const walk = (v, depth) => {
        if (v == null || depth > 6) return;
        if (typeof v === 'string') {
          if (v.trim()) parts.push(v);
          return;
        }
        if (Array.isArray(v)) {
          for (const one of v) walk(one, depth + 1);
          return;
        }
        if (typeof v === 'object') {
          if (seen.has(v)) return;
          seen.add(v);
          if (v.type === 'text' && typeof v.text === 'string') {
            parts.push(v.text);
            return;
          }
          for (const key of ['data', 'content', 'parts', 'message', 'text']) {
            if (v[key] !== undefined) walk(v[key], depth + 1);
          }
        }
      };
      walk(ev, 0);
      return parts.join('\n').trim();
    }

    const SYSTEM_NOISE = [/^Current runtime context/, /<system-reminder>/, /^Time sampled while preparing/, /^\.\.\.$/];

    /** 会话事件 → [{role, text}]，过滤宿主注入的上下文消息。 */
    function extractMessages(entries) {
      const out = [];
      for (const entry of entries || []) {
        const ev = entry && entry.event;
        if (!ev || typeof ev.type !== 'string') continue;
        const text = eventText(ev.data ?? ev);
        if (!text) continue;
        if (ev.type === 'user/message') {
          if (SYSTEM_NOISE.some((re) => re.test(text))) continue;
          out.push({ role: 'user', text });
        } else if (ev.type === 'assistant/message') {
          out.push({ role: 'assistant', text });
        }
      }
      return out;
    }

    /** 阅读器右侧对话栏：直接绑定该案件会话，读事件流并发送。 */
    function ChatPane(props) {
      const { file, hostCtx, selection, flash, onSession } = props;
      const [state, setState] = React.useState({ status: 'loading', error: '', messages: [], running: false, sessionId: '', note: '' });
      const [text, setText] = React.useState('');
      const [sending, setSending] = React.useState(false);
      const bindRef = React.useRef(null);
      const listRef = React.useRef(null);
      const aliveRef = React.useRef(true);

      React.useEffect(() => {
        aliveRef.current = true;
        let stops = [];
        let binding;

        const readMessages = () => {
          if (!binding) return;
          try {
            const es = binding.eventSource;
            const snapshot = es && typeof es.getSnapshot === 'function' ? es.getSnapshot() : undefined;
            const entries = (snapshot && snapshot.entries) || [];
            let running = false;
            try {
              const ss = binding.session && binding.session.getSnapshot ? binding.session.getSnapshot() : undefined;
              running = Boolean(ss && ss.running);
            } catch {
              running = false;
            }
            if (aliveRef.current) setState((s) => ({ ...s, status: 'ready', messages: extractMessages(entries), running }));
          } catch (e) {
            if (aliveRef.current) setState((s) => ({ ...s, status: 'error', error: String((e && e.message) || e) }));
          }
        };

        (async () => {
          const sessions = readService(hostCtx, 'sessions');
          if (!sessions) {
            setState((s) => ({ ...s, status: 'error', error: '当前环境没有会话服务，无法内嵌对话' }));
            return;
          }
          try {
            let sid = file.sessionId || '';
            if (!sid) {
              const ws = await ensureWorkspaceFor(hostCtx, file.caseDir || String(file.path).replace(/\/[^/]+$/, ''));
              if (ws.error) throw new Error(ws.error);
              const presetAvailable = Array.isArray(file.presetIds) ? file.presetIds : [];
              const presetId = presetAvailable.includes(PRESET) ? PRESET : presetAvailable.includes('lawyer-mode') ? 'lawyer-mode' : '';
              try {
                sid = await sessions.create({ workspaceId: ws.workspaceId, cwd: file.caseDir || undefined, agentPreset: presetId || undefined });
              } catch {
                sid = await sessions.create({ workspaceId: ws.workspaceId, cwd: file.caseDir || undefined });
              }
              if (sid && file.caseDir && typeof onSession === 'function') {
                try {
                  await onSession(file.caseDir, sid);
                } catch {
                  /* 回写失败不影响对话 */
                }
              }
            }
            if (!sid) throw new Error('没能创建会话');
            binding = typeof sessions.binding === 'function' ? sessions.binding(sid) : undefined;
            if (!binding) {
              const ref = typeof sessions.retain === 'function' ? sessions.retain(sid, { source: 'controllerOperation' }) : undefined;
              if (ref) {
                await ref.ready;
                bindRef.current = ref;
                binding = ref.binding;
              }
            }
            if (!binding) throw new Error('会话未就绪（可能还没有加载历史）');
            bindRef.current = bindRef.current || binding;
            if (aliveRef.current) setState((s) => ({ ...s, sessionId: sid }));
            readMessages();
            const es = binding.eventSource;
            if (es && typeof es.subscribe === 'function') stops.push(es.subscribe(readMessages) || (() => {}));
            const ss = binding.session;
            if (ss && typeof ss.subscribe === 'function') stops.push(ss.subscribe(readMessages) || (() => {}));
            // 兜底轮询：某些版本的事件订阅不推送，定时读快照保证回答能出现
            const timer = window.setInterval(() => {
              if (!aliveRef.current) return;
              readMessages();
            }, 1500);
            stops.push(() => window.clearInterval(timer));
          } catch (e) {
            if (aliveRef.current) setState((s) => ({ ...s, status: 'error', error: String((e && e.message) || e) }));
          }
        })();

        return () => {
          aliveRef.current = false;
          for (const stop of stops) {
            try {
              if (typeof stop === 'function') stop();
            } catch {
              /* ignore */
            }
          }
          try {
            if (bindRef.current && typeof bindRef.current.release === 'function') bindRef.current.release();
          } catch {
            /* ignore */
          }
          bindRef.current = null;
        };
      }, [file.path, file.sessionId, hostCtx]);

      React.useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, [state.messages.length, state.running]);

      const send = async () => {
        const value = text.trim();
        if (!value || sending) return;
        setSending(true);
        try {
          const binding = bindRef.current;
          const session = binding && (binding.session || (binding.binding && binding.binding.session));
          if (!session || typeof session.prompt !== 'function') throw new Error('会话不可写');
          await session.prompt([{ type: 'text', text: value }], 'queue');
          setText('');
          setState((s2) => ({ ...s2, running: true }));
        } catch (e) {
          setState((s) => ({ ...s, error: `发送失败：${(e && e.message) || e}` }));
        } finally {
          setSending(false);
        }
      };

      const quote = () => {
        if (!selection) return;
        setText((cur) => `${cur}${cur ? '\n\n' : ''}【材料摘录】${file.name}\n> ${String(selection).split('\n').join('\n> ')}\n\n`);
      };

      return h(
        'aside',
        { className: 'lw-chat' },
        h(
          'div',
          { className: 'lw-chat-head' },
          h('span', { className: 'lw-chat-title' }, '对话'),
          state.sessionId ? h('span', { className: 'lw-chat-sub', title: state.sessionId }, state.sessionId.slice(0, 8)) : null,
          h('span', { className: 'lw-spacer' }),
          selection ? h('button', { className: 'lw-btn lw-btn-sm', onClick: quote }, '引用选中') : null,
        ),
        h(
          'div',
          { className: 'lw-chat-list', ref: listRef },
          state.status === 'loading' ? h('div', { className: 'lw-dim' }, '正在连接会话…') : null,
          state.status === 'error' ? h('div', { className: 'lw-chat-err' }, state.error) : null,
          state.messages.map((m, i) =>
            h(
              'div',
              { key: i, className: `lw-msg ${m.role === 'user' ? 'me' : 'ai'}` },
              h('div', { className: 'lw-msg-role' }, m.role === 'user' ? '我' : '助手'),
              h('div', { className: 'lw-msg-body' }, m.text),
            ),
          ),
          state.running ? h('div', { className: 'lw-dim' }, '助手正在回答…') : null,
          state.status === 'ready' && state.messages.length === 0 ? h('div', { className: 'lw-dim' }, '就这份材料提问，回答会显示在这里。') : null,
        ),
        h(
          'div',
          { className: 'lw-chat-input' },
          h('textarea', {
            className: 'lw-textarea',
            rows: 3,
            placeholder: '问点什么，Enter 发送，Shift+Enter 换行',
            value: text,
            onChange: (e) => setText(e.target.value),
            onKeyDown: (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            },
          }),
          h(
            'div',
            { className: 'lw-chat-actions' },
            h('span', { className: 'lw-dim' }, state.status === 'error' ? '连接异常' : '已绑定本案会话'),
            h('span', { className: 'lw-spacer' }),
            h('button', { className: 'lw-btn lw-btn-primary lw-btn-sm', disabled: sending || !text.trim(), onClick: send }, sending ? '发送中…' : '发送'),
          ),
        ),
      );
    }
