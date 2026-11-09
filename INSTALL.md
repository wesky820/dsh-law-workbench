# 安装 dsh-law-workbench（律师工作台）

给 DeepSeek Harness 加一个中国法律实务工作台：案件看板、期限/证据/主张台账、材料阅读（PDF 版面 + 文本层选词 + 内嵌 AI 对话栏）。

- 版本：1.0.0
- 形态：一个 bundle（Host + Client 两半），装进 profile 后左栏出现「律师工作台」入口
- 许可：MIT

## 一、前置条件

| 项 | 说明 |
| --- | --- |
| DeepSeek Harness | Desktop 版或 CLI，Web UI 可用 |
| Node | 用 DSH 自带运行时即可，无需另装 |
| poppler（可选但推荐） | PDF 版面与词级文本层依赖 `pdftoppm` / `pdftotext` / `pdfinfo`。macOS：`brew install poppler` |

没有 poppler 时其余功能正常，只是 PDF 只能看抽取的纯文本、没有版面图和选词。

## 二、安装

DSH 的插件 = 包本体 + profile 里的一行 bundle 声明。两种入口二选一。

### 方式 A：拿到的是目录（推荐）

```bash
# 1. 解压到任意位置，例如
~/dsh-plugins/dsh-law-workbench/

# 2. 装进 profile（把 <profile> 换成你的，如 web / desktop）
dsh plugin --profile <profile> add /绝对路径/dsh-law-workbench

# 3. 让这个包作为 bundle 生效：在 profile 的 package.json 里
#    dsh.profile.bundles 数组末尾加一行 "dsh-law-workbench"
#    路径：$DSH_HOME/profiles/<profile>/package.json

# 4. 完整退出并重启 DSH（客户端模块有缓存，刷新页面不算）
```

在 DSH 里也可以直接让 agent 代劳：调用 `plugin_manager` 的 `install_bundle`，`target` 传该目录的绝对路径——它会同时完成依赖安装和 bundle 声明。

### 方式 B：拿到的是 tarball

```bash
dsh plugin --profile <profile> add /绝对路径/dsh-law-workbench-1.0.0.tgz
# 同样在 dsh.profile.bundles 里加 "dsh-law-workbench"，然后重启
```

### 方式 C：已发布到 npm（若你看到的是包名）

```bash
dsh plugin --profile <profile> add dsh-law-workbench
# 同样加 bundles 行，然后重启
```

## 三、配置（可选）

默认值如下，一般不用改：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `casesRoot` | `~/Law/Cases` | 案件目录根；每个子目录是一个案件 |
| `storePath` | `~/.dsh/law-workbench/store.json` | 工作台自己的台账（期限/证据/主张/纪要、会话绑定、归档） |
| `kernelPath` | `~/.dsh/dsh-law/kernel.json` | 只读外部源，没装就自动跳过 |
| `benchPath` | `~/.dsh/dsh-lawbench/data.json` | 只读外部源，没装就自动跳过 |

要改的话，在 profile 的 `cordis.patch.yml` 里加一行：

```yaml
- id: law-workbench
  name: dsh-law-workbench
  config:
    casesRoot: /Users/you/Law/Cases
    storePath: /Users/you/.dsh/law-workbench/store.json
```

## 四、上手三步

1. 左栏点「律师工作台」→ 右上「＋ 新建案件」：只填名称即可，工作台会在 `casesRoot` 下建好 `文书/证据/检索/预演` 四个子目录
2. 看板点案件 → 抽屉里「材料」页签读文件；PDF 左侧是版面，右侧是对话栏，可直接就选中内容提问
3. 抽屉里填期限、证据、主张；在「概览」改案号/法院/当事人

## 五、数据边界

- 写：`casesRoot` 下你新建的案件目录、`storePath` 台账文件
- 只读：`kernelPath` / `benchPath` 指向的外部数据（如果有）
- 不碰：别的插件的数据文件

移除案件时只删工作台记录（可在「已归档」里恢复），**不会删除案件文件夹**。

## 六、卸载

```bash
dsh plugin --profile <profile> remove dsh-law-workbench
# 再从 dsh.profile.bundles 里删掉那一行，重启
```

台账文件与案件目录不会被删除，需要的话手动清理。

## 七、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 重启后左栏没有入口 | 包名、`cordis.patch.yml` 里的 `name`、`client.js` 里 `__ModuleLoader__.load({ id })` 三者必须一致；改过包名要 `npm run build` 重新生成 `client.js` |
| PDF 没有版面/选词 | 缺 poppler，`brew install poppler` 后重启 |
| 改了代码但界面没变 | 客户端模块有缓存，必须**完整退出** DSH 再启动；只刷新页面不够 |
| 对话栏一直「正在连接会话」 | 该 profile 没有可用的模型/会话服务；先在普通对话里发一条确认模型可用 |
| 端口占用/启动失败 | 某个插件 entry 停在 `pending`/`loading` 会让 Web 启动失败，看 `--dump-config` 与启动日志定位 |
