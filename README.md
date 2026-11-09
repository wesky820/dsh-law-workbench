# 律师工作台 dsh-law-workbench v1.0.0

装进 DSH 的办案工作台：侧栏「律师工作台」→ 首页 / 看板 / 表格，能录案、加期限、记主张与纪要。

## 结构对齐两个成熟实现

| 来源 | 沿用它的做法 |
| --- | --- |
| [wesky820/dsh-law](https://github.com/wesky820/dsh-law) | Host 半边注册 `/api/...` 路由、Client 注册侧栏入口、**首页 = 待办 + 周历排期 + 案件概览 + 最近材料**、**看板六列**：待接案 → 调查取证 → 策略制定 → 文书起草 → 待定稿送审 → 已结案 |
| [zhaoweicmd/lawdesktop](https://github.com/zhaoweicmd/lawdesktop) | 左栏图标 → 案件列表 + 台账页签 + 顶部操作条；**新建案件只填案件名称**，其余信息后补；详情按分区（概览 / 期限 / 主张 / 证据 / 文书 / 材料 / 检索 / 纪要） |

界面视觉沿用 Claude Legal Artifacts 原版令牌（暖白 `#f9f9f7`、Anthropic Sans、黑色主按钮、12px 卡片、语义色 pill）。

## 三个视图

- **首页**：KPI（在办 / 逾期 / 7 日内 / 材料 / 主张 / 纪要）、本周排期条（点日期看当天事项）、待办与临期、最近材料、阶段分布
- **看板**：六列流水线，卡片显示最近期限（逾期红 / 7 天内黄）
- **表格**：案件 / 案号 / 阶段 / 最近期限 / 主张 / 证据 / 文书 / 材料

## 可写操作

新建案件（只需名称）、改阶段、存摘要、增删期限（可勾完成）、证据、检索记录、主张、纪要。

外部来源（工作台内核 / 案件卡）只读，卡片标「外部来源 · 只读」。

## 写入位置

| 位置 | 内容 |
| --- | --- |
| `~/Law/Cases/<案件名>/` | 新建案件时创建目录骨架（文书/证据/检索/预演） |
| `~/.dsh/law-workbench/store.json` | 本工作台的案件元数据与台账记录 |

不写 `~/.dsh/dsh-law/kernel.json`、不写 `~/.dsh/dsh-lawbench/data.json`（分别属于 dsh-law 与既有工作台）。

装进 DSH 的办案看板：侧栏「律师工作台」→ 看板 / 表格，能真的录案、加期限、加证据、记检索。

## 设计来源

照 **Claude Legal Artifacts** 原页面的设计系统做，不是自创：

| 项 | 取值（取自原页面计算样式） |
| --- | --- |
| 画布 | `#f9f9f7`（暖白） |
| 正文/次要/弱化 | `#0b0b0b` / `#52514e` / `#898781` |
| 主按钮 | 黑底白字 `#0b0b0b` |
| 强调 | `#2874d0`，浅底 `#cde2fb` |
| 状态 | 危险 `#fad6d6/#8e2626`、警告 `#f9dca4/#734500`、成功 `#caeac7/#006300` |
| 字体 | `Anthropic Sans` → 系统无衬线回退 |
| 圆角 | 控件 8px、卡片 12px |
| 阴影 | `0 1px 2px rgba(11,11,11,.06), 0 2px 8px rgba(11,11,11,.08)` |

暗色模式按原页面 `--cds` 暗色令牌另配一套。

## 能做什么

- **新建案件**：名称/案号/法院/类型/阶段/当事人/摘要 → 在 `~/Law/Cases` 建目录（文书/证据/检索/预演）
- **看板**：按阶段分列（收案→调查取证→文书起草→立案→庭审→结案），卡片显示最近期限（逾期红、7 天内黄）
- **表格视图**：案件/案号/阶段/最近期限/证据/文书/材料
- **搜索 + 阶段筛选**
- **案件抽屉**：概览（改阶段、存摘要）、期限（增删、勾完成）、证据（增删）、文书、材料（复制路径）、检索（增删）

外部来源（工作台内核 / 案件卡）的记录是**只读**的，卡片上标「外部来源 · 只读」；只有本工作台新建的案件可写。

## 数据写入

| 写入位置 | 内容 |
| --- | --- |
| `~/Law/Cases/<案件名>/` | 新建案件时创建目录骨架 |
| `~/.dsh/law-workbench/store.json` | 本工作台的案件元数据、期限、证据、检索记录 |

不改 `~/.dsh/dsh-law/kernel.json` 与 `~/.dsh/dsh-lawbench/data.json`。

## 配置

```yaml
- id: law-workbench
  config:
    casesRoot: /Users/you/Law/Cases   # 默认
    storePath: ~/.dsh/law-workbench/store.json   # 默认
```

## 踩过的坑（别再犯）

1. **`ctx.slots.register` 必须包在 `ctx.slots.inject(ownerKey, …)` 里**。直接 register 会在启动阶段抛错，desktop 把「entry 未 activate」当致命错误 → 整个 app 起不来。
2. **`window.__ModuleLoader__.load({ id })` 的 id 必须等于 package.json 的 `name`**，否则 `duplicate factory registration`。
3. Host 半边读服务前必须 `export const inject = ['webServer']`，否则 `cannot get property "webServer" without inject`。
4. `dsh.client` 声明是启动时扫描并缓存的：给已有插件新增 client 半边后必须重启 app。

## 验证方式

隔离 home（`DSH_HOME=/tmp/...`）+ 桌面 profile 的配置副本 + `dsh --profile <copy> --no-open` 启动，
再用 Puppeteer 真浏览器打开：抓 console 错误、点按钮、走完「新建案件 → 抽屉 → 添加期限」全流程。

## 案件是怎么识别的

**身份 = 案件目录的绝对路径**。三处数据按目录名 / 案号归一化后合并成一条：

| 来源 | 识别规则 |
| --- | --- |
| `~/Law/Cases/<名称>/` | 每个子目录算一个案件，目录名即案件名 |
| `~/.dsh/dsh-law/kernel.json` | 有 `caseDir` 的按目录名并入对应案件；软删除（`deletedAt`）跳过 |
| `~/.dsh/dsh-lawbench/data.json` | 按标题归一化并入；合不上的单独列出 |
| `~/.dsh/law-workbench/store.json` | 本工作台自己建的记录（可写） |

新建案件时可以**关联已有文件夹**（点「选择…」走系统目录选择器），不必非得在 `~/Law/Cases` 下新建；目录不存在会直接拒绝。
外部来源的案件在详情里标「外部来源 · 只读」，只有本工作台新建的才可写。

## 打开 AI 对话

案件抽屉顶部有「打开 AI 对话 / 新开会话」：

1. 用案件目录注册（或复用）成一个 DSH 工作区；
2. 在该工作区创建会话，**cwd = 案件目录**；
3. 应用**律师工作模式**预设（`lawyer-mode`）。预设名从 Host 的 `agentPresets.list()` 实时读取，取不到时回退默认模式并提示。

会话建好后自动 `openSession`，界面直接跳到对话框。

已知限制：会话与案件还没做持久绑定（`sessionId` 字段预留但未写回），所以每次是「复用该工作区最近的空会话」；从对话反写台账（AI 登记材料/期限）也还没做。

## 可点击性

- **目录选择走应用内浏览器**（`GET /law-workbench/api/browse`，Host 直接读文件系统），不依赖系统的 directory picker——桌面端只装配了 native 选择器，`listDirectory` 会报 `directory-picker/unavailable`。
- 浏览器里有「上一级 / 回主目录 / 主目录 / Law/Cases / 文稿 / 桌面 / 下载」，选中后回填路径与案件名。
- **外部来源案件**（内核 / 案件卡）原本整条抽屉只读，现在有「纳入工作台管理」：不移动目录，只登记进 `store.json`，之后可改阶段、加期限/证据/主张/纪要。
- 首页「案件概览」的阶段标签可点，直接跳到看板并筛该阶段。
- **首页 6 个 KPI 数字都可点**：在办案件 / 已逾期 / 7 日内 / 材料文件 / 主张 / 纪要，点进看板并按该条件筛选，工具栏出现「已逾期 3 ✕」可清除；再点同一 KPI 也能取消。
- 无人问津的按钮不留着：不可用的控件都带 `title` 说明原因。

自查方式：隔离 home + Puppeteer 枚举 `.lw-kpi / button / .lw-card / .lw-row / .lw-day / .lw-tab / .lw-chip / .lw-link / .lw-check` 及 `.lw-drawer` 内全部可点元素，逐个点击并比较点击前后 HTML / 网络请求 / toast，只有"当前已选中项"允许无变化。

## AI 上板（模型直接登记台账）

Host 半边注册 6 个模型面工具，AI 在案件对话里可以直接写台账：

| 工具 | 作用 |
| --- | --- |
| `law_case_add_deadline` | 登记期限（title + dueDate + 法律依据） |
| `law_case_add_evidence` | 登记证据（三态：待收集/已收集/已提交） |
| `law_case_add_claim` | 登记主张（请求 + 请求权基础） |
| `law_case_add_note` | 登记检索结论（含来源） |
| `law_case_add_minute` | 登记会话纪要 |
| `law_case_status` | 读取当前案件台账概况 |

**案件怎么定位**：工具不要求模型知道路径——工作台点「打开 AI 对话」时会把 `案件目录 → sessionId` 写进 `store.json` 的 `sessions` 映射；工具执行时用 `exec.agent.id` 反查案件目录。也支持显式传 `caseDir`。

**写入规则**：与界面完全同一套校验（`buildItem`），写进 `store.json`；若该案件还没纳入工作台，会自动登记一条（不动目录）。会话未绑定时返回明确错误，不会瞎写。

**触发方式**：直接说「记一条期限：一审举证期限 12 月 1 日届满」「把这条证据记上：借款合同，已收集」即可。

## 会话绑定

- 「打开 AI 对话」：优先复用 `sessions` 映射里的会话（`openSession`）；没有就用 `connectWorkspace/create` 建一个并写回映射。
- 「新开会话」：强制新建，并把新 id 覆盖进映射。
- 抽屉里显示「已绑定会话」。
- `GET /law-workbench/api/selftest` 可自查：工具列表、store 路径、绑定会话数、案件/记录数。

## 已知限制

- 工具是全局注册的，会出现在本 profile 的所有会话里；没有绑定案件时会返回「没有找到当前案件」而不是静默失败。
- 不会自动触发：需要用户在对话里提出登记要求（或让模型自己判断该登记）。
- 依赖模型的 tool calling 能力。

## 材料阅读（工作台内）

点「材料」页签里的任意文件 → 抽屉内打开阅读器，不跳出应用。

| 格式 | 处理方式 |
| --- | --- |
| `.md` | 渲染标题 / 列表 / 引用 / 代码块 / **表格**（法务文档里的对照表能正常显示） |
| `.txt .json .csv .log .yml .xml .html` | 等宽纯文本 |
| `.docx` | 内置 zlib 解析 `word/document.xml` 抽正文（无需 Office） |
| `.doc` | 调 macOS `textutil` 转换 |
| `.pdf` | **真实版面渲染**（`pdftoppm` 逐页转 PNG，缓存最近 24 页）+ 文本层双视图；版面/文本一键切换，上一页/下一页/页码跳转；扫描件会提示需要 OCR |
| 图片 | 直接内嵌显示 |

阅读器右上角有「在访达中显示」「复制路径」；不支持预览的格式给出原因并提供系统打开。

**安全边界**：`/api/file` 与 `/api/reveal` **只允许读取案件目录内的文件**（`casesRoot` 或 `store.json` 里登记的目录），路径不在白名单内直接拒绝；仍受本机回环限制。

## 顺手修掉的 bug

`mapStage` 的兜底值还是旧阶段名 `收案`，导致没有阶段信息的案件（只有目录的那些）落到不存在的列里，**看板上直接消失**。已改为 `待接案`。

## 全文检索

「检索」视图：输入关键词，跨全部案件材料搜索（`.md / txt / csv / json / docx / pdf`），命中给「案件 · 文件 · 行号 · 片段」，点一条直接用阅读器打开该文件。

- 单文件上限 1.5MB，一次最多扫 400 个文件（超出标「已截断」）
- docx / pdf 先用同样的抽取逻辑转文本再搜
- 实测：49 个文件、`借款` 命中 8 条

## 划词提问

阅读器里选中文字 → 浮出「就这段问 AI」：

1. 自动找文件所属案件，确保该案件有工作区；
2. 用 `sessions.create`（带律师工作模式预设，预设不可用时自动退回默认模式）建会话；
3. 把「【材料摘录】案件 + 文件 + 引用原文 + 提问」作为一条消息发进去，并切到对话面板。

消息确实进入会话记录（实测 transcript 里能看到「【材料摘录】案件：刘佳案…」）。

## PDF 版面渲染

参考 dsh-paper-reader 的真实阅读体验：`GET /law-workbench/api/page?path=&n=&dpi=` 用 `pdftoppm` 把第 N 页渲染成 PNG（默认 110dpi，可调到 200），返回 data URL；Host 侧按 `文件路径|mtime|页|dpi` 缓存最近 24 页，临时文件即用即删。

阅读器里 PDF 默认进「版面」视图，可切「文本」看抽取层；顶部有「‹ 上一页 / 页码 / 跳转 / 下一页 ›」。

页面尺寸实测：A4 @110dpi → 911×1287，单页约 70KB PNG。

## PDF 可选中文本层

版面视图上叠加词级文本层：`pdftotext -bbox-layout` 取每页 `<word>` 的 xMin/yMin/xMax/yMax（点），前端按页面尺寸百分比定位透明文字，字号由 `图高 / 页高` 换算。

- 可以直接在版面上**拖选文字**（像 PDF.js 那样），选中后浮出「就这段问 AI」
- 选中范围会高亮（`span.hl`，背景色跟随主题强调色）
- 每页词数显示在页脚：`第 1 / 2 页 · 可选中 38 词`
- 词框高度绑定到 `yMax - yMin`，高亮与原文行对齐

实测：demo 合同第 1 页 38 个词可选中，跨 4 词拖选得到「产品采购合同（节选）合同编号：HT-2025-0912…」，高亮 4 段。

## 工程化：测试

```bash
npm test        # node --test，自动发现 test/*.test.mjs
```

当前 8 个用例（全部通过）：

| 用例 | 覆盖 |
| --- | --- |
| `buildItem` 期限必填日期 | 校验分支 |
| `buildItem` 证据/主张/纪要/检索 | 默认值与必填 |
| `mapStage` | 旧阶段名（收案/准备/结案…）与空值都归一到六列 |
| `browseDirs` 只列目录、排除点文件 | 目录浏览 |
| `browseDirs` 不存在路径 | 错误不抛出 |
| `searchMaterials` 行号与片段 | 全文检索 |
| `extractDocxText` | docx 正文抽取 |
| `pdfPageWords` | 词框与页面尺寸 |

为实现可测性，`index.js` 末尾导出 `__test`（buildItem / mapStage / extractDocxText / browseDirs / searchMaterials / pdfPageWords / loadStore / saveStore），不参与运行时逻辑。

## 未完成：右侧栏常驻 tab

试过对齐 novel-forge 的右侧栏 tab：`dsh-better-sidebar` 用 `ctx.provide("betterSidebar", service)` 暴露 `registerTab()`，但该服务在**它自己的插件上下文**里 provide，当前版本跨插件不可见——`ctx.get('betterSidebar')` 恒为 undefined、`ctx.inject(['betterSidebar'])` 也从不触发（浏览器控制台实测）。

因此右侧栏入口暂不可用，工作台仍走「左栏入口 + 主面板」。要落这一条，需要 better-sidebar 把服务注册到 root（或在它的 `cordis.patch.yml` 里声明可注入），属于它的改动范围。

## 回答里的页码可点（引用跳转）

AI 在对话里写了「第 N 页」，阅读器顶部会出现「回答引用」一排页码按钮，点一下直接跳到那一页。

实现：客户端用 `sessions.using(sessionId, {source:'controllerOperation'}, …)` 借到绑定会话，读 `binding.eventSource.getSnapshot().entries`，把 `assistant/message` 事件整段序列化后用 `/第\s*(\d{1,4})\s*页/` 提取（对事件结构不敏感），去重排序后渲染成 chip。

- 纯函数 `extractPageRefs(entries)` 挂在 `window.__lawWorkbenchTest` 上，便于浏览器内自测
- 浏览器实测：合成事件 `[第3页, 第 5 页, 第12页, 重复第3页, 非 assistant 事件]` → `[3, 5, 12]`
- 没有绑定会话或回答里没提页码时，不渲染该条，不影响阅读

## 工程化：构建

```bash
npm run build   # src/*.js → client.js（零依赖，Node 原生）
npm test        # node --test，自动发现 test/*.test.mjs
```

- 源码在 `src/`，7 个无 import/export 的普通脚本片段，按文件名顺序共享同一函数作用域：
  `00-core.js`（常量/工具/markdown/CSS）、`10-workbench.js`、`20-drawer.js`、`30-create.js`、`40-search.js`、`50-reader.js`、`60-plugin.js`（注册）
- `build.mjs` 把它们包进 `window.__ModuleLoader__.load({ id, factory })`，输出 `client.js`
- **构建前后校验**：拆分再拼回的工厂体与原单文件**字节一致**（98,617 字符），只有头部注释换成生成提示
- 回归：隔离实例 + Puppeteer 验证首页 6 个 KPI、7 个周历格、检索视图、演示 PDF 版面（38 个可选词）、无 console 错误

## 移除案件 / 检索定位 / PDF 缩放

- **从工作台移除**：抽屉里（仅可编辑案件）点「从工作台移除」，确认后删掉工作台记录、台账条目与会话绑定，并把目录写入 `store.json` 的 `hidden`——**看板不再显示，案件文件夹原样保留**。再次用「新建案件 → 选择…」关联同一目录会自动取消隐藏。
- **检索命中定位**：从检索结果打开文件时带 `query`，阅读器渲染后把命中词包成 `<mark class="lw-hit">` 并滚到第一处（最多 200 处，跳过 PDF 透明词层）。
- **PDF 缩放**：版面视图可选 标准 110dpi / 高清 150dpi / 超高 200dpi，切换后重渲染当前页（Host 端按 `路径|mtime|页|dpi` 缓存 24 页）。

实测（隔离实例 + Puppeteer）：检索「借款」8 条 → 打开第一条出现 1 处高亮；PDF 切「高清」后仍停在第 1/2 页；建案后移除，卡片消失、`hidden` 记录路径。

## 案件归档与恢复 / PDF 连续滚动

- **归档可恢复**：工具栏出现「已归档 N」，点开列出被移除的案件，可逐个「恢复」——恢复不移动文件，只把目录重新登记成可编辑案件；目录已不存在时会从归档里清掉并提示。
- **PDF 连续滚动**：版面视图多了「单页 / 连续」。连续模式先铺前两页，滚到底部哨兵（IntersectionObserver，400px 预取）再加载下一页，全部加载后显示「已到最后一页」。

实测：5 页 PDF 进入连续模式后从 2 页加载到 5 页、标签依次为第 1–5 页、尾部「已到最后一页」，无报错；归档测试案移除→归档→恢复后卡片回来、归档计数归零。

## 材料批量操作

「材料」页签里每个文件前有勾选框：

- 勾选后出现批量条：`已选 N 个文件` + 全选/清除
- **批量登记为证据**：选类型（书证/物证/电子数据…）与状态（待收集/已收集/已提交），名称取文件名去扩展名；Host 用 `addItems` 一次写入，返回成功数与失败明细
- **在访达中显示**：对选中的每个文件调用 `/api/reveal`

实测：演示案 5 个文件 → 勾 2 个 → 批量登记 → 证据页签从 `证据 0` 变 `证据 2`，条目为「证据清单」「案情摘要与争点」，选择自动清空。

修过一个交互 bug：连点两个勾选框只选中 1 个（`toggle` 用了渲染期快照），改为函数式 `setSelected(cur => …)`。

## 台账条目可编辑

| 条目 | 可改 | 交互 |
| --- | --- | --- |
| 证据 | 状态三态 | 点状态 pill：待收集 → 已收集 → 已提交 |
| 主张 | 结论 | 点结论 pill：待定 → 成立 → 不成立 |
| 期限 | 届满日 / 依据 | 「改期」展开行内日期+依据，保存即生效 |
| 检索 / 纪要 | 文本字段 | 走 `updateItem` 的字段白名单 |

Host 新增 `updateItem`，按 `kind` 限定可改字段并校验取值（状态与结论的枚举、日期格式）；`mutate` 响应现在带 `result`（批量登记的 `added`/`failed` 不再被丢弃）。

**可配置项**（测试与多环境用）：`casesRoot`、`storePath`、`kernelPath`、`benchPath`——后两项默认仍是 `~/.dsh/dsh-law/kernel.json` 与 `~/.dsh/dsh-lawbench/data.json`。

实测：期限 2026-12-01 → 2026-12-20（toast「已改期」）、证据 待收集 → 已收集、主张 待定 → 成立，`store.json` 落盘一致。

## 案件信息编辑

「概览」页签现在是一张可编辑的案件信息表（仅工作台内可写案件）：

| 字段 | 说明 |
| --- | --- |
| 案件名称 | 不能为空 |
| 案号 / 受理法院 | 随保存更新到卡片 |
| 案件类型 | 民事 / 刑事 / 行政 / 仲裁 / 非诉 / 其他 |
| 当事人 | 顿号或逗号分隔，保存时拆成 `parties[]` |
| 案情摘要 | 同一表单一起保存 |

`updateCase` 相应扩展到 `title / caseType / parties`；阶段仍是独立下拉（改即生效）。

实测：案号 `(2026)沪0113民初77777号`、法院「上海市浦东新区人民法院」、类型「刑事」、当事人「甲公司、乙公司」保存后，卡片案号与 `store.json` 一致；ops 测试同步断言了这四个字段。

## 一致性与状态检查（第 10 轮）

全量点击审计（隔离实例 + Puppeteer，每次点击前重置视图避免 id 漂移）：

```
扫描范围：首页 35 / 看板 13 / 表格 / 检索 / 抽屉 8 个页签
无反应控件：4 个
  - 刷新 ×3（幂等，已补 toast「已刷新」）
  - 「全部 N」（当前已选筛选，本就不该变化）
console 错误：0
```

- **空态**：无案件时显示说明 + 「＋ 新建案件」按钮（文案不再写死 `~/Law/Cases`）
- **错误态**：拦截 `/api/overview` 后显示「读取失败：Failed to fetch」+「重试」，重试也会给 toast
- 破坏性操作（删除/移除）与导航类（打开 AI 对话）在审计中跳过，单独做过专项测试

## 阅读器内嵌对话栏（文献阅读器式）

打开任意材料（PDF / Markdown / 文本）后，阅读器变成左右两栏：左边文档，右边对话。头部「对话」按钮可收起/展开。

- 对话栏直接绑定**该案件会话**：有绑定就复用，没有就新建一个并把 sessionId 回写案件（`bindSession`），不会每次打开都新建
- 消息来自 `binding.eventSource`（`user/message` / `assistant/message`），并过滤宿主注入的 `Current runtime context`、`<system-reminder>` 等上下文消息
- 输入框 Enter 发送、Shift+Enter 换行；有选中文字时点「引用选中」把摘录带进输入框
- 回答更新：优先订阅事件流，另有 1.5s 轮询兜底（部分版本订阅不推送）
- 配色使用工作台自己的主题 token，深色/浅色模式都保持可读

实测（隔离实例）：打开演示 PDF 后左文档右对话、会话自动创建并回写 `sessions`、输入「这份合同的总价款是多少？」发送后出现在对话里、系统注入消息已被过滤、console 无错误。助手回复需要模型，隔离实例里没有模型，未在该环境验证。

## 安装给其他人

见 [INSTALL.md](./INSTALL.md)。包本体是 `dsh-law-workbench-1.0.0.tgz`，自带 `index.js`（Host）、`client.js`（Client）、`cordis.patch.yml`（bundle 挂载行）、`locale/`、`icon.svg`、`src/`（源码）与 `build.mjs`。

安装三件事缺一不可：

1. 包进 profile 依赖：`dsh plugin --profile <profile> add /绝对路径/dsh-law-workbench` 或该 tgz
2. profile 的 `dsh.profile.bundles` 里加 `"dsh-law-workbench"`
3. **完整退出并重启** DSH（客户端模块有缓存）

包名、`cordis.patch.yml` 的 `name`、`client.js` 里 `__ModuleLoader__.load({ id })` 必须一致；改包名后要 `npm run build`。
