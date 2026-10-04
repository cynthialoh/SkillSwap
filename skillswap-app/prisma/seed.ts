// SkillSwap seed — categories (§7), skills, Chiaka + David demo users (§22).
// Run after Postgres is up: npm run db:seed  (migrate first: npx prisma migrate dev)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const CATEGORIES: Record<string, string[]> = {
  Technology: ["Coding", "AI", "Data analysis", "Software"],
  Business: ["Marketing", "Sales", "Finance", "Entrepreneurship"],
  Creative: ["Photography", "Graphic design", "Video editing", "Writing"],
  Lifestyle: ["Cooking", "Baking", "Fashion", "Beauty"],
  Education: ["Languages", "Mathematics", "Academic subjects"],
  "Health & Fitness": ["Fitness", "Yoga", "Personal training"],
  Music: ["Singing", "Guitar", "Music production"],
};

async function main() {
  for (const [cat, skills] of Object.entries(CATEGORIES)) {
    const category = await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
    for (const s of skills) {
      await prisma.skill.upsert({
        where: { name: s },
        update: {},
        create: { name: s, categoryId: category.id },
      });
    }
  }

  const skill = async (name: string) =>
    prisma.skill.findUniqueOrThrow({ where: { name } });

  const chiaka = await prisma.user.upsert({
    where: { id: "demo-chiaka" },
    update: {},
    create: {
      id: "demo-chiaka",
      name: "Chiaka",
      bio: "Sales coach · Lagos / Online",
      location: "Lagos",
      mode: "either",
    },
  });
  const david = await prisma.user.upsert({
    where: { id: "demo-david" },
    update: {},
    create: {
      id: "demo-david",
      name: "David",
      bio: "Photographer · Online",
      location: "Online",
      mode: "online",
    },
  });

  for (const s of ["Sales", "Cooking", "Graphic design"]) {
    const sk = await skill(s);
    await prisma.userTeach.upsert({
      where: { userId_skillId: { userId: chiaka.id, skillId: sk.id } },
      update: {},
      create: { userId: chiaka.id, skillId: sk.id },
    });
  }
  for (const s of ["Photography", "Coding", "Video editing"]) {
    const sk = await skill(s);
    await prisma.userLearn.upsert({
      where: { userId_skillId: { userId: chiaka.id, skillId: sk.id } },
      update: {},
      create: { userId: chiaka.id, skillId: sk.id },
    });
  }
  const photo = await skill("Photography");
  const sales = await skill("Sales");
  await prisma.userTeach.upsert({
    where: { userId_skillId: { userId: david.id, skillId: photo.id } },
    update: {},
    create: { userId: david.id, skillId: photo.id },
  });
  await prisma.userLearn.upsert({
    where: { userId_skillId: { userId: david.id, skillId: sales.id } },
    update: {},
    create: { userId: david.id, skillId: sales.id },
  });

  console.log("Seeded categories, skills, Chiaka + David.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
