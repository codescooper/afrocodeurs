import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: mocks.lookup }));
vi.mock('node:https', () => ({ request: mocks.request }));
import { importMemberFeed } from '../lib/member-feed';

describe('feed network SSRF boundary', () => {
  beforeEach(() => vi.clearAllMocks());
  it('rejects a public-looking domain resolving to a private IP before connection', async () => {
    mocks.lookup.mockResolvedValue([{address:'127.0.0.1',family:4}]);
    await expect(importMemberFeed('https://example.org/feed','feed')).rejects.toThrow('non publique');
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('rejects mixed public/private DNS answers', async () => {
    mocks.lookup.mockResolvedValue([{address:'8.8.8.8',family:4},{address:'169.254.169.254',family:4}]);
    await expect(importMemberFeed('https://example.org/feed','feed')).rejects.toThrow('non publique');
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('pins connection to the validated IP, preserving TLS hostname and Host', async () => {
    mocks.lookup.mockResolvedValue([{address:'8.8.8.8',family:4}]);
    mocks.request.mockImplementation((options, callback) => {
      expect(options.hostname).toBe('8.8.8.8');
      expect(options.servername).toBe('example.org');
      expect(options.headers.Host).toBe('example.org');
      const req = Object.assign(new EventEmitter(), {
        end: () => queueMicrotask(() => {
          const res = Object.assign(new EventEmitter(), {statusCode:200,headers:{},destroy:vi.fn()});
          callback(res);
          res.emit('data', Buffer.from('<rss><channel/></rss>'));
          res.emit('end'); req.emit('close');
        }), destroy: vi.fn(),
      });
      return req;
    });
    // Empty RSS channel is accepted as a valid feed without items.
    await expect(importMemberFeed('https://example.org/feed','feed')).resolves.toEqual([]);
  });
  it('checks redirection targets before connecting', async () => {
    mocks.lookup.mockResolvedValue([{address:'8.8.8.8',family:4}]);
    mocks.request.mockImplementation((_options, callback) => {
      const req = Object.assign(new EventEmitter(), {
        end: () => queueMicrotask(() => {
          const res = Object.assign(new EventEmitter(), {statusCode:302,headers:{location:'https://127.0.0.1/secret'},destroy:vi.fn()});
          callback(res); req.emit('close');
        }), destroy:vi.fn(),
      });
      return req;
    });
    await expect(importMemberFeed('https://example.org/feed','feed')).rejects.toThrow();
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

});
