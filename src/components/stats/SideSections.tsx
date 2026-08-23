import ChartSection from "./ChartSection";
import MatchupSummary from "./wrappers/MatchupSummary";
import RepresentationChart from "./wrappers/RepresentationChart";
import WinrateSummary from "./wrappers/WinrateSummary";
import CutSwissComparison from "./wrappers/CutSwissComparison";
import WinrateDistributionChart from "./wrappers/WinrateDistributionChart";

/**
 * The Corp and Runner halves of the stats page show the same five charts, so
 * they are generated from one definition rather than duplicated per side.
 */
export default function SideSections({
  side,
  tournamentIds,
  includeCut,
  includeSwiss,
}: {
  side: "corp" | "runner";
  tournamentIds: number[];
  includeCut: boolean;
  includeSwiss: boolean;
}) {
  const label = side === "corp" ? "Corp" : "Runner";

  return (
    <>
      <ChartSection
        id={`${side}-representation`}
        title={`${label} representation`}
      >
        <RepresentationChart
          tournamentIds={tournamentIds}
          side={side}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />
      </ChartSection>

      <ChartSection id={`${side}-winrates`} title={`${label} winrates`}>
        <WinrateSummary
          tournamentIds={tournamentIds}
          side={side}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />
      </ChartSection>

      <ChartSection
        id={`${side}-swiss-comparison`}
        title={`${label} swiss comparison`}
      >
        <CutSwissComparison tournamentIds={tournamentIds} side={side} />
      </ChartSection>

      <ChartSection
        id={`${side}-winrate-distribution`}
        title={`${label} winrate distribution`}
      >
        <WinrateDistributionChart
          tournamentIds={tournamentIds}
          side={side}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />
      </ChartSection>

      <ChartSection id={`${side}-matchups`} title={`${label} matchups`}>
        <MatchupSummary
          tournamentIds={tournamentIds}
          side={side}
          includeCut={includeCut}
          includeSwiss={includeSwiss}
        />
      </ChartSection>
    </>
  );
}
