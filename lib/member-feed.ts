import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type MemberFeedItem = { externalId: string; title: string; url: string; summary: string; publishedAt: string | null };
export type MemberFeedKind = 'feed' | 'github';
const MAX_BYTES = 1024 * 1024;
const MAX_ITEMS = 30;

export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    return parsed.range() === 'unicast';
  } catch { return false; }
}

function checkedUrl(input: string, httpsOnly = true): URL {
  if (input.length > 2048) throw new Error('URL trop longue.');
  const url = new URL(input);
  if (!(httpsOnly ? url.protocol === 'https:' : ['https:', 'http:'].includes(url.protocol)) || url.username || url.password || (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80'))) throw new Error('Utilisez une URL publique HTTPS sans identifiants ni port personnalisé.');
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host || host === 'localhost' || /\.(localhost|local|internal|home|lan)$/.test(host) || (!host.includes('.') && !isIP(host)) || (isIP(host) && !isPublicAddress(host))) throw new Error('Adresse locale ou réservée interdite.');
  url.hash = '';
  return url;
}

export function normalizeSourceUrl(input: string, kind: MemberFeedKind): string {
  const url = checkedUrl(input.trim());
  if (kind === 'github') {
    if (url.hostname !== 'github.com' || url.search || !/^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname)) throw new Error('Indiquez un dépôt public https://github.com/proprietaire/depot.');
    return `https://github.com${url.pathname.replace(/\/$/, '').replace(/\.git$/, '')}`;
  }
  return url.toString();
}

// Resolve once and pin the resulting address for TLS; no second DNS lookup at connect time.
async function safeDownload(input: string): Promise<string> {
  const deadline = Date.now() + 10_000;
  const remaining = () => Math.max(1, deadline - Date.now());
  let current = checkedUrl(input);
  for (let redirect = 0; redirect <= 3; redirect++) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const host = current.hostname.replace(/^\[|\]$/g, '');
    const addresses = await Promise.race([
      lookup(host, { all: true }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Délai de lecture dépassé.')), remaining()); }),
    ]).finally(() => clearTimeout(timer));
    if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error('La source pointe vers une adresse non publique.');
    if (Date.now() >= deadline) throw new Error('Délai de lecture dépassé.');
    const pinned = addresses[0];
    const response = await new Promise<{ location?: string; body: string }>((resolve, reject) => {
      const req = request({ protocol: 'https:', hostname: pinned.address, port: 443,
        servername: isIP(host) ? undefined : host, path: current.pathname + current.search,
        headers: { Host: current.host, 'User-Agent': 'Afrocodeurs-Feed/1.0', Accept: 'application/json, application/atom+xml, application/rss+xml, application/xml, text/xml', 'Accept-Encoding': 'identity' },
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0)) {
          const location = res.headers.location; res.destroy(); resolve({ location, body: '' }); return;
        }
        if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) { res.destroy(); reject(new Error(`Source indisponible (${res.statusCode}).`)); return; }
        if (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') { res.destroy(); reject(new Error('Compression de flux non prise en charge.')); return; }
        if (Number(res.headers['content-length']) > MAX_BYTES) { res.destroy(); reject(new Error('Flux trop volumineux (1 Mo maximum).')); return; }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => { size += chunk.length; if (size > MAX_BYTES) { req.destroy(new Error('Flux trop volumineux (1 Mo maximum).')); } else chunks.push(chunk); });
        res.on('end', () => resolve({ body: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', reject);
      });
      const timer = setTimeout(() => req.destroy(new Error('Délai de lecture dépassé.')), remaining());
      req.on('close', () => clearTimeout(timer));
      req.on('error', reject);
      req.end();
    });
    if (response.location) { current = checkedUrl(new URL(response.location, current).toString()); continue; }
    if (!response.body) throw new Error('Réponse vide ou redirection invalide.');
    return response.body;
  }
  throw new Error('Trop de redirections.');
}

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => x && typeof x === 'object' && !Array.isArray(x) ? x as Obj : {};
const list = (x: unknown): unknown[] => x == null ? [] : Array.isArray(x) ? x : [x];
const str = (x: unknown): string => typeof x === 'string' || typeof x === 'number' ? String(x) : typeof obj(x)['#text'] === 'string' ? String(obj(x)['#text']) : '';
const plain = (x: unknown, max: number) => str(x).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function parseMemberFeed(body: string, sourceUrl: string, kind: MemberFeedKind): MemberFeedItem[] {
  if (Buffer.byteLength(body) > MAX_BYTES) throw new Error('Flux trop volumineux.');
  let candidates: unknown[];
  let format: 'github' | 'json' | 'rss' | 'atom';
  if (kind === 'github') { candidates = list(JSON.parse(body)); format = 'github'; }
  else if (body.trim().startsWith('{')) {
    const feed = obj(JSON.parse(body));
    if (!str(feed.version).startsWith('https://jsonfeed.org/version/')) throw new Error('Format JSON Feed non reconnu.');
    candidates = list(feed.items); format = 'json';
  } else {
    if (/<!\s*(DOCTYPE|ENTITY)/i.test(body)) throw new Error('DTD et entités XML interdites.');
    if (XMLValidator.validate(body) !== true) throw new Error('XML invalide.');
    const parsed = new XMLParser({ ignoreAttributes: false, processEntities: false, parseTagValue: false, parseAttributeValue: false }).parse(body);
    if (parsed.rss && Object.hasOwn(parsed.rss, 'channel')) { candidates = list(obj(parsed.rss.channel).item); format = 'rss'; }
    else if (parsed.feed) { candidates = list(parsed.feed.entry); format = 'atom'; }
    else throw new Error('Flux RSS ou Atom non reconnu.');
  }
  const results: MemberFeedItem[] = [];
  const seen = new Set<string>();
  for (const value of candidates.slice(0, 100)) {
    const item = obj(value);
    if (format === 'github' && item.draft) continue;
    const atomLink = list(item.link).map(obj).find(l => !l['@_rel'] || l['@_rel'] === 'alternate');
    const rawUrl = format === 'github' ? item.html_url : format === 'json' ? item.url ?? item.external_url : format === 'atom' ? atomLink?.['@_href'] : item.link;
    let url: string;
    try { url = checkedUrl(new URL(str(rawUrl), sourceUrl).toString(), false).toString(); if (!str(rawUrl)) continue; } catch { continue; }
    const title = plain(format === 'github' ? item.name || item.tag_name : item.title, 200);
    if (!title || seen.has(url)) continue;
    const rawId = str(item.id ?? item.guid) || url;
    const externalId = createHash('sha256').update(rawId).digest('hex');
    if (seen.has(externalId)) continue;
    const date = str(item.published_at ?? item.date_published ?? item.pubDate ?? item.published ?? item.updated);
    results.push({ externalId, title, url,
      summary: plain(item.body ?? item.summary ?? item.description ?? item.content_text ?? item.content_html ?? item.content, 1000),
      publishedAt: date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null });
    seen.add(url); seen.add(externalId);
    if (results.length >= MAX_ITEMS) break;
  }
  return results;
}

export async function importMemberFeed(input: string, kind: MemberFeedKind): Promise<MemberFeedItem[]> {
  const source = normalizeSourceUrl(input, kind);
  const endpoint = kind === 'github' ? `https://api.github.com/repos${new URL(source).pathname}/releases?per_page=30` : source;
  return parseMemberFeed(await safeDownload(endpoint), source, kind);
}
