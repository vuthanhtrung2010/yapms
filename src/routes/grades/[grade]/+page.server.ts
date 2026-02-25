import { db } from '$lib/server/db/index.js';
import { categories, questions } from '$lib/server/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const grade = Number(params.grade);
	if (!Number.isInteger(grade) || grade < 1 || grade > 5) error(404, 'Grade not found');

	const cats = await db
		.select()
		.from(categories)
		.where(eq(categories.grade, grade))
		.orderBy(categories.id);

	// One query: count questions per category × level
	const countRows = await db
		.select({
			categoryId: questions.categoryId,
			level: questions.level,
			total: count()
		})
		.from(questions)
		.where(eq(questions.grade, grade))
		.groupBy(questions.categoryId, questions.level);

	// Build index: categoryId → level → count
	const countIndex: Record<number, Record<number, number>> = {};
	for (const row of countRows) {
		countIndex[row.categoryId] ??= {};
		countIndex[row.categoryId][row.level] = Number(row.total);
	}

	const totalQuestions = countRows.reduce((s, r) => s + Number(r.total), 0);

	return {
		grade,
		categories: cats.map((c) => ({
			id: c.id,
			name: c.name,
			grade: c.grade,
			counts: countIndex[c.id] ?? {}
		})),
		totalQuestions
	};
};
