import { db } from '$lib/server/db/index.js';
import { categories, submissions } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');

	const statusFilter = url.searchParams.get('status') as 'completing' | 'evaluated' | null;
	const gradeFilter = url.searchParams.get('grade') ? Number(url.searchParams.get('grade')) : null;

	let query = db
		.select({
			id: submissions.id,
			grade: submissions.grade,
			level: submissions.level,
			status: submissions.status,
			score: submissions.score,
			totalQuestions: submissions.totalQuestions,
			createdAt: submissions.createdAt,
			evaluatedAt: submissions.evaluatedAt,
			categoryName: categories.name,
			categoryId: submissions.categoryId
		})
		.from(submissions)
		.leftJoin(categories, eq(categories.id, submissions.categoryId))
		.where(eq(submissions.userId, locals.user.id))
		.orderBy(desc(submissions.createdAt))
		.$dynamic();

	const rows = await query;

	const filtered = rows.filter((r) => {
		if (statusFilter && r.status !== statusFilter) return false;
		if (gradeFilter && r.grade !== gradeFilter) return false;
		return true;
	});

	return { submissions: filtered, statusFilter, gradeFilter };
};
