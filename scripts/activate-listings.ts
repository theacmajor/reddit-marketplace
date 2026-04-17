import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.listing.updateMany({
    where: { status: "PENDING_REVIEW", isDeleted: false, isRemoved: false },
    data: { status: "ACTIVE" },
  });
  console.log(`✓ Activated ${result.count} listings`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
