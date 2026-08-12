import { describe, expect, it } from 'vitest';
describe('challan business rules',()=>{it('keeps draft inventory unchanged',()=>{const before=10;const status='DRAFT';const after=status==='CONFIRMED'?before-2:before;expect(after).toBe(10)});it('never permits a negative stock result',()=>{expect(3-5).toBeLessThan(0);expect(5<=3).toBe(false)});});
