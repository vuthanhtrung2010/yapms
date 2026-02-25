<script lang="ts">
	import type { PageData } from './$types.js';
	import { enhance } from '$app/forms';
	import Card, { Content, Actions } from '@smui/card';
	import Button, { Label } from '@smui/button';
	import LinearProgress from '@smui/linear-progress';
	import { Icon } from '@smui/common';
	import {
		mdiArrowLeft,
		mdiCheckCircle,
		mdiCloseCircle,
		mdiRefresh,
		mdiSend,
		mdiAlertCircleOutline
	} from '@mdi/js';

	let { data }: { data: PageData } = $props();

	const levelConfig: Record<number, { label: string; sublabel: string; color: string }> = {
		0: { label: 'Nhận biết', sublabel: 'Dễ', color: '#4caf50' },
		1: { label: 'Thông hiểu', sublabel: 'Trung bình', color: '#ff9800' },
		2: { label: 'Vận dụng', sublabel: 'Khó', color: '#f44336' }
	};

	const typeConfig: Record<string, { label: string; color: string }> = {
		multiple_choice: { label: 'Trắc nghiệm', color: '#1976d2' },
		short_answer: { label: 'Trả lời ngắn', color: '#7b1fa2' },
		true_false: { label: 'Đúng / Sai', color: '#00796b' },
		fill_in_the_blank: { label: 'Điền vào chỗ trống', color: '#e65100' }
	};

	const currentLevel = $derived(levelConfig[data.level as 0 | 1 | 2] ?? levelConfig[0]!);

	// Local answers map: questionId → answer string
	// (choiceId as string for MC/TF, text for SA/FITB)
	// Synced from server data (e.g. after evaluate action reloads the page)
	let answers = $state<Record<number, string>>({});
	$effect(() => {
		answers = Object.fromEntries(data.savedAnswers.map((a) => [a.questionId, a.answer ?? '']));
	});

	const answeredCount = $derived(Object.values(answers).filter((v) => v !== '').length);
	const progress = $derived(data.questions.length > 0 ? answeredCount / data.questions.length : 0);

	// Debounce timer per question
	const timers = new Map<number, ReturnType<typeof setTimeout>>();

	function pickAnswer(questionId: number, value: string) {
		answers[questionId] = value;
		scheduleSave(questionId, value);
	}

	function scheduleSave(questionId: number, value: string) {
		const existing = timers.get(questionId);
		if (existing) clearTimeout(existing);
		const t = setTimeout(() => {
			timers.delete(questionId);
			submitSave(questionId, value);
		}, 500);
		timers.set(questionId, t);
	}

	function submitSave(questionId: number, value: string) {
		const fd = new FormData();
		fd.set('submissionId', String(data.submission.id));
		fd.set('questionId', String(questionId));
		fd.set('answer', value);
		fetch('?/saveAnswer', { method: 'POST', body: fd });
	}

	let submitting = $state(false);
	let restarting = $state(false);
</script>

<svelte:head>
	<title>{currentLevel.label} – {data.category.name} – YAPMS</title>
</svelte:head>

<div class="quiz-page">
	<!-- Breadcrumb -->
	<div class="breadcrumb">
		<Button href="/grades/{data.grade}" variant="outlined" class="bc-btn">
			<Label>Lớp {data.grade}</Label>
		</Button>
		<span class="bc-sep">›</span>
		<Button href="/grades/{data.grade}/{data.category.id}" variant="outlined" class="bc-btn">
			<Label>{data.category.name}</Label>
		</Button>
		<span class="bc-sep">›</span>
		<span
			class="level-chip"
			style="background-color: {currentLevel.color}20; color: {currentLevel.color}; border: 1px solid {currentLevel.color};"
		>
			{currentLevel.sublabel}
		</span>
	</div>

	<!-- Header -->
	<div class="page-header">
		<Button href="/grades/{data.grade}/{data.category.id}" variant="outlined">
			<Icon tag="svg" viewBox="0 0 24 24"><path fill="currentColor" d={mdiArrowLeft} /></Icon>
			<Label>Quay lại</Label>
		</Button>
		<div class="header-info">
			<h1>{currentLevel.label} · {data.category.name}</h1>
			<p class="subtitle">{data.questions.length} câu hỏi</p>
		</div>
	</div>

	{#if data.questions.length === 0}
		<div class="empty-state">
			<Icon tag="svg" viewBox="0 0 24 24" class="empty-icon">
				<path fill="currentColor" d={mdiAlertCircleOutline} />
			</Icon>
			<p>Chưa có câu hỏi nào ở mức này.</p>
		</div>
	{:else if data.submission.status === 'evaluated'}
		<!-- ── RESULTS VIEW ─────────────────────────────── -->
		{@const score = data.submission.score ?? 0}
		{@const total = data.submission.totalQuestions}
		{@const pct = total > 0 ? Math.round((score / total) * 100) : 0}

		<div
			class="result-banner"
			style="border-left-color: {pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#f44336'};"
		>
			<div class="result-score">
				<span
					class="score-num"
					style="color: {pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#f44336'};"
				>
					{score}/{total}
				</span>
				<span class="score-pct">{pct}%</span>
			</div>
			<p class="result-msg">
				{#if pct === 100}🎉 Hoàn hảo!
				{:else if pct >= 70}👍 Làm tốt lắm!
				{:else if pct >= 40}📚 Cần ôn thêm
				{:else}💪 Cố gắng lên nào!{/if}
			</p>

			<form
				method="POST"
				action="?/restart"
				use:enhance={() => {
					restarting = true;
					return async ({ update }) => {
						await update();
						restarting = false;
					};
				}}
			>
				<input type="hidden" name="submissionId" value={data.submission.id} />
				<input type="hidden" name="categoryId" value={data.category.id} />
				<input type="hidden" name="grade" value={data.grade} />
				<input type="hidden" name="level" value={data.level} />
				<input type="hidden" name="totalQuestions" value={data.questions.length} />
				<Button type="submit" variant="raised">
					<Icon tag="svg" viewBox="0 0 24 24"><path fill="currentColor" d={mdiRefresh} /></Icon>
					<Label>{restarting ? 'Đang tải...' : 'Làm lại'}</Label>
				</Button>
			</form>
		</div>

		<div class="questions-list">
			{#each data.questions as q, i}
				{@const savedA = data.savedAnswers.find((a) => a.questionId === q.id)}
				{@const correct = data.correctAnswers[q.id]}
				{@const isCorrect = savedA?.isCorrect}
				{@const qType = typeConfig[q.questionType] ?? { label: q.questionType, color: '#555' }}
				<Card class="question-card {isCorrect ? 'verdict-correct' : 'verdict-wrong'}">
					<Content>
						<div class="q-header">
							<span class="q-num">{i + 1}</span>
							<span
								class="type-badge"
								style="background:{qType.color}20;color:{qType.color};border:1px solid {qType.color};"
							>
								{qType.label}
							</span>
							<span class="verdict-icon">
								{#if isCorrect}
									<Icon tag="svg" viewBox="0 0 24 24" class="icon-correct">
										<path fill="currentColor" d={mdiCheckCircle} />
									</Icon>
								{:else}
									<Icon tag="svg" viewBox="0 0 24 24" class="icon-wrong">
										<path fill="currentColor" d={mdiCloseCircle} />
									</Icon>
								{/if}
							</span>
						</div>

						<p class="q-text">{q.question}</p>

						{#if q.choices.length > 0}
							<div class="choices-result">
								{#each q.choices as choice}
									{@const isUserPick = savedA?.answer === String(choice.id)}
									{@const isCorrectChoice = correct?.choiceContent === choice.content}
									<div
										class="choice-item"
										class:choice-correct={isCorrectChoice}
										class:choice-user-wrong={isUserPick && !isCorrectChoice}
									>
										{#if isCorrectChoice}
											<Icon tag="svg" viewBox="0 0 24 24" class="ci-icon icon-correct">
												<path fill="currentColor" d={mdiCheckCircle} />
											</Icon>
										{:else if isUserPick && !isCorrectChoice}
											<Icon tag="svg" viewBox="0 0 24 24" class="ci-icon icon-wrong">
												<path fill="currentColor" d={mdiCloseCircle} />
											</Icon>
										{:else}
											<span class="ci-dot"></span>
										{/if}
										<span>{choice.content}</span>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-result">
								<div class="answer-row">
									<span class="ar-label">Bạn trả lời:</span>
									<span class="ar-value {isCorrect ? 'correct-text' : 'wrong-text'}"
										>{savedA?.answer ?? '(bỏ trống)'}</span
									>
								</div>
								{#if !isCorrect}
									<div class="answer-row">
										<span class="ar-label">Đáp án đúng:</span>
										<span class="ar-value correct-text">{correct?.answer}</span>
									</div>
								{/if}
							</div>
						{/if}

						{#if correct?.explanation}
							<p class="explanation"><strong>Giải thích:</strong> {correct.explanation}</p>
						{/if}
					</Content>
				</Card>
			{/each}
		</div>
	{:else}
		<!-- ── QUIZ VIEW ─────────────────────────────────── -->
		<div class="progress-bar-wrap">
			<span class="progress-label">{answeredCount}/{data.questions.length} câu đã trả lời</span>
			<LinearProgress {progress} />
		</div>

		<div class="questions-list">
			{#each data.questions as q, i}
				{@const qType = typeConfig[q.questionType] ?? { label: q.questionType, color: '#555' }}
				<Card class="question-card {answers[q.id] ? 'answered' : ''}">
					<Content>
						<div class="q-header">
							<span class="q-num">{i + 1}</span>
							<span
								class="type-badge"
								style="background:{qType.color}20;color:{qType.color};border:1px solid {qType.color};"
							>
								{qType.label}
							</span>
							{#if answers[q.id]}
								<span class="answered-dot" title="Đã trả lời"></span>
							{/if}
						</div>

						<p class="q-text">{q.question}</p>

						{#if q.choices.length > 0}
							<div class="choices">
								{#each q.choices as choice}
									<button
										type="button"
										class="choice-btn {answers[q.id] === String(choice.id) ? 'selected' : ''}"
										onclick={() => pickAnswer(q.id, String(choice.id))}
									>
										<span
											class="choice-radio {answers[q.id] === String(choice.id) ? 'radio-on' : ''}"
										></span>
										<span>{choice.content}</span>
									</button>
								{/each}
							</div>
						{:else}
							<input
								type="text"
								class="text-input"
								placeholder={q.questionType === 'fill_in_the_blank'
									? 'Điền vào đây...'
									: 'Nhập câu trả lời...'}
								value={answers[q.id] ?? ''}
								oninput={(e) => pickAnswer(q.id, (e.currentTarget as HTMLInputElement).value)}
							/>
						{/if}
					</Content>
				</Card>
			{/each}
		</div>

		<!-- Submit -->
		<div class="submit-area">
			<p class="submit-hint">
				{#if answeredCount < data.questions.length}
					Còn {data.questions.length - answeredCount} câu chưa trả lời. Bạn vẫn có thể nộp bài.
				{:else}
					🎉 Bạn đã trả lời tất cả {data.questions.length} câu!
				{/if}
			</p>
			<form
				method="POST"
				action="?/evaluate"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<input type="hidden" name="submissionId" value={data.submission.id} />
				<Button type="submit" variant="raised" disabled={submitting}>
					<Icon tag="svg" viewBox="0 0 24 24"><path fill="currentColor" d={mdiSend} /></Icon>
					<Label>{submitting ? 'Đang chấm...' : 'Nộp bài'}</Label>
				</Button>
			</form>
		</div>
	{/if}
</div>

<style>
	.quiz-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
	}

	/* ── Breadcrumb ── */
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	.bc-sep {
		color: #888;
		font-size: 1.1rem;
	}
	.level-chip {
		padding: 0.2rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 700;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.header-info h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}
	.subtitle {
		margin: 0.2rem 0 0;
		color: #888;
		font-size: 0.9rem;
	}

	/* ── Progress ── */
	.progress-bar-wrap {
		margin-bottom: 1.5rem;
	}
	.progress-label {
		display: block;
		font-size: 0.85rem;
		color: #888;
		margin-bottom: 0.4rem;
	}

	/* ── Questions list ── */
	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.question-card) {
		border-left: 4px solid var(--mdc-theme-primary, #ff3e00);
		transition: border-color 0.2s;
	}
	:global(.question-card.answered) {
		border-left-color: #4caf50;
	}
	:global(.question-card.verdict-correct) {
		border-left-color: #4caf50;
	}
	:global(.question-card.verdict-wrong) {
		border-left-color: #f44336;
	}

	/* ── Question header ── */
	.q-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}
	.q-num {
		font-weight: 700;
		color: var(--mdc-theme-primary, #ff3e00);
		font-size: 0.9rem;
		min-width: 1.4rem;
	}
	.type-badge {
		padding: 0.15rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.answered-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #4caf50;
		margin-left: auto;
	}
	.verdict-icon :global(.icon-correct) {
		color: #4caf50;
		width: 20px;
		height: 20px;
	}
	.verdict-icon :global(.icon-wrong) {
		color: #f44336;
		width: 20px;
		height: 20px;
	}

	.q-text {
		margin: 0 0 1rem;
		font-size: 1rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	/* ── MC / TF choices (quiz mode) ── */
	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.choice-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 1rem;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		background: none;
		cursor: pointer;
		text-align: left;
		font-size: 0.95rem;
		transition:
			border-color 0.15s,
			background-color 0.15s;
		color: inherit;
	}
	.choice-btn:hover {
		border-color: var(--mdc-theme-primary, #ff3e00);
		background-color: rgba(255, 62, 0, 0.04);
	}
	.choice-btn.selected {
		border-color: var(--mdc-theme-primary, #ff3e00);
		background-color: rgba(255, 62, 0, 0.08);
	}
	.choice-radio {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid #bbb;
		flex-shrink: 0;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.radio-on {
		border-color: var(--mdc-theme-primary, #ff3e00);
		background-color: var(--mdc-theme-primary, #ff3e00);
		box-shadow: inset 0 0 0 3px white;
	}

	/* ── Text input ── */
	.text-input {
		width: 100%;
		padding: 0.6rem 0.9rem;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		font-size: 0.95rem;
		outline: none;
		background: transparent;
		color: inherit;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}
	.text-input:focus {
		border-color: var(--mdc-theme-primary, #ff3e00);
	}

	/* ── Submit area ── */
	.submit-area {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	.submit-hint {
		color: #888;
		font-size: 0.9rem;
		text-align: center;
		margin: 0;
	}

	/* ── Result banner ── */
	.result-banner {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding: 1.5rem;
		border-left: 6px solid #4caf50;
		background-color: rgba(0, 0, 0, 0.04);
		border-radius: 0 8px 8px 0;
		margin-bottom: 2rem;
	}
	.result-score {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.score-num {
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1;
	}
	.score-pct {
		font-size: 1rem;
		color: #888;
	}
	.result-msg {
		flex: 1;
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	/* ── Choices result ── */
	.choices-result {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	.choice-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.94rem;
		background-color: rgba(0, 0, 0, 0.04);
	}
	.choice-correct {
		background-color: #e8f5e9 !important;
		color: #2e7d32;
		font-weight: 600;
	}
	.choice-user-wrong {
		background-color: #ffebee !important;
		color: #c62828;
		text-decoration: line-through;
	}
	:global(.ci-icon) {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	:global(.icon-correct) {
		color: #4caf50;
	}
	:global(.icon-wrong) {
		color: #f44336;
	}
	.ci-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ccc;
		flex-shrink: 0;
	}

	/* ── Text answer result ── */
	.text-result {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	.answer-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.ar-label {
		color: #888;
		font-weight: 600;
	}
	.correct-text {
		color: #2e7d32;
		font-weight: 700;
	}
	.wrong-text {
		color: #c62828;
		text-decoration: line-through;
	}

	/* ── Explanation ── */
	.explanation {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: #aaa;
		background-color: rgba(255, 152, 0, 0.08);
		border-left: 3px solid #ff9800;
		padding: 0.5rem 0.75rem;
		border-radius: 0 6px 6px 0;
		line-height: 1.5;
	}

	/* ── Empty ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 4rem 2rem;
		color: #888;
		text-align: center;
	}
	:global(.empty-icon) {
		width: 56px;
		height: 56px;
	}
</style>
