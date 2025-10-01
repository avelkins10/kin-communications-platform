import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';

describe('Contact derived fields (statusCategory, isStale)', () => {
  const tempIds: string[] = [];

  beforeAll(async () => {
    // nothing
  });

  afterAll(async () => {
    if (tempIds.length > 0) {
      await prisma.contact.deleteMany({ where: { id: { in: tempIds } } });
    }
  });

  it('sets INACTIVE and isStale=true when lastContactDate is null', async () => {
    const c = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'NoContact',
        phone: '+19995550001',
        type: 'CUSTOMER',
        projectStatus: 'PRE_PTO',
        lastContactDate: null,
      },
    });
    tempIds.push(c.id);

    const found = await prisma.contact.findUnique({ where: { id: c.id } });
    expect(found?.statusCategory).toBe('INACTIVE');
    expect(found?.isStale).toBe(true);
  });

  it('sets ACTIVE and isStale=false for recent contact', async () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days
    const c = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'Recent',
        phone: '+19995550002',
        type: 'CUSTOMER',
        projectStatus: 'POST_PTO',
        lastContactDate: recent,
      },
    });
    tempIds.push(c.id);

    const found = await prisma.contact.findUnique({ where: { id: c.id } });
    expect(found?.statusCategory).toBe('ACTIVE');
    expect(found?.isStale).toBe(false);
  });

  it('becomes stale for POST_PTO when lastContactDate older than 3 months', async () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    // ensure strictly older than 3 months
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 1);
    const c = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'OldPost',
        phone: '+19995550003',
        type: 'CUSTOMER',
        projectStatus: 'POST_PTO',
        lastContactDate: threeMonthsAgo,
      },
    });
    tempIds.push(c.id);

    const found = await prisma.contact.findUnique({ where: { id: c.id } });
    expect(found?.isStale).toBe(true);
  });

  it('becomes INACTIVE for lastContactDate older than 6 months', async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 1);
    const c = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'Inactive',
        phone: '+19995550004',
        type: 'CUSTOMER',
        projectStatus: 'PRE_PTO',
        lastContactDate: sixMonthsAgo,
      },
    });
    tempIds.push(c.id);

    const found = await prisma.contact.findUnique({ where: { id: c.id } });
    expect(found?.statusCategory).toBe('INACTIVE');
  });
});




