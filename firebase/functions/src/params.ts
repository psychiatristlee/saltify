import { defineSecret } from "firebase-functions/params";

/**
 * Secret Manager-backed params for the keyword-alert pipeline.
 *
 * These were `defineString`, which bakes the value into the deployed function
 * configuration in plain text — readable in the console and not redacted in
 * logs. `defineSecret` keeps them in Secret Manager instead, which also means
 * firebase/functions/.env no longer has to travel between machines.
 *
 * GMAIL_USER and NAVER_CLIENT_ID are not secrets on their own, but leaving
 * them behind would keep .env alive for two values and defeat the point.
 *
 * A secret is only readable by a function that lists it in `secrets:`, and a
 * missing binding fails at runtime rather than at deploy. Bind the whole array
 * below instead of picking values per call site, so adding a secret here is
 * enough.
 */
export const GMAIL_USER = defineSecret("GMAIL_USER");
export const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
export const NAVER_CLIENT_ID = defineSecret("NAVER_CLIENT_ID");
export const NAVER_CLIENT_SECRET = defineSecret("NAVER_CLIENT_SECRET");
export const SERPAPI_KEY = defineSecret("SERPAPI_KEY");
export const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

/** Every secret reachable from searchKeywordsScheduled. */
export const KEYWORD_ALERT_SECRETS = [
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  SERPAPI_KEY,
  GOOGLE_GENAI_API_KEY,
];
