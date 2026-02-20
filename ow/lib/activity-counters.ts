import { prisma } from '@/lib/db';

/**
 * Recalculates and updates activity counters (totalActivities, doneActivities, 
 * activitiesToDo, lastActivityDate, nextActivityDate) on the linked entity
 * (Deal, Person, or Organization) after any activity create/update/delete.
 */
export async function updateActivityCounters(entity: {
  dealId?: string | null;
  personId?: string | null;
  organizationId?: string | null;
}) {
  const updates: Promise<unknown>[] = [];

  if (entity.dealId) {
    updates.push(recalcForDeal(entity.dealId));
  }
  if (entity.personId) {
    updates.push(recalcForPerson(entity.personId));
  }
  if (entity.organizationId) {
    updates.push(recalcForOrganization(entity.organizationId));
  }

  await Promise.all(updates);
}

async function recalcForDeal(dealId: string) {
  const activities = await prisma.activity.findMany({
    where: { dealId },
    select: { status: true, dueDate: true, doneTime: true, createdAt: true },
  });

  const total = activities.length;
  const done = activities.filter(a => a.status === 'done').length;
  const todo = activities.filter(a => a.status === 'pending').length;

  const completedDates = activities
    .filter(a => a.doneTime)
    .map(a => a.doneTime!);
  const lastActivity = completedDates.length > 0
    ? new Date(Math.max(...completedDates.map(d => d.getTime())))
    : null;

  const pendingDates = activities
    .filter(a => a.status === 'pending' && a.dueDate)
    .map(a => a.dueDate!);
  const nextActivity = pendingDates.length > 0
    ? new Date(Math.min(...pendingDates.map(d => d.getTime())))
    : null;

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      totalActivities: total,
      doneActivities: done,
      activitiesToDo: todo,
      lastActivityDate: lastActivity,
      nextActivityDate: nextActivity,
    },
  });
}

async function recalcForPerson(personId: string) {
  const activities = await prisma.activity.findMany({
    where: { personId },
    select: { status: true, dueDate: true, doneTime: true, createdAt: true },
  });

  const total = activities.length;
  const done = activities.filter(a => a.status === 'done').length;
  const todo = activities.filter(a => a.status === 'pending').length;

  const completedDates = activities
    .filter(a => a.doneTime)
    .map(a => a.doneTime!);
  const lastActivity = completedDates.length > 0
    ? new Date(Math.max(...completedDates.map(d => d.getTime())))
    : null;

  const pendingDates = activities
    .filter(a => a.status === 'pending' && a.dueDate)
    .map(a => a.dueDate!);
  const nextActivity = pendingDates.length > 0
    ? new Date(Math.min(...pendingDates.map(d => d.getTime())))
    : null;

  await prisma.person.update({
    where: { id: personId },
    data: {
      totalActivities: total,
      doneActivities: done,
      activitiesToDo: todo,
      lastActivityDate: lastActivity,
      nextActivityDate: nextActivity,
    },
  });
}

async function recalcForOrganization(organizationId: string) {
  const activities = await prisma.activity.findMany({
    where: { organizationId },
    select: { status: true, dueDate: true, doneTime: true, createdAt: true },
  });

  const total = activities.length;
  const done = activities.filter(a => a.status === 'done').length;
  const todo = activities.filter(a => a.status === 'pending').length;

  const completedDates = activities
    .filter(a => a.doneTime)
    .map(a => a.doneTime!);
  const lastActivity = completedDates.length > 0
    ? new Date(Math.max(...completedDates.map(d => d.getTime())))
    : null;

  const pendingDates = activities
    .filter(a => a.status === 'pending' && a.dueDate)
    .map(a => a.dueDate!);
  const nextActivity = pendingDates.length > 0
    ? new Date(Math.min(...pendingDates.map(d => d.getTime())))
    : null;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      totalActivities: total,
      doneActivities: done,
      activitiesToDo: todo,
      lastActivityDate: lastActivity,
      nextActivityDate: nextActivity,
    },
  });
}
