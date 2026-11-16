import { describe, it, expect, vi, afterEach } from 'vitest';
const mocks=vi.hoisted(()=>({findMany:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/db',()=>({db:{memberSource:{findMany:mocks.findMany}}}));
vi.mock('@/features/member-sources/service',()=>({refreshSource:mocks.refresh}));
import { GET } from '@/app/api/cron/member-sources/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('member source cron',()=>{
 it('fails closed when missing secret',async()=>{vi.stubEnv('CRON_SECRET','');expect((await GET(new Request('https://example.com'))).status).toBe(401);expect(mocks.findMany).not.toHaveBeenCalled();});
 it('rejects invalid unicode without throwing',async()=>{vi.stubEnv('CRON_SECRET','x');expect((await GET(new Request('https://example.com',{headers:{authorization:'Bearer é'}}))).status).toBe(401);});
 it('bounded import only',async()=>{vi.stubEnv('CRON_SECRET','test');mocks.findMany.mockResolvedValue([{id:'s',userId:'u'}]);const res=await GET(new Request('https://example.com',{headers:{authorization:'Bearer test'}}));expect(await res.json()).toEqual({checked:1,imported:1,failed:0});expect(mocks.findMany.mock.calls[0][0].take).toBe(8);expect(mocks.refresh).toHaveBeenCalledWith('s','u');});
});
