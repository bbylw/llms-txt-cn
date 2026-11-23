import { mount } from "@cloudflare/nimbus-docs/client";

export interface ParsedLink {
  title: string;
  url: string;
  desc?: string;
}

export interface ParsedLlmsTxt {
  title: string;
  summary?: string;
  info: string;
  sections: Record<string, ParsedLink[]>;
}

const PRESETS: Record<string, string> = {
  fasthtml: `# FastHTML

> FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's \`FT\` "FastTags" into a library for creating server-rendered hypermedia applications.

Important notes:

- Although parts of its API are inspired by FastAPI, it is *not* compatible with FastAPI syntax and is not targeted at creating API services
- FastHTML is compatible with JS-native web components and any vanilla JS library, but not with React, Vue, or Svelte.

## Docs

- [FastHTML quick start](https://fastht.ml/docs/tutorials/quickstart_for_web_devs.html.md): A brief overview of many FastHTML features
- [HTMX reference](https://github.com/bigskysoftware/htmx/blob/master/www/content/reference.md): Brief description of all HTMX attributes, CSS classes, headers, events, extensions, js lib methods, and config options

## Examples

- [Todo list application](https://github.com/AnswerDotAI/fasthtml/blob/main/examples/adv_app.py): Detailed walk-thru of a complete CRUD app in FastHTML showing idiomatic use of FastHTML and HTMX patterns.

## Optional

- [Starlette full documentation](https://gist.githubusercontent.com/jph00/809e4a4808d4510be0e3dc9565e9cbd3/raw/9b717589ca44cedc8aaf00b2b8cacef922964c0f/starlette-sml.md): A subset of the Starlette documentation useful for FastHTML development.`,

  zh: `# Nimbus 文档框架

> Nimbus 是基于 Astro 构建的文档站框架，原生同时为人类读者与 AI 编程智能体生成结构化 HTML、Markdown 页面与 /llms.txt 索引。

核心特性：

- 所有布局、样式与组件均直接生成在用户仓库中，支持自由定制
- 除完整 HTML 页面外，每个页面自动输出对应的 index.md 与站点级索引

## 核心文档

- [五分钟快速上手](https://llmstxt.cn/docs/index.md): 安装脚手架、配置站点规范并启动本地预览
- [格式规范详解](https://llmstxt.cn/docs/format/index.md): 了解 H1、引用块与 H2 文件列表的精确顺序
- [v2 变更日志](https://llmstxt.cn/docs/changes/index.md): 2026 年 8 月修订中关于标准 Link 关系与子路径作用域的更新

## Optional

- [常见问题与对比](https://llmstxt.cn/docs/existing-standards/index.md): 与 robots.txt、sitemap.xml 及 Well-Known URI 的差异对比`,

  subpath: `# FastHTML Docs

> 本文件位于 /docs/llms.txt，仅覆盖 /docs/ 路径下的文档页面。当根目录与子路径同时存在 llms.txt 时，智能体应优先采用路径更具体的版本。

## 教程

- [逐行示例教程](https://www.fastht.ml/docs/tutorials/by_example.html.md): 通过完整案例学习路由、组件与 HTMX 交互
- [快速入门指南](https://www.fastht.ml/docs/tutorials/quickstart_for_web_devs.html.md): 面向 Web 开发者的核心概念概览

## API 参考

- [核心函数参考](https://www.fastht.ml/docs/api/core.html.md): 请求处理、响应构建与中间件接口列表`,

  empty: "",
};

export function parseLLMsTxt(raw: string): { data?: ParsedLlmsTxt; error?: string } {
  const txt = raw.replace(/^\uFEFF/, "").trim();
  if (!txt) return { error: "EMPTY" };

  function parseLinks(links: string): ParsedLink[] {
    const linkPat = /^-\s*\[(?<title>[^\]]+)\]\((?<url>[^)]+)\)(?::\s*(?<desc>.*?))?$/gm;
    return Array.from(links.matchAll(linkPat)).map((match) => ({
      title: match.groups?.title ?? "",
      url: match.groups?.url ?? "",
      ...(match.groups?.desc ? { desc: match.groups.desc } : {}),
    }));
  }

  const [start, ...rest] = txt.split(/^##\s*(.*?)$/m);
  const sections: Record<string, ParsedLink[]> = {};
  for (let i = 0; i < Math.floor(rest.length / 2); i++) {
    const name = rest[i * 2]?.trim();
    const body = rest[i * 2 + 1] ?? "";
    if (name) sections[name] = parseLinks(body);
  }

  const pat = /^#\s*(?<title>.+?)(?:\n+(?:^>\s*(?<summary>[^\n]+))?(?:\n+(?<info>.*))?)?$/ms;
  const match = start.trim().match(pat);
  if (!match?.groups?.title?.trim()) {
    return { error: "缺少必填的一级标题（# 项目名称）。规范要求文件首部必须以单个 # 标题开头。" };
  }

  return {
    data: {
      title: match.groups.title.trim(),
      ...(match.groups.summary ? { summary: match.groups.summary.trim() } : {}),
      info: (match.groups.info ?? "").trim(),
      sections,
    },
  };
}

function initPlayground(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-pg-tab]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-pg-panel]"));
  const presetsBar = root.querySelector<HTMLElement>("[data-pg-presets]");
  const presetBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-pg-preset]"));

  const input = root.querySelector<HTMLTextAreaElement>("[data-pg-input]");
  const lineCount = root.querySelector<HTMLElement>("[data-pg-line-count]");
  const output = root.querySelector<HTMLElement>("[data-pg-output]");
  const emptyBox = root.querySelector<HTMLElement>("[data-pg-empty]");
  const loadingBox = root.querySelector<HTMLElement>("[data-pg-loading]");
  const errorBox = root.querySelector<HTMLElement>("[data-pg-error]");
  const errorText = root.querySelector<HTMLElement>("[data-pg-error-text]");
  const restoreBtn = root.querySelector<HTMLButtonElement>("[data-pg-restore]");
  const copyJsonBtn = root.querySelector<HTMLButtonElement>("[data-pg-copy-json]");
  const copyJsonLabel = root.querySelector<HTMLElement>("[data-pg-copy-json-label]");

  const form = root.querySelector<HTMLFormElement>("[data-pg-form]");
  const genOutput = root.querySelector<HTMLElement>("[data-pg-gen-output]");
  const genHeader = root.querySelector<HTMLElement>("[data-pg-gen-header]");
  const genStatus = root.querySelector<HTMLElement>("[data-pg-gen-status]");
  const copyGenBtn = root.querySelector<HTMLButtonElement>("[data-pg-copy-gen]");
  const copyGenLabel = root.querySelector<HTMLElement>("[data-pg-copy-gen-label]");

  let loadTimer: number | undefined;
  let lastJson = "";

  function setCheckState(key: string, passed: boolean) {
    const el = root.querySelector<HTMLElement>(`[data-pg-check="${key}"]`);
    if (!el) return;
    if (passed) {
      el.classList.remove("border-border", "bg-muted", "text-muted-foreground");
      el.classList.add("border-success/30", "bg-success-muted", "text-success-foreground");
    } else {
      el.classList.remove("border-success/30", "bg-success-muted", "text-success-foreground");
      el.classList.add("border-border", "bg-muted", "text-muted-foreground");
    }
  }

  function renderParse() {
    if (!input || !output || !emptyBox || !errorBox || !errorText || !lineCount) return;
    const raw = input.value;
    const lines = raw ? raw.split("\n").length : 0;
    lineCount.textContent = `${lines} 行`;

    if (loadingBox) loadingBox.hidden = true;
    const res = parseLLMsTxt(raw);

    if (res.error === "EMPTY") {
      emptyBox.hidden = false;
      output.hidden = true;
      errorBox.hidden = true;
      lastJson = "";
      ["title", "summary", "sections", "links"].forEach((k) => setCheckState(k, false));
      return;
    }

    emptyBox.hidden = true;

    if (res.error || !res.data) {
      output.hidden = true;
      errorBox.hidden = false;
      errorText.textContent = res.error ?? "解析失败，请检查 Markdown 语法结构。";
      lastJson = "";
      ["title", "summary", "sections", "links"].forEach((k) => setCheckState(k, false));
      return;
    }

    errorBox.hidden = true;
    output.hidden = false;
    lastJson = JSON.stringify(res.data, null, 2);
    output.textContent = lastJson;

    const sectionValues = Object.values(res.data.sections);
    const totalLinks = sectionValues.reduce((acc, arr) => acc + arr.length, 0);
    setCheckState("title", Boolean(res.data.title));
    setCheckState("summary", Boolean(res.data.summary));
    setCheckState("sections", Object.keys(res.data.sections).length > 0);
    setCheckState("links", totalLinks > 0);
  }

  function switchTab(target: string) {
    tabs.forEach((t) => {
      const active = t.dataset.pgTab === target;
      t.setAttribute("aria-selected", String(active));
      if (active) {
        t.classList.add("bg-card", "text-foreground", "shadow-sm");
        t.classList.remove("text-muted-foreground");
      } else {
        t.classList.remove("bg-card", "text-foreground", "shadow-sm");
        t.classList.add("text-muted-foreground");
      }
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.pgPanel !== target;
    });
    if (presetsBar) presetsBar.hidden = target !== "parse";
  }

  function loadPreset(name: string) {
    if (!input || !output || !emptyBox || !loadingBox || !errorBox) return;
    if (loadTimer) window.clearTimeout(loadTimer);
    if (name === "empty") {
      input.value = "";
      renderParse();
      return;
    }
    loadingBox.hidden = false;
    output.hidden = true;
    emptyBox.hidden = true;
    errorBox.hidden = true;
    loadTimer = window.setTimeout(() => {
      input.value = PRESETS[name] ?? "";
      renderParse();
    }, 180);
  }

  function showFieldError(field: string, msg: string | null) {
    const el = root.querySelector<HTMLElement>(`[data-pg-field-error="${field}"]`);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function renderGenerated(notify = false) {
    if (!form || !genOutput || !genHeader) return false;
    const fd = new FormData(form);
    const project = String(fd.get("project") ?? "").trim();
    const siteUrlRaw = String(fd.get("siteUrl") ?? "").trim();
    const summary = String(fd.get("summary") ?? "").trim();
    const linksRaw = String(fd.get("links") ?? "").trim();

    let valid = true;
    if (!project) {
      showFieldError("project", "请填写项目或站点名称，作为规范必填的 H1 标题。");
      valid = false;
    } else {
      showFieldError("project", null);
    }

    let normalizedBase = siteUrlRaw;
    try {
      const parsed = new URL(siteUrlRaw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("protocol");
      }
      normalizedBase = parsed.origin;
      showFieldError("siteUrl", null);
    } catch {
      showFieldError("siteUrl", "请输入有效的网址，例如 https://docs.example.cn。");
      valid = false;
    }

    if (!valid) {
      if (genStatus) genStatus.textContent = "请先修正表单中的必填项。";
      return false;
    }

    const linkLines = linksRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, path = "/docs/index.md", desc] = line.split("|").map((s) => s.trim());
        const fullUrl = path.startsWith("http")
          ? path
          : `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
        return desc ? `- [${title}](${fullUrl}): ${desc}` : `- [${title}](${fullUrl})`;
      });

    const lines = [`# ${project}`];
    if (summary) lines.push("", `> ${summary}`);
    if (linkLines.length > 0) lines.push("", "## Docs", "", ...linkLines);

    genOutput.textContent = lines.join("\n");
    genHeader.textContent = `Link: </docs/page.html.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`;
    if (genStatus && notify) genStatus.textContent = "已更新生成内容与 Link 响应头。";
    return true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.pgTab ?? "parse"), { signal });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => loadPreset(btn.dataset.pgPreset ?? "fasthtml"), { signal });
  });

  restoreBtn?.addEventListener("click", () => loadPreset("fasthtml"), { signal });
  input?.addEventListener("input", renderParse, { signal });

  copyJsonBtn?.addEventListener(
    "click",
    async () => {
      if (!lastJson || !copyJsonLabel) return;
      try {
        await navigator.clipboard.writeText(lastJson);
        copyJsonLabel.textContent = "已复制";
        window.setTimeout(() => {
          copyJsonLabel.textContent = "复制 JSON";
        }, 1500);
      } catch {
        copyJsonLabel.textContent = "复制受限";
      }
    },
    { signal },
  );

  form?.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      renderGenerated(true);
    },
    { signal },
  );

  copyGenBtn?.addEventListener(
    "click",
    async () => {
      if (!genOutput?.textContent || !copyGenLabel) return;
      try {
        await navigator.clipboard.writeText(genOutput.textContent);
        copyGenLabel.textContent = "已复制到剪贴板";
        window.setTimeout(() => {
          copyGenLabel.textContent = "复制结果";
        }, 1500);
      } catch {
        copyGenLabel.textContent = "复制受限";
      }
    },
    { signal },
  );

  // Initial state
  if (input && !input.value) input.value = PRESETS.fasthtml;
  renderParse();
  renderGenerated(false);

  return () => {
    controller.abort();
    if (loadTimer) window.clearTimeout(loadTimer);
  };
}

mount("[data-llms-playground]", initPlayground);
