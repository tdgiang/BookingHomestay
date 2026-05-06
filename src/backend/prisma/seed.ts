import { PrismaClient, PriceType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const ROOMS = [
  { name: 'Phòng Hoa Sen', description: 'Phòng tiêu chuẩn view vườn, thoáng mát, thích hợp cho 2 người.', capacity: 2, area: 20, floor: 1, amenities: ['WiFi', 'Điều hòa', 'TV', 'Nóng lạnh', 'Tủ đồ'] },
  { name: 'Phòng Tre Xanh', description: 'Phòng rộng rãi, view vườn tre, không gian thư giãn.', capacity: 2, area: 25, floor: 1, amenities: ['WiFi', 'Điều hòa', 'TV', 'Nóng lạnh', 'Tủ đồ', 'Ban công'] },
  { name: 'Phòng Gia Đình', description: 'Phòng rộng dành cho gia đình, có giường đôi + giường đơn.', capacity: 4, area: 35, floor: 2, amenities: ['WiFi', 'Điều hòa', 'TV', 'Nóng lạnh', 'Tủ đồ', 'Bếp nhỏ', 'Ban công'] },
  { name: 'Phòng Đôi Deluxe', description: 'Phòng cao cấp, view đẹp, nội thất sang trọng.', capacity: 2, area: 30, floor: 2, amenities: ['WiFi', 'Điều hòa', 'TV 4K', 'Nóng lạnh', 'Tủ đồ', 'Minibar', 'Ban công'] },
  { name: 'Phòng Đơn', description: 'Phòng nhỏ gọn dành cho khách du lịch một mình.', capacity: 1, area: 15, floor: 1, amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
];

async function main() {
  // Admin account
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@homestay.vn' },
    update: {},
    create: { email: 'admin@homestay.vn', password: adminPassword, firstName: 'Admin', lastName: 'Homestay', role: 'ADMIN', isActive: true },
  });

  // Keep existing boilerplate accounts
  const editorPassword = await bcrypt.hash('Editor@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: adminPassword, firstName: 'Admin', lastName: 'User', role: 'ADMIN', isActive: true },
  });
  await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: { email: 'editor@example.com', password: editorPassword, firstName: 'Editor', lastName: 'User', role: 'USER', isActive: true },
  });

  // Rooms + pricing
  for (const roomData of ROOMS) {
    const room = await prisma.room.create({ data: { ...roomData, images: [] } });

    const base = roomData.capacity <= 2 ? 350000 : 550000;
    const hourly = roomData.capacity <= 2 ? 80000 : 120000;

    await prisma.roomPrice.createMany({
      data: [
        { roomId: room.id, priceType: PriceType.BASE_NIGHTLY,    price: base,                      daysOfWeek: [] },
        { roomId: room.id, priceType: PriceType.WEEKEND_NIGHTLY, price: Math.round(base * 1.3),    daysOfWeek: [5, 6, 0] },
        { roomId: room.id, priceType: PriceType.HOURLY,          price: hourly,                    daysOfWeek: [], hourFrom: 8,  hourTo: 22 },
        { roomId: room.id, priceType: PriceType.HOURLY,          price: Math.round(hourly * 1.2),  daysOfWeek: [], hourFrom: 22, hourTo: 8 },
      ],
    });

    console.log(`  ✓ ${room.name}`);
  }

  console.log('\n✅ Seed completed!');
  console.log('   Admin: admin@homestay.vn / Admin@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
