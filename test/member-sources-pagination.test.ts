import { describe, expect, it } from 'vitest';
import { memberUpdatePagination } from '../features/member-sources/pagination';

describe('owner publication pagination', () => {
  it('makes all records accessible, including beyond the old 100 item limit', () => {
    const records = Array.from({length: 137}, (_, i) => i);
    const visited = [];
    for (let page = 1; page <= 5; page++) {
      const bounds = memberUpdatePagination(String(page), records.length);
      visited.push(...records.slice(bounds.skip, bounds.skip + bounds.take));
    }
    expect(visited).toEqual(records);
    expect(memberUpdatePagination('5', 137)).toEqual({page:5,pages:5,skip:120,take:30});
  });
  it.each([undefined, '', '-1', '0', 'NaN', '1.5', '1e9', '9999999999999999999999'])('safely handles invalid page %s', value => {
    expect(memberUpdatePagination(value, 137).page).toBe(1);
  });
  it('clamps pages after removal and handles no entries', () => {
    expect(memberUpdatePagination('999', 31)).toEqual({page:2,pages:2,skip:30,take:30});
    expect(memberUpdatePagination('2', 0)).toEqual({page:1,pages:1,skip:0,take:30});
  });
});
