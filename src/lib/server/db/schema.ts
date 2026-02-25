import {
	pgTable,
	pgEnum,
	serial,
	integer,
	smallint,
	text,
	boolean,
	timestamp,
	primaryKey,
	unique
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema.ts';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const questionTypeEnum = pgEnum('question_type', [
	'multiple_choice',
	'short_answer',
	'true_false',
	'fill_in_the_blank'
]);

// ─── Categories ───────────────────────────────────────────────────────────────
// Unique category names per grade (e.g. "Số học: Đọc, viết..." for grade 1)

export const categories = pgTable('categories', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	grade: smallint('grade').notNull(), // 1–5
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ─── Question types (tags) ────────────────────────────────────────────────────
// Reusable tags derived from the "types" array on each question
// e.g. "Tính nhẩm nhanh", "Toán có lời văn ứng dụng thực tế"

export const questionTags = pgTable('question_tags', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ─── Questions ────────────────────────────────────────────────────────────────

export const questions = pgTable('questions', {
	id: serial('id').primaryKey(),
	questionType: questionTypeEnum('question_type').notNull(),
	question: text('question').notNull(),
	answer: text('answer').notNull().default(''), // for short_answer / fill_in_the_blank
	categoryId: integer('category_id')
		.notNull()
		.references(() => categories.id),
	level: smallint('level').notNull(), // 0 = easy, 1 = medium, 2 = hard
	grade: smallint('grade').notNull(), // 1–5
	explanation: text('explanation').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ─── Choices (for multiple_choice and true_false) ─────────────────────────────

export const questionChoices = pgTable('question_choices', {
	id: serial('id').primaryKey(),
	questionId: integer('question_id')
		.notNull()
		.references(() => questions.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	isCorrect: boolean('is_correct').notNull().default(false)
});

// ─── Junction: question ↔ tags ────────────────────────────────────────────────

export const questionToTags = pgTable(
	'question_to_tags',
	{
		questionId: integer('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => questionTags.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.questionId, t.tagId] })]
);

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submissionStatusEnum = pgEnum('submission_status', ['completing', 'evaluated']);

export const submissions = pgTable('submissions', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id')
		.notNull()
		.references(() => categories.id),
	grade: smallint('grade').notNull(),
	level: smallint('level').notNull(),
	status: submissionStatusEnum('status').notNull().default('completing'),
	score: integer('score'), // null until evaluated
	totalQuestions: integer('total_questions').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	evaluatedAt: timestamp('evaluated_at')
});

export const submissionAnswers = pgTable(
	'submission_answers',
	{
		id: serial('id').primaryKey(),
		submissionId: integer('submission_id')
			.notNull()
			.references(() => submissions.id, { onDelete: 'cascade' }),
		questionId: integer('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		answer: text('answer'), // choiceId (as string) for MC/TF, raw text for SA/FITB
		isCorrect: boolean('is_correct') // null until evaluated
	},
	(t) => [unique().on(t.submissionId, t.questionId)]
);

export * from './auth.schema.ts';
