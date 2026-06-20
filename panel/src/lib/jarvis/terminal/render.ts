export type OutputBlock =
  | { type: "user"; text: string }
  | { type: "reply"; text: string; source?: string; model?: string; tier?: string }
  | { type: "card-kpis"; title?: string; items: { label: string; value: string }[] }
  | { type: "run-status"; agent: string; model?: string; tier?: string; note?: string }
  | { type: "nav-link"; label: string; href: string }
  | { type: "error"; text: string };

function el(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function badge(text: string, extra = ""): HTMLElement {
  return el("span", `jvt-badge ${extra}`.trim(), text);
}

export function renderBlock(block: OutputBlock): HTMLElement {
  const row = el("div", `jvt-line jvt-line-${block.type}`);
  switch (block.type) {
    case "user":
      row.append(el("span", "jvt-prompt", "jarvis ❯"), el("span", "jvt-user-text", block.text));
      break;
    case "reply": {
      row.append(el("div", "jvt-reply-text", block.text));
      const meta = el("div", "jvt-meta");
      if (block.source) meta.append(badge(block.source));
      if (block.model) meta.append(badge(block.model, "jvt-badge-amber"));
      if (block.tier) meta.append(badge(block.tier));
      if (meta.childElementCount) row.append(meta);
      break;
    }
    case "card-kpis": {
      if (block.title) row.append(el("div", "jvt-card-title", block.title));
      const grid = el("div", "jvt-kpi-grid");
      for (const it of block.items) {
        const card = el("div", "jvt-kpi");
        card.append(el("div", "jvt-kpi-label", it.label), el("div", "jvt-kpi-value", it.value));
        grid.append(card);
      }
      row.append(grid);
      break;
    }
    case "run-status": {
      const meta = el("div", "jvt-meta");
      meta.append(badge(block.agent, "jvt-badge-cyan"));
      if (block.model) meta.append(badge(block.model, "jvt-badge-amber"));
      if (block.tier) meta.append(badge(block.tier));
      if (block.note) meta.append(el("span", "jvt-note", block.note));
      row.append(meta);
      break;
    }
    case "nav-link": {
      const a = document.createElement("a");
      a.className = "jvt-nav-link";
      a.href = block.href;
      a.textContent = `↳ ${block.label}`;
      row.append(a);
      break;
    }
    case "error":
      row.append(el("div", "jvt-error-text", block.text));
      break;
  }
  return row;
}
