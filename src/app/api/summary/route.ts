import { NextResponse } from "next/server";
import { getLatestBanlistWins } from "@/lib/latestBanlistWins";

export async function GET() {
  return NextResponse.json(await getLatestBanlistWins());
}
