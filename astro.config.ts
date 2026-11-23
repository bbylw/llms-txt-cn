import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import type { AstroIntegration } from "astro";
import tailwindcss from "@tailwindcss/vite";
import nimbus, {
  defineConfig as defineNimbusConfig,
} from "@cloudflare/nimbus-docs";
import { tableScroll } from "@cloudflare/nimbus-docs/markdown";

const TEXT_MEDIA_TYPE_RE =
  /^(text\/(plain|markdown|mdx|html|css|javascript|xml)|application\/(javascript|xml))$/i;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const BOM_EXTENSIONS = new Set([".txt", ".md", ".mdx"]);

function withUtf8Charset(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return TEXT_MEDIA_TYPE_RE.test(trimmed) ? `${trimmed}; charset=utf-8` : value;
}

function patchHeaderBag(headers: unknown): unknown {
  if (Array.isArray(headers)) {
    const out = [...headers];
    for (let i = 0; i < out.length - 1; i += 2) {
      if (String(out[i]).toLowerCase() === "content-type") {
        out[i + 1] = withUtf8Charset(out[i + 1]);
      }
    }
    return out;
  }
  if (headers && typeof headers === "object") {
    const record = { ...(headers as Record<string, unknown>) };
    for (const key of Object.keys(record)) {
      if (key.toLowerCase() === "content-type") {
        record[key] = withUtf8Charset(record[key]);
      }
    }
    return record;
  }
  return headers;
}

function walkStaticTextFiles(dirPath: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "_astro" || entry.name === "pagefind") continue;
      files.push(...walkStaticTextFiles(path.join(dirPath, entry.name)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (BOM_EXTENSIONS.has(ext)) {
      files.push(path.join(dirPath, entry.name));
    }
  }
  return files;
}

/** Ensures dev responses include charset=utf-8 and static .txt/.md/.mdx with non-ASCII bytes carry a UTF-8 BOM. */
function utf8OutputIntegration(): AstroIntegration {
  return {
    name: "utf8-output",
    hooks: {
      "astro:server:setup"({ server }) {
        server.middlewares.use((_req, res, next) => {
          const origSetHeader = res.setHeader.bind(res);
          res.setHeader = ((name: string, value: number | string | readonly string[]) => {
            if (name.toLowerCase() === "content-type") {
              return origSetHeader(name, withUtf8Charset(value) as string);
            }
            return origSetHeader(name, value);
          }) as typeof res.setHeader;

          const origWriteHead = res.writeHead.bind(res);
          res.writeHead = ((statusCode: number, reasonOrHeaders?: unknown, maybeHeaders?: unknown) => {
            if (typeof reasonOrHeaders === "string") {
              return (origWriteHead as Function)(
                statusCode,
                reasonOrHeaders,
                patchHeaderBag(maybeHeaders),
              );
            }
            return (origWriteHead as Function)(statusCode, patchHeaderBag(reasonOrHeaders));
          }) as typeof res.writeHead;

          next();
        });
      },
      "astro:build:done"({ dir }) {
        const outDir = fileURLToPath(dir);
        if (!fs.existsSync(outDir)) return;
        for (const filePath of walkStaticTextFiles(outDir)) {
          const buf = fs.readFileSync(filePath);
          const hasBom =
            buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
          if (hasBom) continue;
          const hasNonAscii = buf.some((b) => b >= 0x80);
          if (!hasNonAscii) continue;
          fs.writeFileSync(filePath, Buffer.concat([UTF8_BOM, buf]));
        }
      },
    },
  };
}

const nimbusConfig = defineNimbusConfig({
  site: "https://llmstxt.cn",
  title: "llms.txt 中文站",
  description:
    "/llms.txt 规范 v2 中文站：通过结构化 Markdown 索引与标准 Link 关系，让 AI 智能体高效读取网站核心内容。",
  locale: "zh-CN",
  homeLabel: "首页",
  github: "https://github.com/AnswerDotAI/llms-txt",
  socialImageAlt: "llms.txt v2 中文规范与文档",
  sidebar: {
    indexDisplay: "header-link",
    items: [
      {
        label: "核心规范",
        icon: "ph:book-open-text",
        items: [
          "docs",
          "docs/background-and-proposal",
          "docs/format",
          "docs/existing-standards",
        ],
      },
      {
        label: "实践与示例",
        icon: "ph:code",
        items: [
          "docs/examples",
          "docs/domains",
          "docs/nbdev-guide",
          "docs/parser",
          "docs/python-cli",
          "docs/python-source",
          "docs/ed-demo",
        ],
      },
      {
        label: "生态与演进",
        icon: "ph:compass",
        items: [
          "docs/integrations",
          "docs/changes",
          "docs/community",
        ],
      },
    ],
  },
});

export default defineConfig({
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    nimbus(nimbusConfig, {
      rules: {
        "nimbus/frontmatter-shape": "error",
        "nimbus/internal-link": "error",
      },
      markdown: {
        hastPlugins: [tableScroll()],
        features: { headingAttributes: true },
        componentMap: {
          LlmsPlayground: {
            revision: "llms-playground-v1",
            render: () =>
              "> 交互式 llms.txt v2 解析与校验演练场（请在网页版中在线运行，或参考下文完整 JavaScript 解析源码）。",
          },
        },
      },
    }),
    utf8OutputIntegration(),
  ],
});
