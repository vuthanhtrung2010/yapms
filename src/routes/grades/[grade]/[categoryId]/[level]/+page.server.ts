import { db } from '$lib/server/db/index.js';
import {
	categories,
	questions,
	questionChoices,
	questionTags,
	questionToTags,
	submissions,
	submissionAnswers
} from '$lib/server/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) redirect(303, '/login');

	const grade = Number(params.grade);
	const categoryId = Number(params.categoryId);
	const level = Number(params.level);

	if (!Number.isInteger(grade) || !Number.isInteger(categoryId) || ![0, 1, 2].includes(level)) {
		error(404);
	}

	const [category] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, categoryId), eq(categories.grade, grade)));

	if (!category) error(404, 'Category not found');

	// Load questions — strip answer, explanation, isCorrect
	const qs = await db
		.select({
			id: questions.id,
			questionType: questions.questionType,
			question: questions.question,
			categoryId: questions.categoryId,
			level: questions.level,
			grade: questions.grade
		})
		.from(questions)
		.where(
			and(
				eq(questions.categoryId, categoryId),
				eq(questions.grade, grade),
				eq(questions.level, level)
			)
		)
		.orderBy(questions.id);

	const questionIds = qs.map((q) => q.id);

	// Choices — strip isCorrect
	const allChoices =
		questionIds.length > 0
			? await db
					.select({
						id: questionChoices.id,
						questionId: questionChoices.questionId,
						content: questionChoices.content
					})
					.from(questionChoices)
					.where(
						questionIds.length === 1
							? eq(questionChoices.questionId, questionIds[0]!)
							: inArray(questionChoices.questionId, questionIds)
					)
			: [];

	const tagJoins =
		questionIds.length > 0
			? await db
					.select({ questionId: questionToTags.questionId, tagName: questionTags.name })
					.from(questionToTags)
					.innerJoin(questionTags, eq(questionTags.id, questionToTags.tagId))
					.where(
						questionIds.length === 1
							? eq(questionToTags.questionId, questionIds[0]!)
							: inArray(questionToTags.questionId, questionIds)
					)
			: [];

	const choicesById = new Map<number, typeof allChoices>();
	for (const c of allChoices) {
		if (!choicesById.has(c.questionId)) choicesById.set(c.questionId, []);
		choicesById.get(c.questionId)!.push(c);
	}
	const tagsById = new Map<number, string[]>();
	for (const t of tagJoins) {
		if (!tagsById.has(t.questionId)) tagsById.set(t.questionId, []);
		tagsById.get(t.questionId)!.push(t.tagName);
	}

	const safeQuestions = qs.map((q) => ({
		...q,
		choices: choicesById.get(q.id) ?? [],
		tags: tagsById.get(q.id) ?? []
	}));

	// Find or create an in-progress submission for this user
	const [existing] = await db
		.select()
		.from(submissions)
		.where(
			and(
				eq(submissions.userId, locals.user.id),
				eq(submissions.categoryId, categoryId),
				eq(submissions.grade, grade),
				eq(submissions.level, level),
				eq(submissions.status, 'completing')
			)
		)
		.limit(1);

	let submission = existing;
	if (!submission) {
		const [created] = await db
			.insert(submissions)
			.values({ userId: locals.user.id, categoryId, grade, level, totalQuestions: qs.length })
			.returning();
		submission = created!;
	}

	// Load saved answers
	const savedAnswers = await db
		.select()
		.from(submissionAnswers)
		.where(eq(submissionAnswers.submissionId, submission.id));

	// If evaluated, reveal correct answers + explanations
	type CorrectAnswerMap = Record<
		number,
		{ answer: string; choiceContent: string | undefined; explanation: string }
	>;
	let correctAnswers: CorrectAnswerMap = {};
	if (submission.status === 'evaluated' && questionIds.length > 0) {
		const fullQs = await db
			.select({ id: questions.id, answer: questions.answer, explanation: questions.explanation })
			.from(questions)
			.where(
				questionIds.length === 1
					? eq(questions.id, questionIds[0]!)
					: inArray(questions.id, questionIds)
			);

		const correctChoices = await db
			.select({
				id: questionChoices.id,
				questionId: questionChoices.questionId,
				content: questionChoices.content
			})
			.from(questionChoices)
			.where(
				and(
					eq(questionChoices.isCorrect, true),
					questionIds.length === 1
						? eq(questionChoices.questionId, questionIds[0]!)
						: inArray(questionChoices.questionId, questionIds)
				)
			);

		const ccByQ = new Map(correctChoices.map((c) => [c.questionId, c]));
		for (const q of fullQs) {
			correctAnswers[q.id] = {
				answer: q.answer,
				choiceContent: ccByQ.get(q.id)?.content,
				explanation: q.explanation
			};
		}
	}

	return {
		grade,
		category,
		level,
		questions: safeQuestions,
		submission,
		savedAnswers,
		correctAnswers
	};
};

export const actions: Actions = {
	// Debounced — called every time user picks an answer
	saveAnswer: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const form = await request.formData();
		const submissionId = Number(form.get('submissionId'));
		const questionId = Number(form.get('questionId'));
		const answer = form.get('answer') as string | null;
		if (!submissionId || !questionId) return fail(400);

		const [sub] = await db
			.select()
			.from(submissions)
			.where(and(eq(submissions.id, submissionId), eq(submissions.userId, locals.user.id)))
			.limit(1);
		if (!sub || sub.status !== 'completing') return fail(403);

		await db
			.insert(submissionAnswers)
			.values({ submissionId, questionId, answer })
			.onConflictDoUpdate({
				target: [submissionAnswers.submissionId, submissionAnswers.questionId],
				set: { answer }
			});

		return { success: true };
	},

	// Evaluate — grade all answers
	evaluate: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const submissionId = Number(form.get('submissionId'));
		if (!submissionId) return fail(400);

		const [sub] = await db
			.select()
			.from(submissions)
			.where(and(eq(submissions.id, submissionId), eq(submissions.userId, locals.user.id)))
			.limit(1);
		if (!sub || sub.status !== 'completing') return fail(403);

		const answers = await db
			.select()
			.from(submissionAnswers)
			.where(eq(submissionAnswers.submissionId, submissionId));

		const qIds = answers.map((a) => a.questionId);
		if (qIds.length === 0) {
			await db
				.update(submissions)
				.set({ status: 'evaluated', score: 0, evaluatedAt: new Date() })
				.where(eq(submissions.id, submissionId));
			redirect(303, `/submissions/${submissionId}`);
		}

		const fullQs = await db
			.select({ id: questions.id, questionType: questions.questionType, answer: questions.answer })
			.from(questions)
			.where(qIds.length === 1 ? eq(questions.id, qIds[0]!) : inArray(questions.id, qIds));

		const correctChoices = await db
			.select({ questionId: questionChoices.questionId, id: questionChoices.id })
			.from(questionChoices)
			.where(
				and(
					eq(questionChoices.isCorrect, true),
					qIds.length === 1
						? eq(questionChoices.questionId, qIds[0]!)
						: inArray(questionChoices.questionId, qIds)
				)
			);

		const correctChoiceByQ = new Map(correctChoices.map((c) => [c.questionId, String(c.id)]));
		const qInfoById = new Map(fullQs.map((q) => [q.id, q]));

		let score = 0;
		for (const a of answers) {
			const qInfo = qInfoById.get(a.questionId);
			if (!qInfo) continue;
			let isCorrect = false;
			if (qInfo.questionType === 'multiple_choice' || qInfo.questionType === 'true_false') {
				isCorrect = a.answer === correctChoiceByQ.get(a.questionId);
			} else {
				isCorrect = (a.answer ?? '').trim().toLowerCase() === qInfo.answer.trim().toLowerCase();
			}
			if (isCorrect) score++;
			await db
				.update(submissionAnswers)
				.set({ isCorrect })
				.where(
					and(
						eq(submissionAnswers.submissionId, submissionId),
						eq(submissionAnswers.questionId, a.questionId)
					)
				);
		}

		await db
			.update(submissions)
			.set({ status: 'evaluated', score, evaluatedAt: new Date() })
			.where(eq(submissions.id, submissionId));

		redirect(303, `/submissions/${submissionId}`);
	},

	// Discard current attempt and start fresh
	restart: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await request.formData();
		const submissionId = Number(form.get('submissionId'));
		const categoryId = Number(form.get('categoryId'));
		const grade = Number(form.get('grade'));
		const level = Number(form.get('level'));
		const totalQuestions = Number(form.get('totalQuestions'));

		if (submissionId) {
			await db
				.delete(submissions)
				.where(and(eq(submissions.id, submissionId), eq(submissions.userId, locals.user.id)));
		}

		await db.insert(submissions).values({
			userId: locals.user.id,
			categoryId,
			grade,
			level,
			totalQuestions
		});

		redirect(303, `/grades/${grade}/${categoryId}/${level}`);
	}
};
