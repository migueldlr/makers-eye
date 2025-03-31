import { CorpWinrateData } from "@/app/stats/actions";
import { createClient } from "@/utils/supabase/server";
import WinrateChart from "./WinrateChart2";

export default async function WinrateSummary({
  tournamentIds,
}: {
  tournamentIds: number[];
}) {
  const supabase = await createClient();

  const { data: winrates, error } = await supabase.rpc(
    "get_corp_identity_winrates",
    {
      tournament_filter: tournamentIds,
    }
  );

  return <WinrateChart winrates={winrates as CorpWinrateData[]} />;
}
