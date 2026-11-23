# `/llms.txt` 文件，v2

> 一项旨在标准化使用 `/llms.txt` 文件向智能体提供信息、帮助其使用网站的提案。

- 作者：Jeremy Howard
- 日期：2024 年 9 月 3 日
- 修订日期：2026 年 8 月 10 日

## 背景

如今，智能体（Agents）正在持续不断地使用网站：编程智能体拉取某个代码库的文档以正确调用 API，带搜索功能的对话助手则阅读网页来回答有关产品的问题。当本提案于 2024 年首次撰写时，这在很大程度上还只是一种预测；而在今天，这已成为日常常态。

但网页是为人而构建的。一个 HTML 页面会把信息包裹在导航、广告和 JavaScript 之中，将其反向转换为干净的文本既困难又不精确。上下文窗口虽然比过去大了，但对于大多数完整网站而言仍然太小，而且每一个浪费的 Token 都会消耗时间与金钱。将精炼、专家级的信息集中在一个单一且易于访问的位置，才能最有效地服务智能体。

本文是本提案的 v2 版本，基于我从两年实际采用中学到的经验更新而成：数千个网站发布了 `llms.txt` 文件，[文档平台会自动生成它](https://www.mintlify.com/docs/ai/llmstxt)，Chrome 的 Lighthouse 也会将[检测网站是否提供该文件](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt)作为其智能体浏览（agentic browsing）审计的一部分。各大 AI 实验室自己也为自家的开发者文档发布了 `llms.txt` 文件：[OpenAI](https://developers.openai.com/llms.txt)、[Anthropic](https://docs.anthropic.com/llms.txt) 以及 [Gemini](https://ai.google.dev/gemini-api/docs/llms.txt)。[变更记录（Changes）](https://llmstxt.org/changes.html)页面说明了自 v1 以来具体发生了哪些变化以及原因。

## 提案

我们建议为网站添加一个 `/llms.txt` Markdown 文件，以提供对大语言模型（LLM）友好的内容。该文件可以放置在站点根路径，也可以放置在站点内的任意路径下，覆盖该路径下的所有页面。该文件提供简短的背景信息、使用指引以及指向详细 Markdown 文件的链接。

`llms.txt` 的 Markdown 既具备人类与 LLM 的可读性，同时也采用精确的格式，从而允许使用固定处理方法（即解析器与正则表达式等经典编程技术）进行读取。

我们进一步建议，包含智能体可能需要的信息的页面，应在与原页面相同的 URL 处提供干净的 Markdown 版本——既可以在原 URL 末尾追加 `.md`（`page.html.md`），也可以将原有扩展名替换为 `.md`（`page.md`）。（不含文件名的 URL 则应改为追加 `index.html.md` 或 `index.md`。）

为了帮助客户端找到这些文件，我们建议使用标准的 Link 关系：`rel="alternate" type="text/markdown"` 指向页面的 Markdown 版本，`rel="describedby"` 指向覆盖该页面的 `llms.txt` 文件。（一个 `llms.txt` 文件描述其所在路径下的所有页面，因此 `/docs/llms.txt` 覆盖 `/docs/` 中的全部内容。）这些链接既可以作为 HTML `<link>` 元素提供，也可以作为 HTTP `Link:` 响应头返回。响应头形式也适用于非 HTML 资源（例如 Markdown 文件本身），并且无需修改任何页面即可在 Web 服务器或 CDN 配置中添加。例如：

```
Link: </docs/page.html.md>; rel="alternate"; type="text/markdown", </docs/llms.txt>; rel="describedby"
```

[FastHTML 项目](https://fastht.ml)在其文档中遵循了这两项提案。例如，这里是放置在 `/docs/` 下、仅覆盖文档页面的 [FastHTML 文档 `llms.txt`](https://www.fastht.ml/docs/llms.txt)。这里是一个[常规 HTML 文档页面](https://www.fastht.ml/docs/tutorials/by_example.html)的示例，以及完全相同 URL 但带有 [`.md` 扩展名](https://www.fastht.ml/docs/tutorials/by_example.html.md)的版本。

预期的工作方式是：智能体查看或搜索 `llms.txt` 以找到所需信息，然后追踪相关链接。因此，`llms.txt` 文件中的链接应当指向对 LLM 友好的内容，例如上述页面的 Markdown 版本。文件本身保持足够小，以便装入上下文；详细内容保留在链接之后，仅在需要时才获取。

`llms.txt` 文件最常用于软件文档，编程智能体顺着它们查找 API 参考和教程。同样的结构适用于任何需要为智能体提供进入站点内容的引导路径的场景：概述其架构与政策的企业、回答有关个人履历问题的个人网站，或者提供课程信息访问的学校。

请注意，所有 [nbdev](https://nbdev.fast.ai/) 项目现在默认都会为所有页面创建 `.md` 版本。所有使用 `nbdev` 的 Answer.AI 和 fast.ai 软件项目都已使用该特性重新生成了文档。作为示例，可以查看 [`fastcore` 中 `docments` 模块](https://fastcore.fast.ai/docments.html)的 [Markdown 版本](https://fastcore.fast.ai/docments.html.md)。

## 格式

目前大语言模型理解得最广泛、最轻松的格式是 Markdown。仅仅指出关键 Markdown 文件在哪里就是一个很好的第一步，而提供一些基本结构则能帮助语言模型找到所需信息的来源。

`llms.txt` 文件的独特之处在于它使用 Markdown 而非 XML 等经典结构化格式来组织信息。原因是我们预期其中许多文件将由语言模型和智能体直接阅读。尽管如此，`llms.txt` 中的信息遵循特定格式，可以使用基于标准编程的工具进行读取。

`llms.txt` 文件规范适用于名为 `llms.txt`、位于网站根路径 `/llms.txt` 或任意子路径（例如 `/docs/llms.txt`）的文件。一个文件覆盖其所在路径下的 URL；当有多个文件适用时，智能体应使用最具体的一个。符合该规范的文件按特定顺序包含以下 Markdown 区块：

- 一个可选的字节序标记（BOM）
- 一个包含项目或站点名称的 H1 标题。这是唯一必填的区块
- 一个包含项目简短摘要的引用块（blockquote），包含理解文件其余部分所需的关键信息
- 零个或多个任意类型（标题除外）的 Markdown 区块（例如段落、列表等），包含关于项目的更详细信息以及如何解读所提供文件的说明
- 零个或多个由 H2 标题分隔的 Markdown 区块，包含指向提供进一步详情的 URL 的“文件列表”
  - 每个“文件列表”是一个 Markdown 列表，包含一个必填的 Markdown 超链接 `[name](url)`，其后可选跟一个 `:` 和关于该文件的说明

下面是一个模拟示例：

```markdown
# Title

> Optional description goes here

Optional details go here

## Section name

- [Link title](https://link_url): Optional link details

## Optional

- [Link title](https://link_url)
```

按照惯例，“Optional”区块用于存放次要信息：即当需要更短的上下文时智能体可以跳过的链接。

## 现有标准

`llms.txt` 旨在与当前的 Web 标准共存。`sitemap.xml` 为搜索引擎列出所有页面，而 `llms.txt` 为 LLM 提供精选概览。它可以与 `robots.txt` 互补，为允许访问的内容提供上下文背景。该文件还可以引用站点上使用的结构化数据标记，帮助 LLM 在上下文中理解这些信息。

使用标准文件名的做法延续了站点根目录下的 `/robots.txt` 和 `/sitemap.xml`。正如 `index.html` 为任意路径提供了人类可读入口的约定位置一样，`llms.txt` 也为任意路径提供了 LLM 可读概览的约定位置。`robots.txt` 和 `llms.txt` 具有不同的用途：`robots.txt` 让自动化工具知道哪些站点访问被认为是可接受的（例如用于搜索引擎索引爬虫）；而 `llms.txt` 信息则是在智能体协助用户时按需使用的。我们原本预期 `llms.txt` 主要用于**推理**而非**训练**，实际使用方式也确实如此，尽管训练过程同样可以利用这些信息。

另一种方案是 Well-Known URI 标准（RFC 8615），它为这类元数据文件保留了 `/.well-known/` 前缀。但 well-known URI 仅存在于源站根目录，而许多作者只控制共享主机上的一个路径：例如 GitHub Pages 项目站点可以在自己的目录中发布文件，但永远无法向主机的 `/.well-known/` 添加文件。与 `index.html` 一样，`llms.txt` 描述它所在的路径，这是单一根路径位置无法表达的。只要能在某个路径下发布内容，任何人都可以提供一个 `llms.txt`。

`sitemap.xml` 是站点上所有可索引的人类可读信息的列表。它不能替代 `llms.txt`，因为它：

- 通常不会列出可供 LLM 阅读的页面版本
- 不包含指向外部站点的 URL，即使这些外部 URL 可能有助于理解相关内容
- 通常涵盖汇总起来过大、无法装入 LLM 上下文窗口的文档，并且会包含大量理解该站点并不需要的信息

## 示例

下面是一份 `llms.txt` 示例，这里展示的是 FastHTML 项目所用文件的精简版（也可查看[完整版本](https://www.fastht.ml/docs/llms.txt)）：

```markdown
# FastHTML

> FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's `FT` "FastTags" into a library for creating server-rendered hypermedia applications.

Important notes:

- Although parts of its API are inspired by FastAPI, it is *not* compatible with FastAPI syntax and is not targeted at creating API services
- FastHTML is compatible with JS-native web components and any vanilla JS library, but not with React, Vue, or Svelte.

## Docs

- [FastHTML quick start](https://fastht.ml/docs/tutorials/quickstart_for_web_devs.html.md): A brief overview of many FastHTML features
- [HTMX reference](https://github.com/bigskysoftware/htmx/blob/master/www/content/reference.md): Brief description of all HTMX attributes, CSS classes, headers, events, extensions, js lib methods, and config options

## Examples

- [Todo list application](https://github.com/AnswerDotAI/fasthtml/blob/main/examples/adv_app.py): Detailed walk-thru of a complete CRUD app in FastHTML showing idiomatic use of FastHTML and HTMX patterns.

## Optional

- [Starlette full documentation](https://gist.githubusercontent.com/jph00/809e4a4808d4510be0e3dc9565e9cbd3/raw/9b717589ca44cedc8aaf00b2b8cacef922964c0f/starlette-sml.md): A subset of the Starlette documentation useful for FastHTML development.
```

要编写有效的 `llms.txt` 文件，请考虑以下准则：

- 使用简明、清晰的语言。
- 链接到资源时，附上简短且有信息量的说明。
- 避免使用含糊不清的术语或未经解释的行话。
- 通过仅向智能体提供你的 `llms.txt` 作为起点、询问关于你内容的问题来测试你的文件。

## 目录

以下是几个列出互联网上可用 `llms.txt` 文件的目录网站：

- [llmstxt.site](https://llmstxt.site/)
- [directory.llmstxt.cloud](https://directory.llmstxt.cloud/)
- [llmstxthub.com](https://llmstxthub.com/)

## 集成

许多文档平台和 CMS 可以自动生成 `llms.txt` 文件：

- [Mintlify](https://www.mintlify.com/docs/ai/llmstxt) - 为其托管的每个站点生成 `llms.txt` 和 Markdown 页面版本的文档平台
- [GitBook](https://www.gitbook.com/blog/what-is-llms-txt) - 为已发布的文档站点提供 `llms.txt` 文件
- [Yoast SEO](https://yoast.com/features/llms-txt/) - 生成并维护 `llms.txt` 文件的 WordPress 插件
- [AIOSEO](https://aioseo.com/features/llms-txt/) - 内置 `llms.txt` 生成器的 WordPress 插件
- [Wix](https://support.wix.com/en/article/understanding-your-sites-llmstxt-file) - 为每个 Wix 站点生成 `llms.txt` 文件

还有各种库和插件可将 `llms.txt` 规范集成到你的工作流中：

- [JavaScript 实现](https://llmstxt.org/llmstxt-js.html) - JavaScript 示例实现
- [`vitepress-plugin-llms`](https://github.com/okineadev/vitepress-plugin-llms) - 遵循 `llms.txt` 规范自动为网站生成 LLM 友好文档的 VitePress 插件
- [`docusaurus-plugin-llms`](https://github.com/rachfop/docusaurus-plugin-llms) - 遵循 `llmstxt.org` 标准生成 LLM 友好文档的 Docusaurus 插件
- [Drupal LLM Support](https://www.drupal.org/project/llm_support) - 为任意 Drupal 10.3+ 站点提供完整 `llms.txt` proposal 支持的 Drupal Recipe
- [`llms-txt-php`](https://github.com/raphaelstolt/llms-txt-php) - 用于编写和读取 `llms.txt` Markdown 文件的库
- [`VS Code PagePilot Extension`](https://dmux.github.io/pagepilot) - PagePilot 是一个 VS Code Chat 参与者，可自动加载外部上下文（文档、API、README 文件）以提供增强的回答
- [`server-llm-txt`](https://github.com/mcp-get/community-servers/tree/main/src/server-llm-txt) - 让智能体获取并搜索 `llms.txt` 文件的 MCP 服务器

## 后续步骤

`llms.txt` 规范面向社区开放建议。[GitHub 仓库](https://github.com/AnswerDotAI/llms-txt)托管了[这份非正式概览](https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd)，以支持版本控制与公开讨论。另设有[社区 Discord 频道](https://discord.gg/aJPygMvPEN)，可用于分享实施经验并讨论最佳实践。
