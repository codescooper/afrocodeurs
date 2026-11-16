import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ guard:vi.fn(), source: {count:vi.fn(),upsert:vi.fn(),deleteMany:vi.fn()},update:{upsert:vi.fn(),updateMany:vi.fn()},refresh:vi.fn() }));
vi.mock('@/lib/guard',()=>({guard:mocks.guard}));
vi.mock('@/lib/db',()=>({db:{memberSource:mocks.source,memberUpdate:mocks.update}}));
vi.mock('@/lib/rate-limit',()=>({rateLimit:()=>({ok:true})}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw new Error(path)}}));
vi.mock('@/features/member-sources/service',()=>({itemKey:(s:string)=>s,refreshSource:mocks.refresh}));
import { sourceAction } from '@/features/member-sources/actions';
function form(data:Record<string,string>){const f=new FormData();Object.entries(data).forEach(([k,v])=>f.set(k,v));return f;}
beforeEach(()=>{vi.clearAllMocks();mocks.guard.mockResolvedValue({ok:true,user:{id:'owner'}});mocks.source.count.mockResolvedValue(0);});
describe('member source authorization',()=>{
 it('requires verified auth',async()=>{mocks.guard.mockResolvedValue({ok:false,error:'verify'});await expect(sourceAction(form({operation:'publish',id:'foreign'}))).rejects.toThrow('verify');expect(mocks.update.updateMany).not.toHaveBeenCalled();expect(mocks.guard).toHaveBeenCalledWith({verified:true});});
 it('publish scoped to owner',async()=>{await expect(sourceAction(form({operation:'publish',id:'foreign'}))).rejects.toThrow('saved=1');expect(mocks.update.updateMany.mock.calls[0][0].where).toEqual({id:'foreign',userId:'owner'});});
 it('revoke scoped to owner',async()=>{await expect(sourceAction(form({operation:'remove',id:'foreign'}))).rejects.toThrow('saved=1');expect(mocks.source.deleteMany).toHaveBeenCalledWith({where:{id:'foreign',userId:'owner'}});});
 it('requires source-specific consent',async()=>{await expect(sourceAction(form({operation:'add',url:'https://example.com/feed'}))).rejects.toThrow('consentement');expect(mocks.source.upsert).not.toHaveBeenCalled();});
 it('manual creation is never published',async()=>{await expect(sourceAction(form({operation:'manual',url:'https://example.com/project',title:'Demo',summary:'Test'}))).rejects.toThrow('saved=1');expect(mocks.update.upsert.mock.calls[0][0].create.approvedAt).toBeUndefined();});
 it('hides rather than deletes reviewed item',async()=>{await expect(sourceAction(form({operation:'hide',id:'mine'}))).rejects.toThrow('saved=1');expect(mocks.update.updateMany).toHaveBeenCalledWith({where:{id:'mine',userId:'owner'},data:{approvedAt:null}});});
});
