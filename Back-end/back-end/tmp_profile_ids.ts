import { prisma } from './src/db.ts';
async function main() {
  const customer = await prisma.customerProfiles.findFirst({ select: { id: true, user_id: true, full_name: true } });
  console.log(JSON.stringify(customer, null, 2));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
