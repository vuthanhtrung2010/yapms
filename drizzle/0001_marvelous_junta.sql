CREATE TYPE "public"."submission_status" AS ENUM('completing', 'evaluated');--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text,
	"is_correct" boolean,
	CONSTRAINT "submission_answers_submission_id_question_id_unique" UNIQUE("submission_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" integer NOT NULL,
	"grade" smallint NOT NULL,
	"level" smallint NOT NULL,
	"status" "submission_status" DEFAULT 'completing' NOT NULL,
	"score" integer,
	"total_questions" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"evaluated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;