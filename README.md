# Wandao for DeepSeek Harness

原版 [Wandao（万能导）](https://github.com/tllovesxs/wandao) 由 [tllovesxs](https://github.com/tllovesxs) 发起，并由 [Wandao 贡献者](https://github.com/tllovesxs/wandao/graphs/contributors) 共同开发。
这个第三方 DSH 插件由 [Chronicle-IRAS](https://github.com/Chronicle-IRAS) 适配和维护。
本仓库保留上游版权和 AGPL-3.0-only 许可。随包的 Python 源码来自 [Wandao 1.5.3](https://github.com/tllovesxs/wandao/tree/4cd3436d8320b012ed004666c748778584573772)，
上游提交见 [UPSTREAM.json](UPSTREAM.json)。本仓库新增 DSH 适配层、Web 操作页、Python 协议桥接与打包测试。

将 Wandao 的主要知识迁移能力内置为 DSH 插件：平台发现、登录、目录读取、导入导出、
后台进度、停止，以及后端原本支持的增量、断点和失败重试。

**安装包已包含 Python 后端、公共模块与 26 个 Provider 清单，无需安装或克隆本地 Wandao。**
不包含原桌面程序的首页、公告、商城和自动更新界面。

## 可视化操作页

从 **0.3.0** 开始，插件会在 DSH 左侧导航中增加 **万能导**，点击进入迁移页面。
使用原生页面插槽，随插件安装、启用和卸载，无需修改 DSH 源码。

1. 选择导入或导出平台，选择“操作步骤”。参数表单按平台清单自动生成。
2. 网页登录动作会打开宿主机浏览器；登录完成后，在右侧任务中点击“我已完成网页登录”。
3. 执行扫描后，可按名称或路径搜索文档，全选当前搜索结果或清空选择，随后切换到导出动作；关闭“仅迁移勾选项”则迁移全部。修改来源路径会清空扫描和选择。
4. 导入动作会先显示确认窗口，确认目标位置后才开始写入。任务区提供进度、结果和停止按钮。
5. API 平台可展开“账号与 API 设置”填写凭证，直接保存到宿主机私有目录。
   留空保留原值，保存后清空输入框；不读取回显、不写浏览器存储、不经过模型工具。

页面复用 DSH 的认证连接，仅宿主所有者可以操作。页面任务与对话工具任务分别查询，
共用后台并发限制。路径填写的是 **宿主机绝对路径**，不是远程浏览器所在电脑的路径。
页面本身不调用模型 API；平台权限和运行环境要求仍适用。网页版和有 Web 客户端的宿主
才显示此页面，纯 CLI 仍使用原有工具。

## 环境

- DSH **0.2.2-rc.1**、Node.js 22.12+（推荐 24）。
- Python 3.10+。插件内置的是业务代码，不内置跨操作系统的 CPython 二进制。
- 涉及网页登录时，需要同一主机上的 Chrome / Edge / Chromium 及图形会话。
- 印象笔记需要在所选 Python 环境安装 `evernote-backup==1.13.1`；其余平台按各自说明
  准备账号、权限和 API 配置。Google Docs 导入保留上游 Pandoc 下载/校验流程。
- OneNote 仍限 Windows 桌面版。其余平台遵循随包清单的系统声明；
  `supported=true` 只表示声明支持当前系统，不表示已经通过真实账号验收。

## 安装

在 DSH Web 的「插件 → 实验性插件」启用「自定义插件索引」，进入「发现」并添加以下索引源，然后搜索「万能导」或 `dsh-wandao`。

```text
https://chronicle-iras.github.io/dsh-wandao/marketplace.json
```

索引中的版本固定到 Git 提交。仓库附带对应的编译产物和 Python 后端，可直接通过 DSH 安装。当前清单要求 DSH **0.2.2-rc.1**。
安装后按下节配置可读的来源目录与导出目录，再启用插件。

开发者在本目录生成安装包：

```sh
npm ci
npm run check
npm test
npm run test:python
npx playwright install chromium --only-shell
npm run build
npm run test:browser
npm run test:package
npm run pack:release
```

用户只需获得生成的 `chronicle-iras-dsh-wandao-0.3.5.tgz` 并安装：

```sh
dsh plugin --profile web add /absolute/path/to/chronicle-iras-dsh-wandao-0.3.5.tgz
```

Windows 使用实际的 `E:/.../*.tgz` 路径。包中包含编译后的 JS 和完整业务运行目录，
安装时无需本地 Wandao checkout。开发时修改插件后运行 `npm run build`，
并提交生成的 `dist/`、`runtime/bridge.py` 和 `runtime/SOURCE.json`，以便从 Git 安装。

## 配置

在 DSH profile 的 `cordis.patch.yml` 配置：

```yaml
- id: wandao
  config:
    python: /usr/bin/python3
    vaultRoots:
      - /home/me/documents
    outputRoot: /home/me/exports
    dataDir: /home/me/.local/share/dsh-wandao
    browser: /usr/bin/chromium
    timeoutMs: 300000
    maxOutputBytes: 8388608
    maxScanNodes: 200
```

Windows 将路径替换为本机绝对路径，`python` 可以是虚拟环境解释器的绝对路径或 PATH
里的命令。`browser` 可省略以使用后端自动检测。`dataDir` 默认是 `~/.dsh-wandao`，
用于私有配置、登录态和 checkpoint；业务代码始终从包内读取。
`vaultRoots` 是允许读取的本地来源根目录（不仅限 Obsidian），`outputRoot` 是导出根目录。

运行 `dsh --profile web --dump-config` 检查合成配置，然后启动 `dsh web`。
旧版的 `wandaoRoot` 配置已经移除，不再需要外部仓库路径。

0.3.1 将页面请求迁移到标准 `/api/wandao/*` 通道，修复仅转发 `/api` 的网页服务
将旧 `/wandao/*` POST 请求当作静态页面、返回 HTTP 405 的兼容问题。
从 0.3.0 升级后重新启用插件并刷新网页，确保浏览器加载新版页面代码。

0.3.2 移除会在真实 DSH 中失败的旧 `rpc.handle('/wandao')` 注册：它会从 Connection
自身的上下文读取未注入的 WebServer，导致后续 API 注册全部中断。仅使用标准 API
注册，保留所有者访问检查。成功注册会打印“Wandao
页面接口已就绪”；回归测试使用同样的独立服务上下文，覆盖此前返回 404 的情况。

## 主要流程

0.3.5 调整迁移页的信息层级、平台切换和任务记录布局，增加路径提示、文档搜索与批量选择，
并适配深浅主题及窄屏。默认导出路径使用宿主目录的分隔符，避免 Windows 路径混用斜线。
搜索框按回车仅保留搜索状态，不会触发迁移表单提交。

| 工具 | 用途 |
| --- | --- |
| `wandao_providers` | 查询随包平台、动作和当前系统声明支持情况 |
| `wandao_describe` | 查询一个 Provider 的实际字段、动作、使用说明、断点/重试声明 |
| `wandao_action` | 执行平台的登录、扫描、计划、导入或导出，返回 jobId |
| `wandao_login_done` | 用户完成网页登录后，向登录任务发送回车确认 |
| `wandao_task_status` | 查询进度、终态和有大小限制的结果预览 |
| `wandao_task_cancel` | 请求停止，保留已经写出的文件 |
| `wandao_scan` / `wandao_export` | Obsidian 本地扫描/导出的简化入口 |

飞书导出示例：先调用 `wandao_describe({providerId: "feishu-export"})`，
再执行其 `login` 动作，字段为 `wiki_url`。在弹出的浏览器中手动完成登录后，
调用 `wandao_login_done({jobId})`。随后用 `scan` 读取目录，最后用 `export` 导出。
`export` 的字段包括 `wiki_url` 和 `output`；以实际 describe 结果为准。

语雀 Markdown 导入对应 `yuque-import`：使用 `login` 登录，先运行 `plan`，
再运行 `importOne` 或 `import`。字段使用 `target_book_url` 和 `source_dir`。
真正的远端写入动作需要在用户确认后传入 `confirmWrite: true`。
这个标记不取代 DSH 自身的工具权限/审批策略。

息流导入先运行 `targets`，再把返回的页面和空间 ID 分别作为 `parent_id`、`space_id`
传给 `import`。动态目标不会被空的初始下拉选项阻挡；describe 包含目标动作的字段映射。

所有通用动作都使用相同结构：

```json
{
  "providerId": "feishu-export",
  "actionId": "export",
  "fields": {
    "wiki_url": "https://example.feishu.cn/wiki/your-document",
    "output": "/home/me/exports/feishu"
  },
  "resume": true
}
```

`docIds` 可传扫描得到的文档 ID；是否支持选中导出由动作定义决定，空数组会被拒绝。
`resume: true` 仅适用于声明支持 checkpoint 的导入/导出动作。SQLite 文件自动放在插件
私有数据目录，同一来源和目标使用稳定任务标识。增量或失败重试通过 Provider 对应的
字段启用，例如 `incremental`、`retry_failed`；字段名和能力均以 describe 为准。
Obsidian 使用增量跳过已有文件，不宣称支持 checkpoint 恢复。

## 账号与 API 凭证

万能导自身无需账号；来源/目标平台的账号与权限要求仍然保留。
`loginRequired=false` 也可能需要 API Key，例如 ima。

模型调用不得提交被标为 `private` 的字段。用户将这些字段写入
`dataDir/<pluginId>/settings.json`（pluginId 可通过 describe 查询），设置为仅本人可读。
也可以在万能导页面的“账号与 API 设置”中直接保存，无需把凭证发到对话里。
ima 的示例位置为 `dataDir/ima/settings.json`：

```json
{
  "client_id": "用户自己的 Client ID",
  "api_key": "用户自己的 API Key"
}
```

然后通过 `ima-export` 的 `saveConfig` 动作保存后端配置。印象笔记的私有设置使用
`username` 和 `password`；Google Docs OAuth 客户端 JSON 路径使用 `oauth_client`。
网页登录产生的 Cookie 和浏览器配置由后端保存在自己的私有平台目录。
不要把 settings.json 放进源码或发到对话里。插件通过 stdin 私有协议传递请求，
凭证不会放入操作系统的启动命令行；登录/配置动作不把原始响应返回模型。

## 执行边界

- 固定执行随包 Provider 清单中声明的动作，拒绝任意脚本路径、未知字段和 shell 命令。
- 来源路径、输出路径、符号链接/硬链接和源目标重叠均有检查。同一插件实例的后台
  任务串行执行，避免平台浏览器端口或输出目录冲突；不跨 DSH 实例加锁。
- 先通过停止标记请求后端结束，再按期限终止 Python 任务进程；Windows 尝试回收其
  子进程，Unix 向任务进程组发送终止信号。强制结束时可能留下部分文件，重试/断点
  能力取决于对应后端。后端独立启动的浏览器可能在取消、超时或卸载插件后继续运行
  （Unix 浏览器使用独立进程会话），需要时请在本机手动关闭；不保证回收全部浏览器。
  登录需要用户在本机交互，远程无桌面主机不会把服务器上的登录窗口自动显示到你的电脑上。
- 默认只返回目录元数据、统计与结果预览，不将整座知识库正文塞入模型上下文。
  预览会清理认证字段并截断；原始 stderr 不转发给模型。
- Job ID 属于当前 DSH 进程，重启后失效；输出文件、凭证及支持平台的 checkpoint
  保留在磁盘，下次可以按原参数重新发起任务。
- 平台限流造成的暂停保留 `result.outcome=paused`，DSH 任务标记为未成功完成，
  不会误报导出完成；解除限流后按平台支持的断点/重试方式重新发起。
- Python 运行在 DSH 宿主本机，不自动进入 DSH 的远程执行环境或命令沙箱。
- 保留 Wandao 的 AGPL-3.0-only 许可证、完整源码及随包文件 SHA256 清单
  `runtime/SOURCE.json`。构建只收集 Git 跟踪的生产文件，排除测试夹具、缓存和隐藏状态。

## 验证范围

已验证真实 Obsidian 导出、Google Docs 本地导入计划、ima 私有配置写入、
目录/动作发现、任务管线、取消和安装包脱离源码目录独立运行。
另外会对当前系统支持的全部随包后端逐一运行 CLI --help 检查导入依赖。
这不等于所有平台已经通过真实账号导入导出验收；那些需要用户有权限的测试账号。
Linux/Windows CI 已配置，尚未执行的远端 CI 不计入本地验收。
