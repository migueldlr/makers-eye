CREATE INDEX "standings_tournament_top_cut_idx"
	ON "standings" USING btree ("tournament_id", "top_cut_rank")
	WHERE "top_cut_rank" > 0;--> statement-breakpoint
CREATE INDEX "tournaments_catalog_published_date_idx"
	ON "tournaments" USING btree ("date" DESC, "id" DESC)
	WHERE "catalog_published" = true;
