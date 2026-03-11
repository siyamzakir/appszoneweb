import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.plan.count();
  if (count > 0) {
    console.log("Plans already seeded. Skipping.");
    return;
  }

  await prisma.plan.createMany({
    data: [
      {
        name: "Starter",
        slug: "starter",
        description: "Perfect for personal projects and small websites",
        monthlyPrice: 0,
        annualPrice: 0,
        features: JSON.stringify([
          "1 Website",
          "10 GB SSD Storage",
          "Free SSL Certificate",
          "99.9% Uptime",
          "Basic Support",
        ]),
        isActive: true,
      },
      {
        name: "Pro",
        slug: "pro",
        description: "Ideal for growing businesses and professional sites",
        monthlyPrice: 9,
        annualPrice: 90,
        features: JSON.stringify([
          "10 Websites",
          "100 GB SSD Storage",
          "Free SSL Certificate",
          "Free Domain",
          "Priority Support",
          "Daily Backups",
          "CDN Included",
        ]),
        isActive: true,
      },
      {
        name: "Business",
        slug: "business",
        description: "Power and scale for high-traffic applications",
        monthlyPrice: 29,
        annualPrice: 290,
        features: JSON.stringify([
          "Unlimited Websites",
          "500 GB NVMe Storage",
          "Free SSL Certificate",
          "Free Domain",
          "24/7 Dedicated Support",
          "Hourly Backups",
          "Global CDN",
          "Staging Environment",
          "White-label Ready",
        ]),
        isActive: true,
      },
    ],
  });

  console.log("✅ Default hosting plans seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
