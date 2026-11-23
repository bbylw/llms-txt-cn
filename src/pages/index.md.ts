import { config } from "virtual:nimbus/config";

export const prerender = true;

export function GET() {
  const site = config.site.replace(/\/$/, "");
  const body = `# ${config.title}

> ${config.description}

本站提供 [/llms.txt](${site}/llms.txt) 规范 v2（2026 年 8 月修订版）的完整中文译注、格式解析器与行业应用示例。

## 快速入口

- [完整站点索引](${site}/llms.txt): 查看本站全部可发现文档的目录索引
- [全量汇总文档](${site}/llms-full.txt): 在单个 Markdown 文件中阅读全部文档内容
- [规范总览](${site}/docs/index.md): 中文文档首页与模块导航
- [背景与提案](${site}/docs/background-and-proposal/index.md): /llms.txt、页面 .md 版本与标准 Link 发现机制
- [格式规范](${site}/docs/format/index.md): 五段式 Markdown 语法顺序与作用域规则
- [v2 变更记录](${site}/docs/changes/index.md): 2026 年 8 月 v2 修订的关键演进
- [JavaScript 解析器](${site}/docs/parser/index.md): 参考 JavaScript 解析代码与在线演练场
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
