"use client";

import { getIdentityWinrates, IdentityWinrateData } from "@/app/stats/actions";
import WinrateChart from "../charts/WinrateChart2";
import { useEffect, useState } from "react";

export default function WinrateSummary({
  tournamentIds,
  side,
  includeCut,
  includeSwiss,
}: {
  tournamentIds: number[];
  side: "corp" | "runner";
  includeCut: boolean;
  includeSwiss: boolean;
}) {
  const [winrates, setWinrates] = useState<IdentityWinrateData[]>([]);
  useEffect(() => {
    (async () => {
      const data = await getIdentityWinrates({
        tournamentIds,
        side,
        includeCut,
        includeSwiss,
      });
      setWinrates(data);
    })();
  }, [tournamentIds]);

  return <WinrateChart winrates={winrates as IdentityWinrateData[]} />;
}
