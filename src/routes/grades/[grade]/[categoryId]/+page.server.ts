import { db } from '$lib/server/db/index.js';
import { categories, questions, questionTags, questionToTags } from '$lib/server/db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const grade = Number(params.grade);
	const categoryId = Number(params.categoryId);
	if (!Number.isInteger(grade) || !Number.isInteger(categoryId)) error(404);

	const [category] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, categoryId), eq(categories.grade, grade)));

	if (!category) error(404, 'Category not found');

	// Count per level and per question type
	const levelCounts = await db
		.select({ level: questions.level, total: count() })
		.from(questions)
		.where(and(eq(questions.categoryId, categoryId), eq(questions.grade, grade)))
		.groupBy(questions.level);

	const typeCounts = await db
		.select({ questionType: questions.questionType, total: count() })
		.from(questions)
		.where(and(eq(questions.categoryId, categoryId), eq(questions.grade, grade)))
		.groupBy(questions.questionType);

	const levels = [0, 1, 2].map((l) => ({
		level: l,
		total: Number(levelCounts.find((r) => r.level === l)?.total ?? 0)
	}));

	const types = typeCounts.map((r) => ({
		questionType: r.questionType,
		total: Number(r.total)
	}));

	return { grade, category, levels, types };
};
