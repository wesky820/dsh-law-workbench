    const React = require('react');
    const h = React.createElement;
    const PANEL_ID = 'law-workbench';
    const PRESET = 'law';
    const API = '/law-workbench/api';

    const QUICK_LABEL = {
      active: '在办',
      overdue: '已逾期',
      dueSoon: '7 日内',
      withFiles: '有材料',
      withClaims: '有主张',
      withMinutes: '有纪要',
    };

    const STAGE_HINT = {
      待接案: '咨询、利益冲突、委托',
      调查取证: '证据收集、检索、鉴定',
      策略制定: '诉讼方案、请求权基础',
      文书起草: '起诉状、答辩状、代理词',
      待定稿送审: '复核、签批、对外',
      已结案: '归档、执行、复盘',
    };

    const CSS = `
.lw-root{--canvas:#f9f9f7;--surface:#fff;--surface-2:#f1f1ef;--line:rgba(11,11,11,.1);--line-strong:rgba(11,11,11,.2);--ink:#0b0b0b;--ink-2:#52514e;--ink-3:#898781;--accent:#2874d0;--accent-bg:#cde2fb;--accent-ink:#184f95;--danger-bg:#fad6d6;--danger-ink:#8e2626;--warn-bg:#f9dca4;--warn-ink:#734500;--ok-bg:#caeac7;--ok-ink:#006300;--radius:8px;--radius-card:12px;--shadow-sm:0 1px 2px rgba(11,11,11,.06),0 2px 8px rgba(11,11,11,.08);--shadow-md:0 2px 4px rgba(11,11,11,.07),0 6px 16px rgba(11,11,11,.10);--font:"Anthropic Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;--mono:"Anthropic Mono","SF Mono",ui-monospace,Menlo,Consolas,monospace;display:flex;flex-direction:column;height:100%;min-height:0;background:var(--canvas);color:var(--ink);font:400 .875rem/1.25rem var(--font);position:relative}
@media (prefers-color-scheme:dark){.lw-root{--canvas:#181817;--surface:#1f1f1e;--surface-2:#242423;--line:rgba(255,255,255,.1);--line-strong:rgba(255,255,255,.2);--ink:#f0efec;--ink-2:#c3c2b7;--ink-3:#898781;--accent:#6da7ec;--accent-bg:#0d366b;--accent-ink:#cde2fb;--danger-bg:#3c0e0e;--danger-ink:#ec7e7e;--warn-bg:#311a00;--warn-ink:#db9300;--ok-bg:#11260f;--ok-ink:#0ca30c;--shadow-sm:0 1px 2px rgba(0,0,0,.4);--shadow-md:0 6px 16px rgba(0,0,0,.5)}}
.lw-root *{box-sizing:border-box}
.lw-head{display:flex;align-items:center;gap:12px;padding:18px 24px 12px}
.lw-title{margin:0;font-size:1.375rem;line-height:1.75rem;font-weight:580;letter-spacing:-.01em}
.lw-sub{color:var(--ink-3);font-size:.75rem;line-height:1.0625rem}
.lw-spacer{flex:1}
.lw-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);border-radius:var(--radius);padding:7px 12px;font:inherit;font-size:.8125rem;cursor:pointer;transition:background .15s,border-color .15s}
.lw-btn:hover:not(:disabled){background:var(--surface-2)}
.lw-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.lw-btn:disabled{opacity:.5;cursor:default}
.lw-btn-primary{background:#0b0b0b;border-color:#0b0b0b;color:#fff;font-weight:580}
.lw-btn-primary:hover:not(:disabled){background:#262625;border-color:#262625}
@media (prefers-color-scheme:dark){.lw-btn-primary{background:#f0efec;border-color:#f0efec;color:#0b0b0b}.lw-btn-primary:hover:not(:disabled){background:#dcdbd5;border-color:#dcdbd5}}
.lw-btn-sm{padding:4px 9px;font-size:.75rem}
.lw-input,.lw-select,.lw-textarea{width:100%;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);border-radius:var(--radius);padding:8px 11px;font:inherit;font-size:.8125rem}
.lw-input:focus,.lw-select:focus,.lw-textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(40,116,208,.18)}
.lw-textarea{resize:vertical;min-height:64px;line-height:1.5}
.lw-toolbar{display:flex;align-items:center;gap:8px;padding:0 24px 12px;flex-wrap:wrap}
.lw-search{width:240px}
.lw-chips{display:flex;gap:6px;flex-wrap:wrap}
.lw-chip{border:1px solid var(--line-strong);background:var(--surface);color:var(--ink-2);border-radius:999px;padding:4px 11px;font-size:.8125rem;cursor:pointer}
.lw-chip.on{background:var(--accent-bg);border-color:transparent;color:var(--accent-ink);font-weight:580}
.lw-seg{display:inline-flex;border:1px solid var(--line-strong);border-radius:var(--radius);overflow:hidden;background:var(--surface)}
.lw-seg button{border:0;background:transparent;padding:6px 12px;font:inherit;font-size:.8125rem;color:var(--ink-2);cursor:pointer}
.lw-seg button.on{background:var(--surface-2);color:var(--ink);font-weight:580}
.lw-body{overflow:auto;flex:1;min-height:0;padding:0 24px 24px}
.lw-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px}
.lw-kpi{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-card);padding:10px 12px;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.lw-kpi:hover{border-color:var(--line-strong);box-shadow:var(--shadow-sm);transform:translateY(-1px)}
.lw-kpi:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.lw-kpi.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-bg)}
.lw-kpi b{display:block;font-size:1.5rem;line-height:1.6rem;font-weight:580;font-variant-numeric:tabular-nums}
.lw-kpi span{color:var(--ink-3);font-size:.75rem}
.lw-kpi.danger b{color:var(--danger-ink)}
.lw-kpi.warn b{color:var(--warn-ink)}
.lw-sec{margin-bottom:14px}
.lw-sec-head{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
.lw-sec-title{font-size:.9375rem;font-weight:580}
.lw-sec-hint{color:var(--ink-3);font-size:.75rem}
.lw-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.lw-day{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-card);padding:8px 10px;min-height:76px;cursor:pointer;text-align:left;font:inherit;color:inherit;display:flex;flex-direction:column;gap:5px}
.lw-day:hover{border-color:var(--line-strong);box-shadow:var(--shadow-sm)}
.lw-day.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-bg)}
.lw-day.today{background:var(--surface-2)}
.lw-day-head{display:flex;align-items:baseline;gap:6px}
.lw-day-wd{color:var(--ink-3);font-size:.75rem}
.lw-day-date{font:580 .8125rem/1 var(--mono)}
.lw-day-n{margin-left:auto;font-size:.75rem;color:var(--ink-3)}
.lw-day-item{font-size:.75rem;color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lw-day-item.danger{color:var(--danger-ink)}
.lw-day-item.warn{color:var(--warn-ink)}
.lw-grid2c{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:1000px){.lw-grid2c{grid-template-columns:1fr}}
.lw-list{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-card);overflow:hidden}
.lw-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--line);cursor:pointer;background:transparent;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;font:inherit;color:inherit}
.lw-row:last-child{border-bottom:0}
.lw-row:hover{background:var(--surface-2)}
.lw-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lw-row-title{font-size:.8125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lw-row-sub{color:var(--ink-3);font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lw-board{display:flex;gap:12px;align-items:flex-start}
.lw-col{flex:1 1 0;min-width:220px;background:var(--surface-2);border-radius:var(--radius-card);padding:10px;display:flex;flex-direction:column;gap:8px}
.lw-col-head{display:flex;align-items:baseline;gap:8px;padding:2px 2px 6px}
.lw-col-name{font-size:.9375rem;font-weight:580}
.lw-col-count{color:var(--ink-3);font-size:.75rem}
.lw-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-card);padding:10px 11px;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s;text-align:left;font:inherit;color:inherit;display:flex;flex-direction:column;gap:6px}
.lw-card:hover{border-color:var(--line-strong);box-shadow:var(--shadow-sm);transform:translateY(-1px)}
.lw-card:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.lw-card-title{font-size:.875rem;font-weight:580;line-height:1.3}
.lw-card-no{font:400 .75rem/1.0625rem var(--mono);color:var(--ink-3)}
.lw-card-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.lw-card-meta{display:flex;align-items:center;gap:8px;color:var(--ink-3);font-size:.75rem}
.lw-pill{display:inline-flex;align-items:center;gap:4px;border-radius:6px;padding:1px 7px;font-size:.75rem;line-height:1.25rem;background:var(--surface-2);color:var(--ink-2);white-space:nowrap}
.lw-pill.accent{background:var(--accent-bg);color:var(--accent-ink)}
.lw-pill.danger{background:var(--danger-bg);color:var(--danger-ink)}
.lw-pill.warn{background:var(--warn-bg);color:var(--warn-ink)}
.lw-pill.ok{background:var(--ok-bg);color:var(--ok-ink)}
.lw-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;flex:1;color:var(--ink-3);font-size:.875rem;padding:60px 20px;text-align:center}
.lw-banner{display:flex;align-items:center;gap:10px;margin:0 24px 12px;padding:7px 11px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);color:var(--ink-2);font-size:.75rem;flex-wrap:wrap}
.lw-dot{width:6px;height:6px;border-radius:50%;background:var(--ink-3);display:inline-block}
.lw-dot.ok{background:var(--ok-ink)}
.lw-dot.off{background:var(--warn-ink)}
.lw-table-wrap{overflow:auto}
.lw-table{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-card);overflow:hidden;font-size:.8125rem}
.lw-table th{text-align:left;font-weight:580;color:var(--ink-2);background:var(--surface-2);padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.lw-table td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.lw-table tr:last-child td{border-bottom:0}
.lw-table tbody tr{cursor:pointer}
.lw-table tbody tr:hover td{background:var(--surface-2)}
.lw-num{font-family:var(--mono);white-space:nowrap}
.lw-dim{color:var(--ink-3);font-size:.75rem}
.lw-overlay{position:absolute;inset:0;background:rgba(11,11,11,.30);display:flex;align-items:center;justify-content:center;z-index:20}
.lw-modal{background:var(--surface);border-radius:var(--radius-card);box-shadow:var(--shadow-md);width:min(520px,92%);max-height:86%;display:flex;flex-direction:column;border:1px solid var(--line)}
.lw-modal-head{display:flex;align-items:center;gap:10px;padding:16px 18px 10px;border-bottom:1px solid var(--line)}
.lw-modal-title{font-size:.9375rem;font-weight:580;flex:1}
.lw-modal-body{padding:16px 18px;overflow:auto;display:flex;flex-direction:column;gap:12px}
.lw-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--line)}
.lw-field{display:flex;flex-direction:column;gap:5px}
.lw-label{font-size:.75rem;color:var(--ink-2)}
.lw-required{color:var(--danger-ink)}
.lw-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.lw-more{border:0;background:transparent;color:var(--accent);cursor:pointer;font-size:.75rem;padding:0;text-align:left}
.lw-drawer{position:absolute;top:0;right:0;bottom:0;width:min(600px,48%);background:var(--surface);border-left:1px solid var(--line);box-shadow:var(--shadow-md);display:flex;flex-direction:column;z-index:15}
.lw-drawer-head{padding:16px 18px 10px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.lw-drawer-title{display:flex;align-items:center;gap:10px}
.lw-drawer-title h3{margin:0;font-size:1.0625rem;font-weight:580;flex:1;line-height:1.4}
.lw-close{border:0;background:transparent;color:var(--ink-3);cursor:pointer;font-size:18px;line-height:1;padding:4px 6px;border-radius:6px}
.lw-close:hover{background:var(--surface-2);color:var(--ink)}
.lw-tabs{display:flex;gap:2px;padding:0 18px;border-bottom:1px solid var(--line);overflow-x:auto}
.lw-tab{border:0;background:transparent;padding:10px;font:inherit;font-size:.8125rem;color:var(--ink-2);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap}
.lw-tab.on{color:var(--ink);border-bottom-color:var(--ink);font-weight:580}
.lw-drawer-body{overflow:auto;padding:14px 18px 24px;display:flex;flex-direction:column;gap:12px}
.lw-section{display:flex;flex-direction:column;gap:8px}
.lw-section-title{font-size:.8125rem;font-weight:580;color:var(--ink-2)}
.lw-item{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)}
.lw-item-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lw-item-title{font-size:.8125rem;line-height:1.3}
.lw-item-sub{color:var(--ink-3);font-size:.75rem}
.lw-check{width:16px;height:16px;border:1px solid var(--line-strong);border-radius:4px;background:var(--surface);cursor:pointer;flex:none;margin-top:2px;display:flex;align-items:center;justify-content:center;color:transparent;font-size:11px;padding:0}
.lw-check.on{background:var(--accent);border-color:var(--accent);color:#fff}
.lw-check:disabled{opacity:.4;cursor:default}
.lw-del{border:0;background:transparent;color:var(--ink-3);cursor:pointer;font-size:13px;padding:2px 4px;border-radius:4px;flex:none}
.lw-del:hover:not(:disabled){color:var(--danger-ink);background:var(--surface-2)}
.lw-add{display:flex;flex-direction:column;gap:8px;padding:10px;border:1px dashed var(--line-strong);border-radius:var(--radius);background:var(--surface)}
.lw-toast{position:absolute;left:50%;transform:translateX(-50%);bottom:24px;background:#0b0b0b;color:#fff;border-radius:999px;padding:8px 16px;font-size:.8125rem;z-index:40;box-shadow:var(--shadow-md)}
@media (prefers-color-scheme:dark){.lw-toast{background:#f0efec;color:#0b0b0b}}
.lw-file{display:flex;align-items:center;gap:8px;padding:7px 9px;border-bottom:1px solid var(--line)}
.lw-file:last-child{border-bottom:0}
.lw-file .ext{flex:none;width:38px;font:600 10px/1 var(--mono);color:var(--ink-3)}
.lw-file .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.8125rem}
.lw-file .sz{flex:none;color:var(--ink-3);font-size:.75rem}
.lw-link{border:0;background:transparent;color:var(--accent);cursor:pointer;font-size:.75rem;padding:0}
.lw-link:hover{text-decoration:underline}
.lw-note{border:1px solid var(--line);border-radius:var(--radius);padding:9px 10px;background:var(--surface)}
.lw-note p{margin:5px 0 0;color:var(--ink-2);font-size:.8125rem;line-height:1.5;white-space:pre-wrap}
.lw-foot{display:flex;gap:12px;align-items:center;padding:8px 24px;border-top:1px solid var(--line);color:var(--ink-3);font-size:.75rem}
.lw-compact .lw-head{padding:10px 12px 8px;gap:8px}
.lw-compact .lw-title{font-size:1.0625rem;line-height:1.4rem}
.lw-compact .lw-sub{display:none}
.lw-compact .lw-banner{margin:0 12px 8px}
.lw-compact .lw-toolbar{padding:0 12px 10px}
.lw-compact .lw-search{width:100%}
.lw-compact .lw-body{padding:0 12px 16px}
.lw-compact .lw-board{padding:0 12px 16px}
.lw-compact .lw-kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.lw-compact .lw-kpi b{font-size:1.25rem}
.lw-compact .lw-col{min-width:200px}
.lw-compact .lw-week{grid-template-columns:repeat(3,minmax(0,1fr))}
.lw-compact .lw-drawer{width:100%}
.lw-compact .lw-foot{padding:6px 12px}
.lw-reader{position:absolute;inset:0;background:var(--surface);display:flex;flex-direction:column;z-index:18}
.lw-reader-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.lw-reader-title{font-weight:580;font-size:.875rem;max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lw-reader-body{flex:1;min-height:0;overflow:auto;padding:16px 18px 40px}
.lw-reader-split{display:flex;flex:1;min-height:0}
.lw-reader-split .lw-reader-body{flex:1;min-width:0}
.lw-chat{width:360px;flex:none;display:flex;flex-direction:column;min-height:0;border-left:1px solid var(--line);background:var(--surface-2);color:var(--ink)}
.lw-chat-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}
.lw-chat-title{font-weight:600;font-size:.875rem}
.lw-chat-sub{font:400 11px/1 var(--mono);color:var(--ink-3)}
.lw-chat-list{flex:1;min-height:0;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.lw-chat-err{color:var(--danger-ink);background:var(--danger-bg);border:1px solid var(--danger-ink);border-radius:var(--radius);padding:8px 10px;font-size:.8125rem}
.lw-msg{display:flex;flex-direction:column;gap:4px;max-width:100%}
.lw-msg-role{font-size:.6875rem;color:var(--ink-3)}
.lw-msg-body{white-space:pre-wrap;word-break:break-word;font-size:.8125rem;line-height:1.55;padding:8px 10px;border-radius:10px;background:var(--surface);border:1px solid var(--line);color:var(--ink)}
.lw-msg.me .lw-msg-body{background:var(--accent-bg);border-color:var(--accent);color:var(--accent-ink)}
.lw-chat-input{border-top:1px solid var(--line);padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.lw-chat-input .lw-textarea{min-height:64px;background:var(--surface);color:var(--ink)}
.lw-chat-actions{display:flex;align-items:center;gap:8px;font-size:.75rem;color:var(--ink-3)}
.lw-reader-img{max-width:100%;border:1px solid var(--line);border-radius:var(--radius)}
.lw-hit{background:#f9dca4;color:inherit;border-radius:2px;box-shadow:0 0 0 1px #f9dca4}
.lw-reader-note{margin-top:14px;color:var(--ink-3);font-size:.75rem;border-top:1px dashed var(--line);padding-top:8px}
.lw-plain{margin:0;white-space:pre-wrap;word-break:break-word;font:400 .8125rem/1.6 var(--mono);color:var(--ink)}
.lw-prose{font-size:.875rem;line-height:1.75;color:var(--ink);max-width:78ch}
.lw-prose h3,.lw-prose h4,.lw-prose h5,.lw-prose h6{margin:18px 0 8px;font-weight:580;line-height:1.35}
.lw-prose h3{font-size:1.125rem}
.lw-prose h4{font-size:1rem}
.lw-prose h5,.lw-prose h6{font-size:.9375rem}
.lw-prose p{margin:8px 0}
.lw-prose ul,.lw-prose ol{margin:8px 0;padding-left:22px}
.lw-prose li{margin:3px 0}
.lw-prose blockquote{margin:10px 0;padding:6px 12px;border-left:3px solid var(--line-strong);color:var(--ink-2)}
.lw-prose code{font-family:var(--mono);font-size:.8em;background:var(--surface-2);border-radius:4px;padding:1px 4px}
.lw-prose pre{background:var(--surface-2);border-radius:var(--radius);padding:10px 12px;overflow:auto}
.lw-prose pre code{background:none;padding:0}
.lw-prose hr{border:0;border-top:1px solid var(--line);margin:16px 0}
.lw-selbar{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);background:var(--accent-bg,#eef4fd);flex-wrap:wrap}
.lw-selbar-text{font-size:.75rem;color:var(--accent-ink,#184f95)}
.lw-page{margin-bottom:18px}
.lw-page-label{font:600 11px/1 var(--mono);color:var(--ink-3);padding:6px 0;border-bottom:1px dashed var(--line);margin-bottom:8px}
.lw-pdf-wrap{display:flex;flex-direction:column;align-items:center;gap:10px}
.lw-pdf-page{max-width:100%;background:#fff;border:1px solid var(--line);box-shadow:var(--shadow-md);border-radius:2px}
.lw-pdf-cont{display:flex;flex-direction:column;align-items:center;gap:12px}
.lw-pdf-foot{color:var(--ink-3);font:400 11px/1 var(--mono)}
.lw-refs{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.lw-refs-label{font-size:.75rem;color:var(--ink-3)}
.lw-pdf-canvas{position:relative;display:inline-block;max-width:100%;line-height:0}
.lw-pdf-canvas img{display:block;max-width:100%}
.lw-pdf-textlayer{position:absolute;inset:0;overflow:hidden}
.lw-pdf-textlayer span{position:absolute;color:transparent;white-space:pre;line-height:1;transform-origin:0 0;cursor:text;user-select:text}
.lw-pdf-textlayer span.hl{background:rgba(40,116,208,.30);border-radius:2px}
.lw-pdf-textlayer ::selection{background:rgba(40,116,208,.35)}
.lw-table-scroll{overflow-x:auto;margin:10px 0}
.lw-md-table{border-collapse:collapse;font-size:.8125rem;min-width:100%}
.lw-md-table th,.lw-md-table td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}
.lw-md-table th{background:var(--surface-2);font-weight:580;white-space:nowrap}
.lw-md-table tr:nth-child(even) td{background:color-mix(in srgb, var(--surface-2) 40%, transparent)}
@media (max-width:1100px){.lw-col{min-width:240px}.lw-drawer{width:100%}.lw-week{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;

    /** 从会话事件里抽取「第 N 页」引用（对事件结构不敏感：整段序列化后再匹配）。 */
    function extractPageRefs(entries) {
      const nums = new Set();
      for (const entry of entries || []) {
        const ev = entry && entry.event;
        if (!ev || ev.type !== 'assistant/message') continue;
        let text = '';
        try {
          text = JSON.stringify(ev);
        } catch {
          continue;
        }
        const re = /第\s*(\d{1,4})\s*页/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          const n = Number(m[1]);
          if (n > 0 && n <= 9999) nums.add(n);
        }
      }
      return [...nums].sort((a, b) => a - b).slice(0, 12);
    }

    const todayISO = () => { const d = new Date(); const pad = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    const dueClass = (d) => (d === null || d === undefined ? '' : d < 0 ? 'danger' : d <= 7 ? 'warn' : '');
    const dueText = (d) => {
      if (!d.dueDate) return d.title;
      if (d.daysLeft === null) return `${d.title} · ${d.dueDate}`;
      if (d.daysLeft < 0) return `${d.title} · 逾期 ${Math.abs(d.daysLeft)} 天`;
      if (d.daysLeft === 0) return `${d.title} · 今天`;
      return `${d.title} · ${d.daysLeft} 天`;
    };
    const worstDeadline = (item) => {
      const open = item.deadlines.filter((d) => !d.done && d.daysLeft !== null);
      return open.length ? open.slice().sort((a, b) => a.daysLeft - b.daysLeft)[0] : null;
    };
    const fmtSize = (n) => (!n ? '—' : n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);
    const fmtTime = (ms) => (!ms ? '—' : new Date(ms).toLocaleString('zh-CN', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
