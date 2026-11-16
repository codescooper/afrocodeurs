import { describe, expect, it } from 'vitest';
import { isPublicAddress, normalizeSourceUrl, parseMemberFeed } from '../lib/member-feed';

describe('member feeds', () => {
  it('rejects private, mapped, loopback, multicast and reserved addresses', () => {
    for (const ip of ['127.0.0.1','10.1.2.3','172.16.0.1','192.168.1.2','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','fc00::1','fe80::1','::ffff:127.0.0.1','::ffff:8.8.8.8']) expect(isPublicAddress(ip), ip).toBe(false);
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
  });
  it('validates source protocol, credentials, ports and GitHub structure', () => {
    for (const url of ['http://example.org/rss','https://user:pass@example.org','https://example.org:444/rss','https://localhost/a','https://127.1/a','https://[::1]/a']) expect(() => normalizeSourceUrl(url,'feed')).toThrow();
    expect(normalizeSourceUrl('https://github.com/codescooper/afrocodeurs/','github')).toBe('https://github.com/codescooper/afrocodeurs');
    expect(() => normalizeSourceUrl('https://github.com/org/repo/issues','github')).toThrow();
  });
  it('parses RSS, strips HTML and deduplicates', () => {
    const items = parseMemberFeed('<rss><channel><item><guid>x</guid><title>Launch</title><link>https://example.org/a</link><description><![CDATA[<b>Hello</b>]]></description></item><item><guid>x</guid><title>Again</title><link>https://example.org/a</link></item></channel></rss>','https://example.org/rss','feed');
    expect(items).toHaveLength(1); expect(items[0].summary).toBe('Hello');
  });
  it('parses Atom alternate links and rejects unsafe links', () => {
    const items = parseMemberFeed('<feed><entry><id>1</id><title>One</title><link rel="alternate" href="https://example.org/one"/><updated>2026-01-01T00:00:00Z</updated></entry><entry><title>Bad</title><link href="javascript:alert(1)"/></entry></feed>','https://example.org/feed','feed');
    expect(items).toHaveLength(1); expect(items[0].publishedAt).toBe('2026-01-01T00:00:00.000Z');
  });
  it('rejects XML entities and malformed XML', () => {
    expect(() => parseMemberFeed('<!DOCTYPE foo [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>','https://example.org','feed')).toThrow();
    expect(() => parseMemberFeed('<rss><broken>','https://example.org','feed')).toThrow();
  });
  it('supports JSON Feed and enforces the item limit', () => {
    const items=Array.from({length:50},(_,i)=>({id:String(i),title:`Item ${i}`,url:`https://example.org/${i}`,content_text:'Hello'}));
    expect(parseMemberFeed(JSON.stringify({version:'https://jsonfeed.org/version/1.1',items}),'https://example.org','feed')).toHaveLength(30);
  });
  it('parses GitHub releases without draft releases', () => {
    expect(parseMemberFeed(JSON.stringify([{id:1,name:'v1',html_url:'https://github.com/o/r/releases/tag/v1'},{id:2,draft:true,name:'v2',html_url:'https://github.com/o/r/releases/tag/v2'}]),'https://github.com/o/r','github')).toHaveLength(1);
  });
});
