# `/llms.txt` 文件规范 v2（中文版）

> 在线中文站点与完整文档：[https://llms-txt.ndjp.net/](https://llms-txt.ndjp.net/)  
> 原文来源：[AnswerDotAI/llms-txt · `nbs/index.qmd`](https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd)（初版：2024-09-03 · v2 修订：2026-08-10 · 作者：Jeremy Howard）  
> 提案摘要：建议网站标准化使用 `/llms.txt` 文件，向 AI 智能体提供高效使用网站所需的结构化信息。

## 背景

如今，AI 智能体正在持续不断地访问各类网站：编程智能体拉取框架文档以确保 API 调用准确无误，具备检索能力的对话助手则通过阅读网页来解答关于某款产品的问题。当本提案于 2024 年首次撰写时，这在很大程度上还只是一种预测；而在今天，它已成为日常常态。

然而，传统网页是为人眼阅读而构建的。一个 HTML 页面会把核心信息包裹在导航栏、广告与 JavaScript 代码之中，将其反向还原为干净文本既困难又不精确。另一方面，尽管大语言模型的上下文窗口已经比过去大了许多，但仍不足以完整装下大多数网站的全部内容，且每一个浪费的 Token 都在消耗额外的时间与成本。将精炼、专家级的信息集中汇总在一个单一且易于访问的位置，才能最有效地服务智能体。

本文档为提案的 **v2 版本**，基于两年社区实践的经验修订而成：目前已有数千个网站发布了 `llms.txt` 文件，[文档平台也在自动生成该文件](https://www.mintlify.com/docs/ai/llmstxt)，Chrome 的 Lighthouse 也已将其[纳入智能体浏览（Agentic Browsing）审计检查项](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt)。主流 AI 实验室自身也纷纷为开发者文档发布了 `llms.txt`：[OpenAI](https://developers.openai.com/llms.txt)、[Anthropic](https://docs.anthropic.com/llms.txt) 以及 [Gemini](https://ai.google.dev/gemini-api/docs/llms.txt)。关于自 v1 以来的具体变更及原因，请参阅[变更记录（Changes）](https://llmstxt.org/changes.html)（[中文译注](https://llms-txt.ndjp.net/docs/changes/)）。

## 核心提案

我们建议网站添加一个 `/llms.txt` Markdown 文件，以提供对大语言模型友好的内容。该文件可以放置在站点根路径，也可以放置在站点内的任意子路径下，用于覆盖该路径下的所有页面。该文件提供简明扼要的背景信息、使用指引以及指向详细 Markdown 文档的链接。

`llms.txt` 的 Markdown 既具备良好的人类与大模型可读性，同时又采用精确的格式规范，允许通过确定性的程序手段（即解析器、正则表达式等传统编程技术）直接处理。

我们进一步建议：包含智能体可能需要的信息的页面，应当在原始页面的同一 URL 处提供干净的 Markdown 版本——既可以在原 URL 末尾追加 `.md`（例如 `page.html.md`），也可以将原有扩展名替换为 `.md`（例如 `page.md`）。（不含文件名的目录 URL 则应改为追加 `index.html.md` 或 `index.md`。）

为了帮助客户端发现这些文件，我们推荐使用标准的 Link 关系：`rel="alternate" type="text/markdown"` 指向当前页面的 Markdown 版本，`rel="describedby"` 指向覆盖该页面的 `llms.txt` 文件。（一个 `llms.txt` 文件负责描述其所在路径下的所有页面，因此 `/docs/llms.txt` 覆盖 `/docs/` 下的全部内容。）这些链接可以通过 HTML 的 `<link>` 元素提供，也可以通过 HTTP `Link:` 响应头返回。HTTP 响应头形式同样适用于非 HTML 资源（例如 Markdown 文件自身），并且可以在 Web 服务器或 CDN 配置中直接添加，无需修改任何页面源码。例如：

```http
Link: </docs/page.html.md>; rel="alternate"; type="text/markdown", </docs/llms.txt>; rel="describedby"
```

[FastHTML 项目](https://fastht.ml)为其文档同时落地了这两项建议。例如，这里有放在 `/docs/` 下、专门覆盖文档页面的 [FastHTML 文档 `llms.txt`](https://www.fastht.ml/docs/llms.txt)；同时这里还有一个[常规 HTML 文档页面](https://www.fastht.ml/docs/tutorials/by_example.html)及其同路径下带有 [`.md` 扩展名的版本](https://www.fastht.ml/docs/tutorials/by_example.html.md)。

智能体的预期工作流是：先查看或检索 `llms.txt` 找到所需信息，再按需追踪相关链接。因此，`llms.txt` 中的链接应当指向对大模型友好的内容（如上述页面的 Markdown 版本）。文件本身保持足够小巧以轻松装入上下文；详细内容则保留在链接背后，仅在需要时才去拉取。

目前 `llms.txt` 应用最广泛的领域是软件文档——编程智能体顺着它来查找 API 参考与开发教程。同样的结构也适用于任何需要为智能体提供站点导览路径的场景：例如展示业务结构与政策的企业官网、回答个人履历相关问题的个人主页，或是提供课程信息入口的学校站点。

值得一提的是，所有 [nbdev](https://nbdev.fast.ai/) 项目现在默认都会为全部页面生成 `.md` 版本；所有使用 `nbdev` 的 Answer.AI 与 fast.ai 软件项目都已基于此特性重新生成了文档。可参考 [`fastcore` 中 `docments` 模块](https://fastcore.fast.ai/docments.html) 对应的 [Markdown 版本](https://fastcore.fast.ai/docments.html.md)。

## 格式规范

目前大语言模型理解得最广泛、最轻松的格式就是 Markdown。仅仅指明关键 Markdown 文件的位置，就已经是非常好的第一步；而提供适度的基础结构，能进一步帮助语言模型准确找到所需信息的来源。

`llms.txt` 文件的独特之处在于，它使用 Markdown 而非 XML 等传统结构化格式来组织信息。原因在于我们预期这些文件将主要由大语言模型与智能体直接阅读；尽管如此，`llms.txt` 中的信息依然遵循精确的顺序格式，可以使用常规编程工具可靠解析。

`llms.txt` 规范适用于位于网站根路径 `/llms.txt` 或任意子路径（如 `/docs/llms.txt`）的同名文件。单个文件覆盖其所在路径及之下的所有 URL；当多个文件同时适用时，智能体应当采用路径最具体的那一份。符合规范的文件按特定顺序包含以下 Markdown 区块：

- 可选的字节序标记（BOM）
- 包含项目或站点名称的一级标题（H1），这是**唯一必填**的区块
- 紧随其后的引用块（blockquote），用简短摘要概括理解本文件其余部分所需的项目关键信息
- 零个或多个任意类型的 Markdown 内容区块（如段落、列表等，但**不能包含标题**），用于补充更详细的项目背景以及如何解读所提供文件的说明
- 零个或多个以二级标题（H2）分隔的区块，包含提供进一步详情的 URL “文件列表”
  - 每个“文件列表”均为 Markdown 无序列表，每项必须包含 Markdown 超链接 `[名称](url)`，其后可选跟一个冒号 `:` 与关于该文件的补充说明

以下为一个结构模板示例：

```markdown
# Title

> Optional description goes here

Optional details go here

## Section name

- [Link title](https://link_url): Optional link details

## Optional

- [Link title](https://link_url)
```

按照惯例，`Optional` 区块用于存放次要信息——即当需要更精简的上下文时，智能体可以跳过的链接。

## 与现有标准的关系

`llms.txt` 旨在与现有 Web 标准协同共存。`sitemap.xml` 面向搜索引擎列出全站页面，而 `llms.txt` 为大语言模型提供精选概览；它可以与 `robots.txt` 互补，为允许访问的内容提供上下文背景；此外，文件还可以引用站点使用的结构化数据标记，帮助模型在上下文中正确理解这些数据。

采用标准固定文件名的思路延续了站点根目录 `/robots.txt` 与 `/sitemap.xml` 的传统。正如 `index.html` 为任意路径提供了一个人类可读入口的约定位置一样，`llms.txt` 也为任意路径提供了一个大模型可读概览的约定位置。`robots.txt` 与 `llms.txt` 的职责各不相同：`robots.txt` 告知自动化工具哪些访问是被允许的（例如用于搜索引擎索引爬虫）；而 `llms.txt` 则在智能体协助用户查询某个主题时**按需使用**。我们原先预期 `llms.txt` 主要服务于**推理阶段（inference）**而非**训练阶段（training）**，实际落地情况也印证了这一点——当然训练流程同样可以利用这些信息。

另一种可选方案是 Well-Known URI 标准（RFC 8615），它为类似元数据文件保留了 `/.well-known/` 前缀。但 well-known URI 只能存在于源站根目录，而许多作者仅对共享主机上的某个子路径拥有控制权——例如 GitHub Pages 项目站点可以在自己的目录下发布文件，却永远无法向托管域名根目录的 `/.well-known/` 添加文件。与 `index.html` 类似，`llms.txt` 描述其所在的当前路径，这是单一根路径位置无法表达的能力；只要你能在某个路径下发布内容，就可以提供一个 `llms.txt`。

`sitemap.xml` 列出了站内所有可被索引的人类可读网页，但它并不能替代 `llms.txt`，原因在于：

- 它通常不会列出专为大模型阅读优化的页面版本
- 它不包含指向外部站点的 URL，即便这些外部资料对理解当前项目很有帮助
- 它涵盖的全站文档汇总后往往过大，无法装入大模型的上下文窗口，并且包含大量理解站点核心内容所不需要的冗余页面

## 完整示例

下面是一份精简自 FastHTML 项目的 `llms.txt` 示例（也可查看[完整版本](https://www.fastht.ml/docs/llms.txt)）：

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

编写高质量 `llms.txt` 文件时，建议遵循以下准则：

- 使用简明、清晰的语言。
- 链接外部或站内资源时，附上简短且有信息量的说明。
- 避免使用含糊词汇或未经解释的行话缩写。
- 实际测试你的文件：仅以你的 `llms.txt` 作为起点，向智能体提出关于你网站内容的问题以检验效果。

## 公共目录

以下几个开放目录网站专门收录互联网上已发布的 `llms.txt` 文件：

- [llmstxt.site](https://llmstxt.site/)
- [directory.llmstxt.cloud](https://directory.llmstxt.cloud/)
- [llmstxthub.com](https://llmstxthub.com/)

## 生态集成

许多文档平台与内容管理系统已支持自动生成 `llms.txt` 文件：

- [Mintlify](https://www.mintlify.com/docs/ai/llmstxt) - 为其托管的每个文档站点自动生成 `llms.txt` 与 Markdown 页面版本
- [GitBook](https://www.gitbook.com/blog/what-is-llms-txt) - 为已发布的文档站点自动提供 `llms.txt` 文件
- [Yoast SEO](https://yoast.com/features/llms-txt/) - 自动生成并维护 `llms.txt` 文件的 WordPress 插件
- [AIOSEO](https://aioseo.com/features/llms-txt/) - 内置 `llms.txt` 生成器的 WordPress 插件
- [Wix](https://support.wix.com/en/article/understanding-your-sites-llmstxt-file) - 为每个 Wix 站点自动生成 `llms.txt` 文件

同时也有各类开源库与插件，可将 `llms.txt` 规范集成到你的工程工作流中：

- [JavaScript 参考实现](https://llmstxt.org/llmstxt-js.html) - 官方 JavaScript 解析示例（[中文在线演练场](https://llms-txt.ndjp.net/docs/parser/)）
- [`vitepress-plugin-llms`](https://github.com/okineadev/vitepress-plugin-llms) - 为 VitePress 站点自动遵循 `llms.txt` 规范生成大模型友好文档的插件
- [`docusaurus-plugin-llms`](https://github.com/rachfop/docusaurus-plugin-llms) - 在 Docusaurus 中遵循规范生成大模型友好文档的插件
- [Drupal LLM Support](https://www.drupal.org/project/llm_support) - 为任意 Drupal 10.3+ 站点提供完整 `llms.txt` 支持的 Drupal Recipe
- [`llms-txt-php`](https://github.com/raphaelstolt/llms-txt-php) - 用于读写和解析 `llms.txt` Markdown 文件的 PHP 工具库
- [`VS Code PagePilot Extension`](https://dmux.github.io/pagepilot) - VS Code Chat 扩展参与者，可自动加载外部上下文（文档、API、README）以增强回答质量
- [`server-llm-txt`](https://github.com/mcp-get/community-servers/tree/main/src/server-llm-txt) - MCP 服务端，使智能体能够拉取并检索 `llms.txt` 文件

## 后续参与

`llms.txt` 规范欢迎社区持续贡献与反馈。[GitHub 仓库](https://github.com/AnswerDotAI/llms-txt) 托管了[这份非正式概览文档](https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd)，便于进行版本控制与公开讨论；同时欢迎加入[社区 Discord 频道](https://discord.gg/aJPygMvPEN)，分享你的实施经验并探讨最佳实践。
