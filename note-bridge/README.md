# note-bridge

独立的 Tauri 2 + Rust + Svelte 5 桌面应用。它读取本机 Claude Code / Codex 的 **API 配置**，将选定的模型服务通过本机 WebSocket 提供给 note 全库知识问答。网页只获得服务信息和问答流，不读取本机配置文件或 API 凭据。

当前独立版本：`0.1.0`。安装包和网站分别构建、分别更新。

## 本地运行

需要 Node.js 26、npm、稳定版 Rust，以及 [Tauri 2 平台构建前置依赖](https://v2.tauri.app/start/prerequisites/)。macOS 需要 Xcode Command Line Tools；Windows 需要 MSVC C++ 工具链和 WebView2。Linux 可执行纯 Rust 核心测试，但本轮桌面发布目标仅为 macOS / Windows。

```sh
cd note-bridge
npm ci
npm run desktop:dev
```

`npm run dev` 仅预览 GUI，不具备 Tauri 原生权限。生产 GUI 不包含模拟服务或测试凭据。

```sh
npm run build                       # Svelte / TypeScript 检查及前端构建
npx playwright install chromium     # 首次界面测试安装浏览器
npm run test:ui                      # 测试专用 IPC fixture，不连接本机凭据
cargo test --locked -p bridge-core   # 独立核心测试，无需真实付费凭据
cargo fmt --all --check
cargo clippy --locked -p bridge-core --all-targets -- -D warnings
npm run desktop:build               # 本机平台桌面包
```

应用图标由 `src-tauri/build.rs` 在编译时生成，托盘图标直接使用 RGBA 像素。生成的 PNG / ICO / ICNS 不纳入版本控制。

## 使用流程

1. 在「模型服务」扫描 Claude Code / Codex 配置；也可显式填写配置目录，或手动添加 API 基础地址、模型和凭据。扫描结果需要点「导入并启用」才会加入模型列表。导入时读取本地明确配置的多模型目录；在服务编辑中还可从当前 API 获取候选、勾选加入，或手动添加任意服务商支持的模型 ID、显示名称和 effort。
2. 配置「连接与配对」中允许的网站 Origin。Origin 是完整的协议、主机和端口，例如 `https://notes.example.com`，不包括 URL 路径，也不使用通配符。
3. 启动服务，默认监听 `127.0.0.1:19661`，WebSocket 地址为 `ws://127.0.0.1:19661/ws`；首次打开应用不会自动启动监听。
4. 生成配对码，在网站导航（SiteNav）的独立「note-bridge」入口填写端口和配对码。配对码正确即可连接，无需在桌面端再次确认。配对码两分钟有效，使用一次后失效。
5. 配对成功后，网站会记住连接凭证和端口；刷新或再次打开网站会自动认证重连。SiteNav 显示绿色「已连接」表示已经完成本次连接认证。桌面服务尚未启动时显示未连接，按 1/2/4/8/16/30 秒退避重试，之后最多每 30 秒重试；认证失效会清除本地凭证并停止重试，需要重新配对。
6. 从任意页面导航的「更多工具 → 知识助手」（桌面 Alt+I）打开全库问答，按服务分组选择模型及该模型声明的 effort 后提问。模型和能力更新保存后立即同步到已连接网页，不必重新配对，不中断已开始的回答。AI 可从全库概览、目录/全文检索开始，按需读取多篇文档、TOC、全局或局部知识网络与相关文档；正文分段、结果分页。默认无需当前文档，也不自动附加其内容。左侧保留本地聊天记录，右侧流式显示 Markdown 回答及文档引用。每条工具调用可展开，查看查询条件、读取范围、结果数量和文档/章节条目，以及分页、截断、全文索引降级或失败原因；简明概览随聊天保存，刷新后仍可查看，旧记录会提示未保存概览。连接中断只会重新连接，不会自动重发问答请求。「断开」仅暂停当前页面的连接和重试，保留记忆，刷新后仍会自动连接。
7. 桌面应用「已授权的网站」列出在线和离线的持久授权，可随时撤销。网站的「忘记连接」清除本地凭证；在线时还会撤销桌面授权，离线时可稍后在桌面应用撤销。

关闭窗口会隐藏到系统托盘 / macOS 菜单栏；通过托盘可显示窗口、启停服务或彻底退出。再次打开应用会唤起已有实例。退出时会停止桥接和活动请求，但保留网站授权；再次启动服务后，已配对网站可以自动重连。

编辑服务时，密钥输入框始终为空；留空表示保留原有凭据。选择「无需凭据」会移除保存的凭据。新的输入提交后会清空。连接测试会发送最小模型请求，可能产生少量服务商费用；自动测试不调用真实付费服务。

## 全库问答与可选文档

知识助手默认从整个本站知识库检索，可用于跨主题比较、知识关联和学习路径梳理，例如“操作系统与数据库如何处理并发冲突”“学习分布式事务需要哪些前置知识”。初始请求使用 `context: {scope: "knowledge_base", documents: []}`；模型先查找资料，再核对原文并给出可导航的引用。范围是本站目录白名单内的文档，不包含任意网站或本机文件。

| 工具 | 全库能力 |
| --- | --- |
| `get_knowledge_overview` | 分类数量、分页文档目录，可按一级分类筛选；无需起始文档 |
| `search_documents` | `all` 默认结合目录与全文索引，`catalog` 只检索本地标题/路径，`fulltext` 使用正文索引；返回可读片段和候选文档 |
| `get_knowledge_network` | 省略 `docId` 分页读取全局边；提供 `docId` 查询指定文档的入链/出链 |
| `get_toc` / `get_document` | 读取任意目录内文档的真实 TOC 与分段正文 |
| `get_related_documents` | 以已找到的文档为起点扩展相关资料 |

全文检索复用网站现有 Algolia 搜索服务，查询词发送到该站内索引，每次最多取 200 个候选；索引可能滞后或未覆盖全部文档。工具明确报告检索范围、索引状态与分页信息，索引失败时降级本地目录检索，不能把目录无匹配解释为全库正文不存在相关内容。正文引用来自实际站内文档，搜索片段需再读原文核实。

文档页可在输入栏「文档上下文」显式勾选附加当前文档目录，或选择章节及关联文档；附加内容仅作参考，不限制全库工具的范围。仅打开附加面板时加载当前文档供选择，未勾选时不向模型发送该文档；文档加载失败仍能向全库提问。聊天不随页面切换而切换，历史记录跨页面共享并兼容此前的文档会话；仅关闭弹窗、切换聊天或停止生成会取消当前面板请求。手动附件与工具来源共用按文档和原始章节生成的稳定编号。

## 配置与凭据

- Claude 默认扫描 `~/.claude`，并遵循 `CLAUDE_CONFIG_DIR`；Codex 默认扫描 `~/.codex`，并遵循 `CODEX_HOME`。桌面应用允许覆盖目录。
- 只支持可直接用于 API 的 key / bearer token。Claude / ChatGPT 订阅 OAuth 登录不是 API key，不会被隐式转换或拿去调用第三方接口。
- 模型服务元数据、网站授权的令牌哈希及来源/时间信息写入系统应用数据目录，桌面端不持久化网站令牌原文。模型 API 凭据在 macOS 使用 Keychain，Windows 使用 Credential Manager。读取、保存、删除 API 凭据均由 Rust 处理。
- 网站在当前 Origin 的 `localStorage` 中使用 `note:ai-bridge:v1` 保存 `{version: 1, port, token}`，用于刷新后的自动认证。该令牌仅代表本机桥接授权，不是模型 API key。网站脚本可访问该 Origin 的本地存储，应只授权可信的网站；更换协议、域名或端口需重新配对。
- GUI 仅接收去除凭据后的状态；网站 WebSocket 不开放配置扫描、导入、凭据管理或文件访问接口。
- 支持 Anthropic Messages、OpenAI Responses、OpenAI Chat Completions。填写对应协议的 API 基础地址，由适配器追加端点。远程地址须为 HTTPS；本机回环 API 可用 HTTP。
- effort 按模型保存，`default` 不发送额外参数。可声明 `none/minimal/low/medium/high/xhigh/max/ultra`，显式值映射到所选协议的 `reasoning.effort`、`reasoning_effort` 或 `output_config.effort`。新导入或获取的模型缺少能力信息时只提供默认强度，可按服务商实际能力补充；旧单模型配置保留原有低/中/高选项。声明不会改变模型能力，不自动推测 thinking token budget。
- 日志记录请求 ID、模型、状态和耗时，不记录 API key、问答正文或上游响应正文。GUI 支持过滤、清空和经原生文件对话框导出日志。

当前发现范围是用户配置目录及显式指定的目录，不扫描项目级配置、不合并组织策略，也不自动跨 Windows / WSL 读取另一环境的配置。环境变量取自桌面应用进程继承的环境；不会执行 shell、凭据 helper 或 hooks。

| 配置来源 | 当前支持的字段 / 结构 | 需要手动处理的情况 |
| --- | --- | --- |
| Claude `settings.json` | 同一文件的 `env.ANTHROPIC_BASE_URL`、`ANTHROPIC_API_KEY` 或 `ANTHROPIC_AUTH_TOKEN`；`ANTHROPIC_MODEL`、`ANTHROPIC_DEFAULT_*_MODEL` 与名称、`ANTHROPIC_SMALL_FAST_MODEL`、`ANTHROPIC_CUSTOM_MODEL_OPTION`、`modelPicker.options` / `modelOverrides` | 别名仅通过显式本地映射解析，不猜测最新官方模型；同时存在两种凭据视为冲突；不执行 `apiKeyHelper`，不复用 OAuth |
| Codex `config.toml` | `model`、`model_provider`、`model_catalog_json`、`model_providers.*.base_url`、`wire_api`（`responses` / `chat`）、`env_key`、`requires_openai_auth`、无冲突的显式 `experimental_bearer_token`（含 cc-switch 本机代理） | 额外 `http_headers` / `env_http_headers` 标记为不支持；不会猜测未知 `wire_api` |
| Codex profiles | 内联 `[profiles.<name>]` 及同目录最多 64 个 `*.config.toml`；覆盖 `model` / `model_provider` / `model_catalog_json`，同名 provider 表整体替换 | 不模拟 CLI 所有覆盖规则；缺少凭据或完整模型 ID 时需手动配置 |
| Codex `auth.json` | `auth_mode: "apikey"` 的 `OPENAI_API_KEY`；默认 OpenAI 服务缺少该文件凭据时可读进程 `OPENAI_API_KEY` | ChatGPT / OAuth tokens 明确不支持；自定义服务仅在明确声明 `requires_openai_auth` 时复用 API key，或读取自己指定的 `env_key` |

扫描不自动启用模型。导入前会重新读取选定来源并比较指纹；来源发生变化会要求重新扫描确认，避免端点和凭据错配。完整的网站消息、认证、取消与上游协议见 [PROTOCOL.md](PROTOCOL.md)。

## 模型列表来源与自定义模型

模型服务与模型分开保存：一个 endpoint / 凭据配置可包含多个模型，`model` 指定默认模型，`models` 保存可选择的 ID、显示名称和 effort。单个服务最多 200 个、所有服务合计最多 400 个模型。网页发送的是用户选择的模型 ID；桥接校验其属于已启用服务的列表，不能通过伪造 ID 选择未配置的模型。

处理方式参考 [cc-switch 自定义模型配置](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/codex_config.rs)与[模型列表查询](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/services/model_fetch.rs)：

- **Codex 自定义模型**：读取生效配置的 `model_catalog_json`，包含 cc-switch 生成的 `cc-switch-model-catalog.json`。支持 `{models:[{slug,display_name,supported_reasoning_levels,default_reasoning_level,...}]}`，跳过隐藏或明确不能通过 API 使用的模型，并保留配置中的默认模型。目录读取与配置扫描均有大小限制；导入前将目录内容一起核对指纹，文件变化需重新扫描。
- **Claude 自定义模型**：读取显式模型映射、名称和 `modelPicker.options`；不会把 `sonnet` / `opus` 等 CLI 别名原样传给 API。配置导入是一次快照，不是完整的 CLI 配置层级或组织策略解释器；之后在桥接内手动编辑的模型不声称受 CLI 的 `availableModels` 策略管理。
- **当前 API 的候选列表**：服务保存后点「从 API 获取模型」，使用该服务自己的 endpoint 与凭据，仅执行只读列表查询。支持 OpenAI 风格 `data[].id` 和 Codex 风格 `models[].slug`，以及 Anthropic 分页；未知能力只保留默认 effort。勾选所需模型后加入并保存，避免把向量/图片等非聊天模型全部加入聊天菜单；接口缺失或失败时保留现有配置，仍可手填。模型 ID 可包含服务商自定义名称或代理路由前缀，不按官方品牌过滤。查询不生成回答。

**默认 OpenAI provider 的目录与通用 `/v1/models` 不同。** [Codex 官方 App Server 文档](https://learn.chatgpt.com/docs/app-server#list-models-modellist)提供 `codex app-server` 的 `model/list`，在 `initialize` / `initialized` 后调用，返回可见模型及 `supportedReasoningEfforts`。Codex 的模型管理器根据登录方式、版本与目录配置决定来源：ChatGPT 登录通常读取 Codex 后端的账号目录；API-key 模式在未启用远端发现或不满足发现条件时使用 CLI 内置目录。仅改 `model_provider` 名称或 `base_url` 不保证读取该 API 的模型列表。显式 `model_catalog_json` 优先于远端目录。官方[模型目录说明](https://learn.chatgpt.com/docs/model-catalogs)区分富元数据的 Codex catalog 与通用 `/v1/models`，并说明自定义 API-key provider 需要显式 `model_catalog_url` 等条件才会远端发现。`note-bridge` 暂不自动访问此可跨域的 URL，使用本地 `model_catalog_json` 或已保存 API 基础地址的模型接口。

cc-switch 在需要混合官方与自定义模型时，[单独缓存官方目录](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/services/provider/codex_official_models.rs)，按账号与 Codex 版本隔离，并使用 `codex debug models --bundled` 兜底。它不会把缺少可靠账号/版本来源的全局 `~/.codex/models_cache.json` 直接用作官方目录。

Claude Agent SDK 也提供 [`supportedModels()`](https://code.claude.com/docs/en/agent-sdk/typescript#modelinfo)，较新 CLI 返回解析后的 `resolvedModel` 与 effort 能力。该接口属于 Claude Code 执行环境。当前 note-bridge 保持 **API 直连**：读取明确的本地模型配置并查询导入服务的 API，不自动启动 CLI，不拿 CLI 官方目录覆盖第三方服务，不读取全局模型缓存或订阅 OAuth。没有本地多模型目录时先保留已配置的默认模型，其余通过当前 API 获取或手动添加。

## 安全边界

桥接仅绑定 IPv4 回环地址；握手校验网站 Origin。短时一次性配对码验证成功后，直接签发与 Origin 绑定的持久授权令牌。每个标签页拥有独立连接，同一授权可用于多个标签页，互不挤下线。最多保存 32 个授权，不自动过期；达到上限时需先撤销不用的授权。允许列表仍在每次连接时检查，保留授权不会绕过来源检查。

停止服务、退出应用或关闭网页会终止相关连接和请求，但不会删除授权。桌面撤销授权，或已认证网站发送 `auth.forget`，才会删除该授权并关闭其所有标签页连接；旧令牌随即失效。网站离线时的「忘记连接」及清除浏览器数据仅移除浏览器端凭证，桌面端的离线授权仍可单独撤销。网站不能通过消息自行添加模型服务、读取 API 密钥或放宽允许来源。

这保证 API 凭据留在本机，但问答内容仍会发送给所选模型服务。允许列表应对应实际使用的网站，配对码仅输入这些网站。应用不会替网站改变浏览器的本地网络访问策略，也不会关闭系统防火墙或浏览器安全设置。

文档工具只在已认证网页执行，限定为 `get_document`、`get_toc`、`get_knowledge_network`、`get_related_documents`、`search_documents`、`get_knowledge_overview`；桥接不执行本地代码、不按工具参数请求任意 URL，也不通过工具开放服务配置或本机文件。网页工具结果必须匹配原连接、请求和待处理调用。每次回答最多 8 个模型轮次、16 次工具调用；单次工具等待 30 秒，整个回答（包含工具）限时 3 分钟。取消、断连或撤销同时终止模型请求和工具等待。工具正文、私有 reasoning 和签名只在内存中用于当次上游续轮，不写桥接日志。

## 构建、预览包与发布

`.github/workflows/note-bridge.yml` 独立验证前端与 Rust 核心，并在 macOS / Windows 主机分别执行核心测试，随后尝试构建 macOS Apple Silicon、macOS Intel、Windows x64 预览安装包。PR 构建产物保留 14 天，供人工安装验收。CI 构建成功本身不证明托盘、系统凭据库或浏览器配对在对应平台已通过实机验收。

版本需同步更新 `package.json` / `package-lock.json`、根 `Cargo.toml` / `Cargo.lock`、`src-tauri/Cargo.toml` 和 `src-tauri/tauri.conf.json`。使用独立标签 `note-bridge-v0.1.0`。推送标签只触发验证和打包；需要准备发行时，在该标签上手动运行 workflow 并勾选 `draft_release`，才会创建待审核的 GitHub Release 草稿。

当前流水线未配置 Windows 代码签名或 Apple Developer ID 签名 / 公证凭据。生成的是未签名评估包，不能承诺消除 SmartScreen / Gatekeeper 提示。正式发行需接入组织的签名与公证流程并完成验收；本次实现不会自动公开发行安装包。

## 验证记录与待验收矩阵

2026-10-23 已在 macOS 上使用 Playwright Chromium `156.0.8078.4`，从真实 `https://note.ismy.wang` 页面连接 `ws://127.0.0.1:19661/ws`。浏览器保持默认权限，未调用 `grantPermissions`，未关闭安全功能；实测完成配对并收到 `auth.ok`、`chat.delta` 和 `chat.done`。该页面当时返回 HTTP 200、无 CSP 响应头。验证使用隔离的临时目录、内存凭据库和本机 mock 模型，没有读取个人 CLI 配置或调用付费模型。可通过 Rust `browser_probe` example 和 `scripts/browser-probe.mjs` 复现。

桌面 GUI 自动测试使用测试专用 Tauri IPC fixture，覆盖生成短时配对码且无桌面审批步骤、留空保留密钥、保存失败时清空密钥并展示错误、日志过滤/导出、普通浏览器禁用原生操作；持久授权新增在线/离线显示、离线撤销，以及停止服务后保留授权的回归覆盖。它们不验证系统凭据库、原生托盘或安装包运行。

同日，在 macOS `27.0.1`（Apple Silicon）通过 `cargo check --locked -p note-bridge-desktop`，并实际构建 `.app` 和 `note-bridge_0.1.0_aarch64.dmg`。直接启动构建的 `.app` 后，实测空配置初始停止、原生 IPC 启动服务、关闭窗口后进程继续运行，以及 Command-Q 退出后进程和监听端口消失。此次未扫描个人 CLI 配置、未写入 API 凭据，也未执行从 DMG 安装的流程。菜单栏操作、二次启动单实例和 Keychain CRUD 仍待人工验收。

上述记录仅说明该 macOS / Chromium 版本的实际链路通过，不代表 Chrome、Edge、Firefox、Safari 或 Windows 已通过。下表仍是待执行清单。先用无付费的本机 mock API 完成流程，再按需使用真实服务做少量人工验证。

| 环境 | 待验证项目 | 状态 |
| --- | --- | --- |
| macOS Apple Silicon | DMG 安装、单实例、菜单栏启停与退出、Keychain 保存/编辑/删除 | 待实机验证；构建及直接启动 `.app` 的部分冒烟已完成，见上文 |
| macOS Intel | 构建产物安装、单实例、关闭隐藏、菜单栏启停与退出、Keychain 保存/编辑/删除 | 待实机验证 |
| Windows x64 | 安装、WebView2、单实例、托盘启停与退出、Credential Manager 保存/编辑/删除 | 待实机验证 |
| Chrome / Edge + HTTPS 网站 | 本地网络授权提示、回环 WS、配对码直连、流式问答、取消与重连 | 待实机验证 |
| Firefox + HTTPS 网站 | 回环 WS、配对、流式问答、取消与重连 | 待实机验证 |
| Safari + HTTPS 网站 | 混合内容 / 本地网络限制、回环 WS；策略阻止时的界面提示 | 待实机验证，不预先承诺可用 |
| 本机开发站点 | 显式 Origin 允许列表、错误端口、错误配对码、失效配对码/撤销授权、刷新和服务重启后自动重连、多标签共享授权 | 待实机验证 |

还需覆盖服务端口占用、服务商超时/错误、系统凭据库拒绝访问、应用退出后请求终止，以及导出的日志不包含测试密钥或问答正文。若浏览器策略阻止 HTTPS 页面连接本机 WS，应在界面报告原因；不以关闭浏览器安全功能作为解决方案。
