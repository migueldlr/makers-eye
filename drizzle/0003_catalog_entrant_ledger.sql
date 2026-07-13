CREATE INDEX "standings_tournament_swiss_idx"
	ON "standings" USING btree ("tournament_id", "swiss_rank");
