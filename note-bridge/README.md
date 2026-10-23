# note-bridge

独立的 Tauri 2 + Rust + Svelte 5 桌面应用。它读取本机 Claude Code / Codex 的 **API 配置**，将选定的模型服务通过本机 WebSocket 提供给 note 文档问答。网页只获得服务信息和问答流，不读取本机配置文件或 API 凭据。

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

1. 在「模型服务」扫描 Claude Code / Codex 配置；也可显式填写配置目录，或手动添加 API 基础地址、模型和凭据。扫描结果需要点「导入并启用」才会加入模型列表。
2. 配置「连接与配对」中允许的网站 Origin。Origin 是完整的协议、主机和端口，例如 `https://notes.example.com`，不包括 URL 路径，也不使用通配符。
3. 启动服务，默认监听 `127.0.0.1:19661`，WebSocket 地址为 `ws://127.0.0.1:19661/ws`；首次打开应用不会自动启动监听。
4. 生成配对码，在网站文档问答的本地桥接设置中填写地址和配对码；回到桌面应用核对完整网站来源并批准。
5. 网站选择已启用的模型服务后即可提问。需要时在桌面应用撤销网站授权、停用模型服务或停止桥接。

关闭窗口会隐藏到系统托盘 / macOS 菜单栏；通过托盘可显示窗口、启停服务或彻底退出。再次打开应用会唤起已有实例。退出时会停止桥接和活动请求。

编辑服务时，密钥输入框始终为空；留空表示保留原有凭据。选择「无需凭据」会移除保存的凭据。新的输入提交后会清空。连接测试会发送最小模型请求，可能产生少量服务商费用；自动测试不调用真实付费服务。

## 配置与凭据

- Claude 默认扫描 `~/.claude`，并遵循 `CLAUDE_CONFIG_DIR`；Codex 默认扫描 `~/.codex`，并遵循 `CODEX_HOME`。桌面应用允许覆盖目录。
- 只支持可直接用于 API 的 key / bearer token。Claude / ChatGPT 订阅 OAuth 登录不是 API key，不会被隐式转换或拿去调用第三方接口。
- 应用自己的非敏感元数据写入系统应用数据目录。macOS 凭据使用 Keychain，Windows 使用 Credential Manager。读取、保存、删除凭据均由 Rust 处理。
- GUI 仅接收去除凭据后的状态；网站 WebSocket 不开放配置扫描、导入、凭据管理或文件访问接口。
- 支持 Anthropic Messages、OpenAI Responses、OpenAI Chat Completions。填写对应协议的 API 基础地址，由适配器追加端点。远程地址须为 HTTPS；本机回环 API 可用 HTTP。
- 日志记录请求 ID、模型、状态和耗时，不记录 API key、问答正文或上游响应正文。GUI 支持过滤、清空和经原生文件对话框导出日志。

当前发现范围是用户配置目录及显式指定的目录，不扫描项目级配置、不合并组织策略，也不自动跨 Windows / WSL 读取另一环境的配置。环境变量取自桌面应用进程继承的环境；不会执行 shell、凭据 helper 或 hooks。

| 配置来源 | 当前支持的字段 / 结构 | 需要手动处理的情况 |
| --- | --- | --- |
| Claude `settings.json` | 同一文件的 `env.ANTHROPIC_BASE_URL`、`ANTHROPIC_MODEL`、`ANTHROPIC_API_KEY` 或 `ANTHROPIC_AUTH_TOKEN`；模型可回退到顶层 `model` | `sonnet` / `opus` / `haiku` / `default` / `opusplan` 别名需改为完整 API 模型 ID；同时存在两种凭据视为冲突；不执行 `apiKeyHelper`，不复用 OAuth |
| Codex `config.toml` | `model`、`model_provider`、`model_providers.*.base_url`、`wire_api`（`responses` / `chat`）、`env_key`、`requires_openai_auth` | 额外 `http_headers` / `env_http_headers` / `experimental_bearer_token` 标记为不支持；不会猜测未知 `wire_api` |
| Codex profiles | 内联 `[profiles.<name>]` 及同目录最多 64 个 `*.config.toml`；覆盖 `model` / `model_provider`，同名 provider 表整体替换 | 不模拟 CLI 所有覆盖规则；缺少凭据或完整模型 ID 时需手动配置 |
| Codex `auth.json` | `auth_mode: "apikey"` 的 `OPENAI_API_KEY`；默认 OpenAI 服务缺少该文件凭据时可读进程 `OPENAI_API_KEY` | ChatGPT / OAuth tokens 明确不支持；自定义服务仅在明确声明 `requires_openai_auth` 时复用 API key，或读取自己指定的 `env_key` |

扫描不自动启用模型。导入前会重新读取选定来源并比较指纹；来源发生变化会要求重新扫描确认，避免端点和凭据错配。完整的网站消息、认证、取消与上游协议见 [PROTOCOL.md](PROTOCOL.md)。

## 安全边界

桥接仅绑定 IPv4 回环地址；握手校验网站 Origin。一次性配对码只开启短时配对流程，桌面确认后才签发与 Origin 绑定的会话令牌。网站不能通过消息自行添加服务、读取密钥或放宽允许来源。停止服务、退出应用和撤销授权会关闭相关会话及请求。

这保证 API 凭据留在本机，但问答内容仍会发送给所选模型服务。允许列表与配对批准应对应实际使用的网站。应用不会替网站改变浏览器的本地网络访问策略，也不会关闭系统防火墙或浏览器安全设置。

## 构建、预览包与发布

`.github/workflows/note-bridge.yml` 独立验证前端与 Rust 核心，并在 macOS / Windows 主机分别执行核心测试，随后尝试构建 macOS Apple Silicon、macOS Intel、Windows x64 预览安装包。PR 构建产物保留 14 天，供人工安装验收。CI 构建成功本身不证明托盘、系统凭据库或浏览器配对在对应平台已通过实机验收。

版本需同步更新 `package.json` / `package-lock.json`、根 `Cargo.toml` / `Cargo.lock`、`src-tauri/Cargo.toml` 和 `src-tauri/tauri.conf.json`。使用独立标签 `note-bridge-v0.1.0`。推送标签只触发验证和打包；需要准备发行时，在该标签上手动运行 workflow 并勾选 `draft_release`，才会创建待审核的 GitHub Release 草稿。

当前流水线未配置 Windows 代码签名或 Apple Developer ID 签名 / 公证凭据。生成的是未签名评估包，不能承诺消除 SmartScreen / Gatekeeper 提示。正式发行需接入组织的签名与公证流程并完成验收；本次实现不会自动公开发行安装包。

## 验证记录与待验收矩阵

2026-10-23 已在 macOS 上使用 Playwright Chromium `156.0.8078.4`，从真实 `https://note.ismy.wang` 页面连接 `ws://127.0.0.1:19661/ws`。浏览器保持默认权限，未调用 `grantPermissions`，未关闭安全功能；实测收到 `pair.pending`、`auth.ok`、`chat.delta` 和 `chat.done`。该页面当时返回 HTTP 200、无 CSP 响应头。验证使用隔离的临时目录、内存凭据库和本机 mock 模型，没有读取个人 CLI 配置或调用付费模型。可通过 Rust `browser_probe` example 和 `scripts/browser-probe.mjs` 复现。

另有 5 项桌面 GUI 自动测试使用测试专用 Tauri IPC fixture，覆盖明确批准来源、留空保留密钥、保存失败时清空密钥并展示错误、日志过滤/导出、普通浏览器禁用原生操作。它们不验证系统凭据库、原生托盘或安装包运行。

同日，在 macOS `27.0.1`（Apple Silicon）通过 `cargo check --locked -p note-bridge-desktop`，并实际构建 `.app` 和 `note-bridge_0.1.0_aarch64.dmg`。直接启动构建的 `.app` 后，实测空配置初始停止、原生 IPC 启动服务、关闭窗口后进程继续运行，以及 Command-Q 退出后进程和监听端口消失。此次未扫描个人 CLI 配置、未写入 API 凭据，也未执行从 DMG 安装的流程。菜单栏操作、二次启动单实例和 Keychain CRUD 仍待人工验收。

上述记录仅说明该 macOS / Chromium 版本的实际链路通过，不代表 Chrome、Edge、Firefox、Safari 或 Windows 已通过。下表仍是待执行清单。先用无付费的本机 mock API 完成流程，再按需使用真实服务做少量人工验证。

| 环境 | 待验证项目 | 状态 |
| --- | --- | --- |
| macOS Apple Silicon | DMG 安装、单实例、菜单栏启停与退出、Keychain 保存/编辑/删除 | 待实机验证；构建及直接启动 `.app` 的部分冒烟已完成，见上文 |
| macOS Intel | 构建产物安装、单实例、关闭隐藏、菜单栏启停与退出、Keychain 保存/编辑/删除 | 待实机验证 |
| Windows x64 | 安装、WebView2、单实例、托盘启停与退出、Credential Manager 保存/编辑/删除 | 待实机验证 |
| Chrome / Edge + HTTPS 网站 | 本地网络授权提示、回环 WS、配对确认、流式问答、取消与重连 | 待实机验证 |
| Firefox + HTTPS 网站 | 回环 WS、配对、流式问答、取消与重连 | 待实机验证 |
| Safari + HTTPS 网站 | 混合内容 / 本地网络限制、回环 WS；策略阻止时的界面提示 | 待实机验证，不预先承诺可用 |
| 本机开发站点 | 显式 Origin 允许列表、错误端口、错误配对码、拒绝/撤销授权 | 待实机验证 |

还需覆盖服务端口占用、服务商超时/错误、系统凭据库拒绝访问、应用退出后请求终止，以及导出的日志不包含测试密钥或问答正文。若浏览器策略阻止 HTTPS 页面连接本机 WS，应在界面报告原因；不以关闭浏览器安全功能作为解决方案。
