/**
 * import-questions.ts
 * Reads all question JSON files from the output directory and inserts them
 * into the database.
 *
 * Run AFTER seed-categories.ts. Safe to re-run — questions with identical
 * content are de-duped via the unique index on (question_text, grade, level).
 *
 * Folder structure expected:
 *   OUTPUT_DIR/
 *     Grade 1/
 *       Số học_ .../      ← sanitized category folder (: → _)
 *         Level 0/
 *           question_001.json
 *
 * Usage:
 *   cd Cool
 *   bun scripts/import-questions.ts [--output <path>] [--dry-run]
 *
 * Flags:
 *   --output <path>   Path to the output dir  (default: ../Gen Question/output)
 *   --dry-run         Parse & validate only, no DB writes
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import {
	categories,
	questionTags,
	questions,
	questionChoices,
	questionToTags
} from '../src/lib/server/db/schema.ts';

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outputFlag = args.indexOf('--output');
const DRY_RUN = args.includes('--dry-run');
const OUTPUT_DIR =
	outputFlag >= 0 && args[outputFlag + 1]
		? path.resolve(args[outputFlag + 1]!)
		: path.resolve('./output');

// ─── Types ────────────────────────────────────────────────────────────────────

interface Choice {
	content: string;
	isCorrect: boolean;
}

interface QuizFile {
	questionType: 'multiple_choice' | 'short_answer' | 'true_false' | 'fill_in_the_blank';
	question: string;
	choices: Choice[];
	answer: string;
	category: string;
	types: string[];
	level: 0 | 1 | 2;
	grade: 1 | 2 | 3 | 4 | 5;
	explanation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFolderName(name: string): string {
	return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

/** Walk output/ and collect every question_NNN.json file path */
function collectFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	const result: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			result.push(...collectFiles(full));
		} else if (/^question_\d+\.json$/.test(entry.name)) {
			result.push(full);
		}
	}
	return result;
}

/** Parse grade + sanitized category name from a file path */
function parsePathMeta(filePath: string): { grade: number; sanitizedCategory: string } | null {
	// Expected: .../Grade {grade}/{sanitizedCategory}/Level {level}/question_NNN.json
	const parts = filePath.replace(/\\/g, '/').split('/');
	const levelIdx = parts.findLastIndex((p) => /^Level \d+$/.test(p));
	if (levelIdx < 2) return null;

	const gradeFolder = parts[levelIdx - 2]; // e.g. "Grade 1"
	const categoryFolder = parts[levelIdx - 1]; // e.g. "Số học_ ..."
	const gradeMatch = gradeFolder?.match(/^Grade (\d)$/);
	if (!gradeMatch) return null;

	return {
		grade: Number(gradeMatch[1]),
		sanitizedCategory: categoryFolder ?? ''
	};
}

// ─── Tag cache ────────────────────────────────────────────────────────────────

const tagCache = new Map<string, number>(); // name → id

async function findOrCreateTag(db: ReturnType<typeof drizzle>, name: string): Promise<number> {
	const cached = tagCache.get(name);
	if (cached !== undefined) return cached;

	const [existing] = await db.select().from(questionTags).where(eq(questionTags.name, name));
	if (existing) {
		tagCache.set(name, existing.id);
		return existing.id;
	}

	const [created] = await db
		.insert(questionTags)
		.values({ name })
		.returning({ id: questionTags.id });
	tagCache.set(name, created!.id);
	return created!.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	if (!process.env.DATABASE_URL) {
		console.error('DATABASE_URL is not set');
		process.exit(1);
	}

	console.log(`Output dir : ${OUTPUT_DIR}`);
	console.log(`Dry-run    : ${DRY_RUN}`);
	console.log();

	// ── 1. Load all categories from DB ──────────────────────────────────────
	const client = postgres(process.env.DATABASE_URL);
	const db = drizzle(client);

	const allCategories = await db.select().from(categories);
	if (allCategories.length === 0) {
		console.error('No categories found. Run seed-categories.ts first.');
		await client.end();
		process.exit(1);
	}

	// Build a fast lookup: grade → Map<sanitized name → categoryId>
	const catIndex = new Map<number, Map<string, number>>();
	for (const cat of allCategories) {
		if (!catIndex.has(cat.grade)) catIndex.set(cat.grade, new Map());
		catIndex.get(cat.grade)!.set(sanitizeFolderName(cat.name), cat.id);
	}

	console.log(`Loaded ${allCategories.length} categories from DB.`);

	// ── 2. Collect all files ─────────────────────────────────────────────────
	const files = collectFiles(OUTPUT_DIR);
	console.log(`Found ${files.length} question files in ${OUTPUT_DIR}.`);
	console.log();

	// ── 3. Import each file ──────────────────────────────────────────────────
	let inserted = 0;
	let skipped = 0;
	let errors = 0;

	for (const filePath of files) {
		let quiz: QuizFile;
		try {
			quiz = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as QuizFile;
		} catch {
			console.warn(`  [SKIP] Cannot parse: ${filePath}`);
			errors++;
			continue;
		}

		// Determine category from folder structure (more reliable than quiz.category from AI)
		const meta = parsePathMeta(filePath);
		if (!meta) {
			console.warn(`  [SKIP] Cannot parse path: ${filePath}`);
			errors++;
			continue;
		}

		const categoryId = catIndex.get(meta.grade)?.get(meta.sanitizedCategory);
		if (!categoryId) {
			console.warn(
				`  [SKIP] No category match for grade=${meta.grade} folder="${meta.sanitizedCategory}"`
			);
			errors++;
			continue;
		}

		if (DRY_RUN) {
			console.log(`  [DRY] ${filePath.split('/').slice(-4).join('/')}`);
			inserted++;
			continue;
		}

		try {
			// 3c. Pre-resolve all tags outside the transaction (tags are global)
			const tagIds: number[] = [];
			for (const tagName of quiz.types) {
				if (!tagName.trim()) continue;
				tagIds.push(await findOrCreateTag(db, tagName.trim()));
			}

			await db.transaction(async (tx) => {
				// 3a. Insert question
				const [q] = await tx
					.insert(questions)
					.values({
						questionType: quiz.questionType,
						question: quiz.question,
						answer: quiz.answer ?? '',
						categoryId,
						level: quiz.level,
						grade: quiz.grade,
						explanation: quiz.explanation
					})
					.returning({ id: questions.id });

				const questionId = q!.id;

				// 3b. Insert choices (MC / TF)
				if (quiz.choices.length > 0) {
					await tx.insert(questionChoices).values(
						quiz.choices.map((c) => ({
							questionId,
							content: c.content,
							isCorrect: c.isCorrect
						}))
					);
				}

				// 3c. Link tags
				for (const tagId of tagIds) {
					await tx.insert(questionToTags).values({ questionId, tagId }).onConflictDoNothing();
				}
			});

			inserted++;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			console.warn(`  [ERR] ${filePath.split('/').slice(-4).join('/')}: ${msg}`);
			errors++;
		}
	}

	// ── 4. Summary ───────────────────────────────────────────────────────────
	console.log();
	console.log('─'.repeat(50));
	console.log(`Inserted : ${inserted}`);
	console.log(`Skipped  : ${skipped}`);
	console.log(`Errors   : ${errors}`);
	console.log(`Tags created: ${tagCache.size}`);

	await client.end();
}

main().catch((err) => {
	console.error('Fatal:', err);
	process.exit(1);
});
