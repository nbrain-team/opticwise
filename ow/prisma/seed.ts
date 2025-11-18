import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed user
  const passwordHash = await bcrypt.hash("123456", 10);
  const user = await prisma.user.upsert({
    where: { email: "bill@opticwise.com" },
    update: {},
    create: {
      email: "bill@opticwise.com",
      name: "Bill",
      passwordHash,
    },
  });

  // Pipeline and stages from Pipedrive replica
  const pipeline = await prisma.pipeline.upsert({
    where: { name: "New Projects Pipeline" },
    update: {},
    create: {
      name: "New Projects Pipeline",
    },
  });

  const stageNamesInOrder = [
    "SQL",
    "Discovery & Qualification",
    "DDI Review Proposed",
    "Audit In Progress / Delivered",
    "RR Opportunities",
    "RR Contracting",
  ];

  const stages = [];
  for (let i = 0; i < stageNamesInOrder.length; i++) {
    const name = stageNamesInOrder[i]!;
    const stage = await prisma.stage.upsert({
      where: {
        pipelineId_name: {
          pipelineId: pipeline.id,
          name,
        },
      },
      update: { orderIndex: i },
      create: {
        name,
        orderIndex: i,
        pipelineId: pipeline.id,
      },
    });
    stages.push(stage);
  }

  // Minimal sample org + person to validate relationships
  const org = await prisma.organization.upsert({
    where: { name: "Fulenwider" },
    update: {},
    create: {
      name: "Fulenwider",
      address: "270 St. Paul Street, Suite 300, Denver, Colorado 80206",
      domain: "fulenwider.com",
    },
  });

  const person = await prisma.person.upsert({
    where: { email: "ferd@fulenwider.com" },
    update: {},
    create: {
      firstName: "Ferd",
      lastName: "Belz",
      email: "ferd@fulenwider.com",
      organizationId: org.id,
      title: "President",
      contactType: "President",
    },
  });

  // Deals spread across early stages for demo
  const sampleDeals = [
    { title: "Fulenwider: Denver International Business Center (Aerotropolis)", stage: "SQL", value: 0 },
    { title: "Formativ Co: 3850 Blake St Denver", stage: "Discovery & Qualification", value: 50000 },
    { title: "Pacific North - Prospect Ridge Ft Collins", stage: "DDI Review Proposed", value: 50000 },
  ];

  let positionByStage: Record<string, number> = {};
  for (const d of sampleDeals) {
    const stage = stages.find((s) => s.name === d.stage)!;
    const position = (positionByStage[stage.id] ?? 0) + 1;
    positionByStage[stage.id] = position;

    await prisma.deal.create({
      data: {
        title: d.title,
        value: d.value,
        currency: "USD",
        pipelineId: pipeline.id,
        stageId: stage.id,
        position,
        organizationId: org.id,
        personId: person.id,
        ownerId: user.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


