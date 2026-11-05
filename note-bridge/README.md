# note-bridge

独立的 Tauri 2 + Rust + Svelte 5 桌面应用，通过 **Pi durable + pi-ai** 为 note 提供持久化的全库知识助手。

当前版本 **0.2.0**，聊天协议 **v2**。网页是薄客户端；会话、消息、工具结果、引用证据、压缩与运行状态保存在 bridge 的 SQLite。正文、目录、TOC、知识网络与检索索引仍由知识站点独立发布，bridge 按需通过 HTTP 读取，不把知识库打进安装包。

0.2.0 使用全新聊天存储，不读取或导入此前浏览器 localStorage 中的聊天，也不主动删除这些旧数据。原有配对凭证和模型服务配置继续使用。v1 网站/桌面端需要升级，旧 agent 循环已移除。

## 开发与构建

模块职责、依赖边界、接口注释与重构约定见 [ARCHITECTURE.md](ARCHITECTURE.md)。

开发需要 Node.js 26.12.1、npm、Rust 和 Tauri 2 平台依赖。桌面包自带固定 Node 运行时，最终用户不需要安装 Node 或 pi CLI。macOS 最低版本随 Node 运行时提升为 **13.5**；Windows 构建目标为 x64。

```sh
cd note-bridge
npm ci
npm run agent:install
npm run agent:build
npm run desktop:dev
```

```sh
npm run build                     # Svelte / TypeScript 检查与桌面 UI 构建
npm run agent:build               # Pi worker 编译
npm run agent:test                # 隔离的 mock HTTP / SQLite 测试
npm run format:check              # 桌面和 Agent 源码格式
npm run test:ui                   # 桌面 UI 的 IPC fixture
cargo test --locked -p bridge-core # 配对/网关/目录 + 真正 Rust→Node→Pi 联调
cargo fmt --all --check
cargo clippy --locked -p bridge-core --all-targets -- -D warnings
npm run desktop:build             # 包含 Node sidecar + Pi runtime 的安装包
```

Rust 网关测试需要 Node 和已构建的 worker。开发环境从 PATH 查找 Node，可用 `NOTE_BRIDGE_NODE` 显式指定二进制；发行包使用自己的 sidecar 路径。`scripts/prepare-agent.mjs` 下载固定版本 Node、验证官方 SHA-256 后提供给 Tauri 打包。Node 依赖通过独立 lockfile 固定，安装禁用 lifecycle scripts。打包运行时与站点内容不存在构建依赖。

GUI 单独 `npm run dev` 只预览界面，不具备 Tauri 权限。开发中的网站由根目录 Vite 提供 `/ai/manifest.json` 和内容寻址资源；生产站点在构建时输出同样的数据接口。数据契约见站点实现及 [PI_AGENT_PLAN.md](PI_AGENT_PLAN.md)。

## 使用方式

1. 在桌面「模型服务」导入 Claude Code / Codex 的 API 配置，或手动设置 endpoint、模型和凭据；支持自定义服务，不要求官方 API。
2. 配置允许的网站 Origin，启动服务。默认仅监听 `127.0.0.1:19661`，先初始化 Pi/SQLite，再开放 WebSocket。
3. 生成配对码，在网站 SiteNav 的 note-bridge 入口输入；正确即可配对，无需桌面再次确认。配对码两分钟有效、一次性使用。
4. 网页记住授权 token 和端口，刷新自动重连；绿色「已连接」只表示本次认证成功。模型 API 密钥始终留在本机。
5. 任意页面从「更多工具 → 知识助手」（桌面 Alt+I）打开聊天弹窗。选择模型与 effort 后即可全库提问，也可从 bridge 获取当前文档的 TOC 并附加指定章节。
6. 左侧读取 bridge 会话列表，右侧渲染 Markdown 和可展开工具概览。关闭弹窗、切换聊天、刷新、导航和关闭网页均不取消回答；只有「停止生成」明确取消任务。
7. 再次连接后读取最新持久快照。服务重启会在校验授权、模型与运行预算后恢复未完成任务；中断的模型 HTTP 请求可能重新发送，并非原 SSE 无缝续传。明确取消的任务不会重跑。

窗口关闭后隐藏到托盘/菜单栏。停止服务或退出桌面应用会关闭 worker 并保存任务状态；显式启动服务后可恢复。工作进程意外退出时由 Rust 退避重启，网站连接会重新认证并取回状态。撤销授权会关闭对应连接并停止其活动任务。

## 数据与职责

| 内容 | 归属 |
| --- | --- |
| 正文、目录、TOC、图谱、聚类、搜索索引 | 知识站点独立发布 |
| Agent loop、压缩、重试、工具调度 | Pi worker |
| 会话、完整模型 transcript、工具结果、引用、运行预算、任务状态 | 应用数据目录 `agent/agent-v2.sqlite` |
| 配对、Origin 授权、服务配置、子进程管理 | Rust 网关 |
| 模型 API 密钥 | 系统凭据库，仅通过私有管道进入 worker 内存 |
| 网页存储 | 仅配对 token/端口和 UI 状态，不存聊天正文 |

每个会话按认证 Origin 隔离。一个 SQLite 只有一个 worker 写入；Pi transcript 是消息事实来源，网页使用分页投影，不维护另一份持久聊天副本。SQLite WAL 默认支持进程崩溃恢复，突然断电不承诺最后提交零丢失。Pi 依赖固定为 1.4.0（MIT）；pi-durable 仍为实验性 API，升级需验证数据库迁移与恢复。

六个只读工具为 `get_knowledge_overview`、`search_documents`、`get_toc`、`get_document`、`get_knowledge_network`、`get_related_documents`。工具参数由 bridge 校验，内容从站点 manifest 中的白名单资源读取并核对 hash。目录和文档更新无须升级安装包。全文检索可能滞后于正文，搜索片段仅用于找文档，引用由实际读取的正文确认。旧版本资源消失或 hash 不符会明确失败，不混用新旧内容。

工具 `output` 给模型，`details` 保存概览、来源、分页与截断信息供界面展示。网站不注册工具，不提交工具结果，也不拼接历史消息。引用保存实际 contentHash/revision；文档更新后历史证据仍保留。

## 模型与运行预算

默认上下文预算 1,000,000 tokens，输出 16,384 tokens；桌面可按模型配置，第三方接口真实能力仍以其服务为准。Pi 按模型窗口压缩上下文，原始会话不删除；不再使用网页的 40 轮/4 MiB 聊天限制。

每次提问最多 32 个普通模型请求、128 次工具调用，另留一次禁用工具的总结；整个任务 20 分钟，单工具 60 秒，上游等待 180 秒。重试/压缩请求计入持久预算，刷新与重启不重置。问题最多 20,000 字符，回答展示最多 200,000 字符；工具结果约 192 KiB，单次请求/IPC 硬上限 16 MiB。知识读取仍按章节/分页进行，不将 1M 窗口作为一次读取全库的理由。

`default` effort 表示省略上游参数，区别于 `none`；自定义值按服务协议映射，不支持时明确报错。Key、Bearer 和明确无鉴权模式分别处理。凭据不放进 Pi 的持久 stream options/checkpoint；只有实际 HTTP 发送时注入。

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

## 运行边界

网站 WebSocket 仅开放配对和持久会话产品 API，不直接暴露 Pi CLI RPC、任意文件、shell、动态扩展或模型配置管理。知识工具从绑定 Origin 的 manifest 构造请求，拒绝任意 URL/路径和重定向。模型请求只使用桌面已配置服务；网站不能替换 endpoint、读取密钥或修改授权。

pi-ai 的环境变量/文件凭据探测已禁用，仅注册 bridge 的模型配置。问答和所读文档内容会发送给用户选择的模型服务；这些正文保存在本机聊天库，不进入 Rust 运行日志。默认不安装 Pi 的 coding tools、MCP 或执行代码扩展。

协议、请求幂等和重连续传见 [PROTOCOL.md](PROTOCOL.md)。方案与研发接口约定分别见 [PI_AGENT_PLAN.md](PI_AGENT_PLAN.md)、[AGENT_V2_CONTRACT.md](AGENT_V2_CONTRACT.md)。

## 验证与发行

测试使用隔离目录、内存凭据库和 mock 模型，不读取个人 CLI 配置或调用付费模型。CI 配置覆盖网站/worker/桌面 UI、Rust 网关以及 macOS/Windows 打包。安装包仍为未签名评估包；当前未配置 Apple Developer ID 公证或 Windows 签名。

独立发行标签为 `note-bridge-v0.2.0`。CI 的 draft release 需要手动触发，不会因修改网站自动发布桌面应用。macOS/Windows 原生托盘、系统凭据库、安装后首次启动和不同浏览器的本地网络权限仍需要实机验收。

2026-10-24 本地验证：网站 1153 项单元/组件、154 项浏览器 E2E、桌面 UI 10 项、Agent 37 项、Rust 51 项全部通过；网站与桌面构建、Rust fmt/Clippy 通过。macOS Apple Silicon 0.2.0 DMG 已构建，并直接使用包内 Node 与 Pi 资源再次通过真实 Rust→Node→Pi→mock 模型/知识站点端到端测试，涵盖工具读取、断线继续及重启持久化。此测试使用隔离目录，不等同于从 DMG 安装后的 GUI/Keychain 实机验收。

职责拆分后重新通过 Agent 38 项（含测试夹具精确 Origin 路由回归）、Rust 53 项（新增两条凭据清理失败回归）、桌面 UI 10 项；严格 TypeScript 检查、Prettier、rustfmt 和整个 Rust workspace 的 Clippy 均通过。重新构建 macOS Apple Silicon DMG，并用新包内 Node/Pi 通过同一隔离端到端链路。重构保持产品协议、SQLite 格式、知识版本校验及公开 Rust API，未改变网站页面。
