// Seed demo data for local development. Run: npm run db:seed
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const ward = await prisma.vendingZone.upsert({
    where: { id: "zone-shivajinagar-a" },
    update: {},
    create: {
      id: "zone-shivajinagar-a",
      name: "Shivajinagar Market Belt",
      type: "VENDING",
      region: "Ward 42, Shivajinagar",
      polygon: JSON.stringify([
        [12.983, 77.602],
        [12.987, 77.608],
        [12.981, 77.611],
        [12.977, 77.605],
      ]),
    },
  });

  const noVending = await prisma.vendingZone.upsert({
    where: { id: "zone-hospital-road" },
    update: {},
    create: {
      id: "zone-hospital-road",
      name: "Hospital Road (No Vending)",
      type: "NO_VENDING",
      region: "Ward 42, Shivajinagar",
      polygon: JSON.stringify([
        [12.99, 77.6],
        [12.993, 77.604],
        [12.989, 77.607],
        [12.986, 77.602],
      ]),
    },
  });

  const vendors = [
    {
      phone: "919876543210",
      name: "Ramesh Chaat Bhandar",
      nameVernacular: "रमेश चाट भंडार",
      category: "CHAAT",
      verificationStatus: "APPROVED",
      upiId: "9876543210@ybl",
      lat: 12.9822,
      lng: 77.6055,
      rating: 4.5,
      ratingCount: 128,
      dutyActive: true,
      lastPingAt: new Date(),
      zoneId: ward.id,
    },
    {
      phone: "919812345678",
      name: "Sunita Fresh Vegetables",
      nameVernacular: "ಸುನಿತಾ ತಾಜಾ ತರಕಾರಿ",
      category: "VEGETABLES",
      verificationStatus: "APPROVED",
      upiId: "sunita@okhdfcbank",
      lat: 12.9841,
      lng: 77.6033,
      rating: 4.2,
      ratingCount: 76,
      dutyActive: true,
      lastPingAt: new Date(),
      zoneId: ward.id,
    },
  ];

  // Clean up any old pending demo vendors
  await prisma.vendor.deleteMany({
    where: { phone: { in: ["919800011122", "919777788899"] } },
  });

  for (const v of vendors) {
    await prisma.vendor.upsert({ where: { phone: v.phone }, update: {}, create: v });
  }

  await prisma.document.upsert({
    where: { vendorPhone_type: { vendorPhone: "919876543210", type: "AADHAAR" } },
    update: {},
    create: {
      vendorPhone: "919876543210",
      type: "AADHAAR",
      fileUrl: "/uploads/demo/aadhaar-masked.pdf",
      status: "APPROVED",
    },
  });

  await prisma.admin.upsert({
    where: { id: "admin-1" },
    update: {},
    create: {
      id: "admin-1",
      name: "Kavya Deshpande",
      department: "Town Vending Committee",
      region: "Ward 42, Shivajinagar",
      phone: "919900011122",
    },
  });

  await prisma.customer.upsert({
    where: { phone: "919600012345" },
    update: {},
    create: { phone: "919600012345", name: "Demo Customer" },
  });

  await prisma.review.upsert({
    where: { vendorPhone_customerPhone: { vendorPhone: "919876543210", customerPhone: "919600012345" } },
    update: {},
    create: {
      vendorPhone: "919876543210",
      customerPhone: "919600012345",
      rating: 5,
      comment: "Best pani puri in the ward! Fresh water, quick service.",
    },
  });

  console.log(`Seeded zones: ${ward.name}, ${noVending.name}; ${vendors.length} vendors; 1 admin; 1 customer + review`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
