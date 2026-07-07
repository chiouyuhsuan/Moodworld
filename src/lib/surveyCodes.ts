// Survey-exchange platform redeem codes — MoodWorld is listed on point-trading
// survey directories (SurveyCircle today, possibly SurveySwap etc. later).
// Their respondents must land back on the origin platform with a proof code
// to claim their points; there's no API between us and them, just this
// static per-listing code shown once to anyone who arrives via ?ref=<key>.
//
// Detection lives in src/app/page.tsx (?ref=<key> -> localStorage flag,
// cleared the first time the redeem card is actually shown on the voted
// screen). Extend this map — not the component logic — when a new platform
// listing goes live.

export type SurveyCodeConfig = {
  label: string;
  code: string;
  redeemUrl: string;
  message: string;
};

export const SURVEY_CODES: Record<string, SurveyCodeConfig> = {
  surveycircle: {
    label: "SurveyCircle",
    code: "6G39-8685-S1G8-1H4N",
    redeemUrl: "https://www.surveycircle.com/6G39-8685-S1G8-1H4N/",
    message:
      "Redeem the following Survey Code at surveycircle.com and get free survey participants through SurveyCircle.",
  },
};
