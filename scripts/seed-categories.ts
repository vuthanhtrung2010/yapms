/**
 * seed-categories.ts
 * Inserts all unique categories into the `categories` table.
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   cd Cool
 *   bun scripts/seed-categories.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { categories } from '../src/lib/server/db/schema.ts';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

// ─── Curriculum map (must stay in sync with batch-generate.ts) ────────────────

const categoriesByGrade: Record<number, string[]> = {
	1: [
		'Số học: Đọc, viết và cấu tạo số trong phạm vi 100',
		'Phép tính: Cộng, trừ không nhớ trong phạm vi 100',
		'Hình học trực quan: Nhận biết hình phẳng và hình khối',
		'Đo lường: Độ dài (cm) và Thời gian (giờ đúng, ngày, tuần)'
	],
	2: [
		'Số học: Đọc, viết và cấu tạo số trong phạm vi 1000',
		'Phép tính: Cộng, trừ có nhớ trong phạm vi 100',
		'Phép tính: Bảng nhân 2, 5 và Bảng chia 2, 5',
		'Hình học: Đường thẳng, đường gấp khúc và hình tứ giác',
		'Đo lường: Độ dài (m, km), Khối lượng (kg), Dung tích (lít)',
		'Thống kê và Xác suất: Biểu đồ tranh và khả năng xảy ra'
	],
	3: [
		'Số học: Các số và phép tính trong phạm vi 100.000',
		'Phân số: Làm quen với một phần mấy (1/2 đến 1/9)',
		'Hình học: Góc, trung điểm, tính Chu vi và Diện tích',
		'Đo lường: Khối lượng (gam), Dung tích (ml), Nhiệt độ',
		'Toán có lời văn: Bài toán rút về đơn vị (2 bước tính)',
		'Thống kê: Thu thập, phân loại và ghi chép số liệu'
	],
	4: [
		'Số học: Số tự nhiên đến lớp triệu và lớp tỉ',
		'Phép tính: Dấu hiệu chia hết (2, 3, 5, 9)',
		'Phân số: Khái niệm, Rút gọn, Quy đồng và 4 phép tính',
		'Hình học: Hai đường thẳng, góc nhọn/tù/bẹt, hình thoi, bình hành',
		'Đo lường: Yến, tạ, tấn, giây, thế kỷ, m2, dm2',
		'Toán điển hình: Trung bình cộng và bài toán Tổng - Hiệu',
		'Thống kê: Biểu đồ cột'
	],
	5: [
		'Số thập phân: Khái niệm, so sánh và 4 phép tính',
		'Tỉ số phần trăm: Các bài toán về tỉ số và phần trăm',
		'Hình học phẳng: Diện tích tam giác, hình thang, đường tròn',
		'Hình học không gian: Diện tích và Thể tích khối hộp',
		'Toán chuyển động: Vận tốc, Quãng đường, Thời gian',
		'Đo lường: Đơn vị đo diện tích (ha) và thể tích (m3, dm3, cm3)',
		'Thống kê và Xác suất: Biểu đồ hình quạt tròn'
	]
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function main() {
	const rows = Object.entries(categoriesByGrade).flatMap(([gradeStr, names]) =>
		names.map((name) => ({ name, grade: Number(gradeStr) }))
	);

	console.log(`Seeding ${rows.length} categories...`);

	const inserted = await db
		.insert(categories)
		.values(rows)
		.onConflictDoNothing({ target: categories.name })
		.returning({ id: categories.id, name: categories.name, grade: categories.grade });

	console.log(
		`Inserted: ${inserted.length} new  |  Skipped: ${rows.length - inserted.length} existing`
	);

	for (const row of inserted) {
		console.log(`  [Grade ${row.grade}] ${row.name} → id=${row.id}`);
	}

	await client.end();
}

main().catch((err) => {
	console.error('Fatal:', err);
	process.exit(1);
});
