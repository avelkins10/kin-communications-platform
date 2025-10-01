import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';

describe('Contact unique phone constraint with NULL ownerId', () => {
  const tempIds: string[] = [];

  afterAll(async () => {
    if (tempIds.length > 0) {
      await prisma.contact.deleteMany({ where: { id: { in: tempIds } } });
    }
  });

  it('allows same phone with different non-null owners', async () => {
    const a = await prisma.contact.create({
      data: { firstName: 'A', lastName: 'One', phone: '+19995551111', type: 'CUSTOMER', ownerId: 'owner-a' }
    });
    const b = await prisma.contact.create({
      data: { firstName: 'B', lastName: 'Two', phone: '+19995551111', type: 'CUSTOMER', ownerId: 'owner-b' }
    });
    tempIds.push(a.id, b.id);
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
  });

  it('rejects duplicate phone when ownerId is NULL', async () => {
    const c = await prisma.contact.create({
      data: { firstName: 'C', lastName: 'Three', phone: '+19995552222', type: 'CUSTOMER' }
    });
    tempIds.push(c.id);

    let error: any = null;
    try {
      await prisma.contact.create({
        data: { firstName: 'D', lastName: 'Four', phone: '+19995552222', type: 'CUSTOMER' }
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
  });
});




