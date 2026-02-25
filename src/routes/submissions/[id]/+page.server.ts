import { db } from '$lib/server/db/index.js';
import {
	categories,
	questions,
	questionChoices,
	submissions,
	submissionAnswers
} from '$lib/server/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) redirect(303, '/login');

	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404);

	const [sub] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);

	if (!sub) error(404, 'Submission not found');
	if (sub.userId !== locals.user.id) error(403, 'Access denied');

	// If still in progress, redirect to the quiz page
	if (sub.status === 'completing') {
		redirect(303, `/grades/${sub.grade}/${sub.categoryId}/${sub.level}`);
	}

	const [category] = await db.select().from(categories).where(eq(categories.id, sub.categoryId));

	// Load questions for this submission's grade/category/level
	const qs = await db
		.select()
		.from(questions)
		.where(
			and(
				eq(questions.categoryId, sub.categoryId),
				eq(questions.grade, sub.grade),
				eq(questions.level, sub.level)
			)
		)
		.orderBy(questions.id);

	const questionIds = qs.map((q) => q.id);

	// All choices with isCorrect revealed (this is a results page)
	const allChoices =
		questionIds.length > 0
			? await db
					.select()
					.from(questionChoices)
					.where(
						questionIds.length === 1
							? eq(questionChoices.questionId, questionIds[0]!)
							: inArray(questionChoices.questionId, questionIds)
					)
			: [];

	// User's answers for this submission
	const savedAnswers = await db
		.select()
		.from(submissionAnswers)
		.where(eq(submissionAnswers.submissionId, sub.id));

	const choicesById = new Map<number, typeof allChoices>();
	for (const c of allChoices) {
		if (!choicesById.has(c.questionId)) choicesById.set(c.questionId, []);
		choicesById.get(c.questionId)!.push(c);
	}

	const answerByQId = new Map(savedAnswers.map((a) => [a.questionId, a]));

	const questionsWithDetails = qs.map((q) => ({
		id: q.id,
		questionType: q.questionType,
		question: q.question,
		answer: q.answer,
		explanation: q.explanation,
		choices: choicesById.get(q.id) ?? [],
		userAnswer: answerByQId.get(q.id) ?? null
	}));

	return {
		submission: sub,
		category: category ?? null,
		questions: questionsWithDetails
	};
};
