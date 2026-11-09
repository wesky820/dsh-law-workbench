/**
 * 由 build.mjs 生成，不要直接编辑。源码在 src/ 下，改完跑 npm run build。
 */
window.__ModuleLoader__.load({
  id: 'dsh-law-workbench',
  factory(require) {
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

    function ScaleIcon(props) {
      const size = (props && props.size) || 16;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, style: { flex: 'none', display: 'block' } },
        h('path', {
          d: 'M12 3v17M8 20h8M12 6l-6 2M12 6l6 2M6 8l-2.5 5a3 3 0 0 0 5 0L6 8zM18 8l-2.5 5a3 3 0 0 0 5 0L18 8z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    return {
      name: 'law-workbench',
      inject: ['slots'],
      apply(ctx) {

        try {
          window.__lawWorkbenchTest = { extractPageRefs, extractMessages };
        } catch {
          /* 非浏览器环境忽略 */
        }

        ctx.effect(
          () =>
            ctx.slots.inject('main', () =>
              ctx.slots.register({ name: 'main', key: PANEL_ID }, (slotProps) => h(Workbench, { hostCtx: ctx, slotProps: slotProps || {} })),
            ),
          'law-workbench: main panel',
        );
        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                { name: 'sidebar.panellist', id: PANEL_ID, order: 3, label: () => '律师工作台' },
                (owner = {}) => h(ScaleIcon, { size: owner.size ?? 16 }),
              ),
            ),
          'law-workbench: sidebar entry',
        );
      },
    };
  },
});
