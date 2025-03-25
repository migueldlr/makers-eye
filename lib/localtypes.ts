export type StandingResult = {
  tournament: number;
  topCutRank?: number;
  swissRank: number;
  name: string;
  corpIdentity: string;
  runnerIdentity: string;
  corpWins: number;
  corpLosses: number;
  corpDraws: number;
  runnerWins: number;
  runnerLosses: number;
  runnerDraws: number;
  matchPoints: number;
  strengthOfSchedule: number;
  extendedStrengthOfSchedule: number;
};
