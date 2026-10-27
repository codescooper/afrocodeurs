export function foldText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/\s+/g, " ").trim();
}

export function parseKeywords(value: string) {
  const seen = new Set<string>();
  return value.split(/[,;\n\r]+/).map(item => item.trim().replace(/\s+/g, " ").toLowerCase()).filter(item => {
    const key = foldText(item);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function ventureSearchText(value: { name: string; summary: string; description: string; needs: string[] }) {
  return foldText([value.name, value.summary, value.description, ...value.needs].join(" "));
}

export function ventureSearchWhere(rawQuery: string) {
  const tokens = [...new Set(foldText(rawQuery.slice(0, 80)).split(/[\s,;]+/).filter(Boolean))].slice(0, 8);
  return tokens.length ? { AND: tokens.map(token => ({ searchText: { contains: token } })) } : {};
}
