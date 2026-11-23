/**
 * 1200 × 630 PNG social cards rendered via @resvg/resvg-js with system CJK fonts.
 * Supports Chinese titles cleanly without missing-glyph tofu.
 */
import { Resvg } from "@resvg/resvg-js";
import { logo } from "@/components/logo";

const WIDTH = 1200;
const HEIGHT = 630;
const LEFT = 80;
const MAX_WIDTH = WIDTH - LEFT * 2;

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function charWidthUnits(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  // Wide CJK / fullwidth chars count ~1.0, ASCII ~0.56
  return code > 0x2e80 ? 1.0 : 0.56;
}

function wrapLines(text: string, fontSize: number, maxLines = 3): string[] {
  const unitsPerLine = MAX_WIDTH / fontSize;
  const tokens = text.trim().match(/[A-Za-z0-9._/:-]+|\s+|./gu) ?? [];
  const lines: string[] = [];
  let current = "";
  let currentUnits = 0;

  for (const token of tokens) {
    let w = 0;
    for (const ch of Array.from(token)) {
      w += charWidthUnits(ch);
    }

    if (currentUnits + w > unitsPerLine && current.trim().length > 0) {
      lines.push(current.trimEnd());
      const trimmed = token.trimStart();
      current = trimmed;
      currentUnits = 0;
      for (const ch of Array.from(trimmed)) currentUnits += charWidthUnits(ch);
      if (lines.length >= maxLines) break;
    } else {
      current += token;
      currentUnits += w;
    }
  }

  if (lines.length < maxLines && current.trim().length > 0) {
    lines.push(current.trim());
  } else if (lines.length === maxLines && current.trim().length > 0) {
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = last.slice(0, Math.max(1, last.length - 1)) + "…";
  }

  return lines;
}

async function renderSvgCard({
  section,
  title,
  fontSize,
}: {
  section?: string;
  title: string;
  fontSize: number;
}): Promise<Uint8Array<ArrayBuffer>> {
  const lines = wrapLines(title, fontSize, 3);
  const lineHeight = Math.round(fontSize * 1.28);
  const titleStartY = section ? 290 : 250;

  const logoScale = 36 / logo.height;
  const logoPaths = logo.paths
    .map((d) => `<path d="${d}" fill="#FAFAFA" />`)
    .join("");

  const sectionSvg = section
    ? `<text x="${LEFT}" y="220" font-family="'Geist', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif" font-size="26" font-weight="500" fill="#A3A3A3">${escapeXml(section)}</text>`
    : "";

  const titleSvg = lines
    .map(
      (line, idx) =>
        `<text x="${LEFT}" y="${titleStartY + idx * lineHeight}" font-family="'Geist', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif" font-size="${fontSize}" font-weight="600" fill="#FAFAFA">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#000000" />
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="20" fill="#181818" stroke="#272727" stroke-width="2" />
  <g transform="translate(${LEFT}, 78) scale(${logoScale.toFixed(3)})">
    ${logoPaths}
  </g>
  <text x="${LEFT + 62}" y="104" font-family="'Geist Mono', 'Microsoft YaHei', monospace" font-size="24" font-weight="600" fill="#FAFAFA">llms.txt</text>
  <rect x="${WIDTH - LEFT - 156}" y="76" width="156" height="38" rx="8" fill="#1F1F1F" stroke="#313131" stroke-width="1.5" />
  <text x="${WIDTH - LEFT - 78}" y="101" text-anchor="middle" font-family="'Geist', 'Microsoft YaHei', sans-serif" font-size="18" font-weight="500" fill="#FAFAFA">v2 规范文档</text>
  <line x1="${LEFT}" y1="148" x2="${WIDTH - LEFT}" y2="148" stroke="#272727" stroke-width="1.5" />
  ${sectionSvg}
  ${titleSvg}
  <line x1="${LEFT}" y1="518" x2="${WIDTH - LEFT}" y2="518" stroke="#272727" stroke-width="1.5" />
  <text x="${LEFT}" y="556" font-family="'Geist Mono', 'Microsoft YaHei', monospace" font-size="20" fill="#A3A3A3">llms-txt.ndjp.net · /llms.txt v2 中文文档</text>
  <text x="${WIDTH - LEFT}" y="556" text-anchor="end" font-family="'Geist', 'Microsoft YaHei', sans-serif" font-size="20" fill="#A3A3A3">Answer.AI 提案中文版</text>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Microsoft YaHei",
    },
  });

  return new Uint8Array(resvg.render().asPng());
}

/** A page's social card. */
export const renderPageCard = async (input: { section?: string; title: string }) =>
  renderSvgCard({ ...input, fontSize: input.title.length > 22 ? 48 : 56 });

/** The site's social card. */
export const renderSiteCard = async (input: { title: string }) =>
  renderSvgCard({ title: input.title, section: "/llms.txt 规范 v2 中文站", fontSize: 44 });
