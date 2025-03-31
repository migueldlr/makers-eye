import { IdentityWinrateData } from "@/app/stats/actions";
import { createClient } from "@/utils/supabase/server";
import WinrateChart from "./WinrateChart2";

export default async function WinrateSummary({
  tournamentIds,
  side,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
}) {
  const supabase = await createClient();

  const { data: winrates, error } = await supabase.rpc(
    side === "corp"
      ? "get_corp_identity_winrates"
      : "get_runner_identity_winrates",
    {
      tournament_filter: tournamentIds,
    }
  );

  return (
    <WinrateChart winrates={winrates as IdentityWinrateData[]} side={side} />
  );
}
