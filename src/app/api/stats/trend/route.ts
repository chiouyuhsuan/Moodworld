import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { COUNTRY_CONTINENT } from "@/lib/referenceData";

export const dynamic = "force-dynamic";

function dateRangeEnding(endDateStr: string, days: number): string[] {
  const end = new Date(endDateStr + "T00:00:00Z");
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// GET /api/stats/trend?scope=global|country:Japan|continent:Asia&range=7|30&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "global";
  const range = Number(searchParams.get("range")) === 30 ? 30 : 7;
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const pool = getPool();
  const days = dateRangeEnding(date, range);
  const startDate = days[0];

  // global series (always computed — used for the dashed reference line)
  const globalRows = await pool.query(
    `SELECT vote_date::text AS d, AVG(mood)::numeric(4,2) AS average
     FROM votes WHERE vote_date BETWEEN $1 AND $2 GROUP BY vote_date`,
    [startDate, date]
  );
  const globalMap = new Map(globalRows.rows.map((r: any) => [r.d, Number(r.average)]));
  const globalSeries = days.map((d) => ({ date: d, average: globalMap.has(d) ? globalMap.get(d)! : null }));

  let scopeMap = globalMap;
  if (scope !== "global") {
    if (scope.startsWith("continent:")) {
      const continent = scope.slice("continent:".length);
      const countryNames = Object.entries(COUNTRY_CONTINENT)
        .filter(([, c]) => c === continent)
        .map(([name]) => name);
      const rows = await pool.query(
        `SELECT vote_date::text AS d, AVG(mood)::numeric(4,2) AS average
         FROM votes WHERE vote_date BETWEEN $1 AND $2 AND country = ANY($3::text[])
         GROUP BY vote_date`,
        [startDate, date, countryNames]
      );
      scopeMap = new Map(rows.rows.map((r: any) => [r.d, Number(r.average)]));
    } else if (scope.startsWith("country:")) {
      const country = scope.slice("country:".length);
      const rows = await pool.query(
        `SELECT vote_date::text AS d, AVG(mood)::numeric(4,2) AS average
         FROM votes WHERE vote_date BETWEEN $1 AND $2 AND country = $3
         GROUP BY vote_date`,
        [startDate, date, country]
      );
      scopeMap = new Map(rows.rows.map((r: any) => [r.d, Number(r.average)]));
    }
  }

  const series = days.map((d) => ({ date: d, average: scopeMap.has(d) ? scopeMap.get(d)! : null }));

  const firstWithData = series.find((p) => p.average !== null);
  const lastWithData = [...series].reverse().find((p) => p.average !== null);
  const delta =
    firstWithData && lastWithData
      ? Math.round((lastWithData.average! - firstWithData.average!) * 10) / 10
      : 0;

  return NextResponse.json({ scope, range, series, global: globalSeries, delta });
}
