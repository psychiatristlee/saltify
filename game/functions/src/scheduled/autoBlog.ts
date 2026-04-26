import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString, defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

const BLOG_BASE_URL = defineString("BLOG_BASE_URL", {
  default: "https://salt-bbang.com",
});
// Shared with App Hosting (CRON_SECRET in /apphosting.yaml). Both services
// reference the same Secret Manager entry.
const CRON_SECRET = defineSecret("CRON_SECRET");

/**
 * Daily blog auto-generation trigger.
 *
 * Runs every hour and only fires when the current Asia/Seoul HH:MM matches
 * the blogConfig.scheduleTime — this lets the user change the schedule from
 * the admin UI without redeploying.
 *
 * The actual generation work happens in the Next.js /api/cron/auto-blog
 * endpoint (so prompt/menu logic lives in one place).
 */
export const autoBlogScheduler = onSchedule(
  {
    schedule: "every 1 hours",
    region: "us-central1",
    timeZone: "Asia/Seoul",
    maxInstances: 1,
    timeoutSeconds: 540,
    secrets: [CRON_SECRET],
  },
  async () => {
    const db = admin.firestore();
    const configDoc = await db.doc("blogConfig/default").get();
    const cfg = configDoc.exists ? configDoc.data() : null;
    const scheduleTime = (cfg?.scheduleTime as string) || "09:00";

    // Current Asia/Seoul HH:MM
    const now = new Date();
    const seoulNow = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now); // "09:00"

    // Match within the same hour (the function fires hourly).
    // Compare hour part — minutes don't have to match exactly because
    // we run hourly and the cron endpoint is idempotent for the day.
    const [schedHour] = scheduleTime.split(":");
    const [nowHour] = seoulNow.split(":");
    if (schedHour !== nowHour) {
      console.log(
        `[autoBlog] skip — current ${seoulNow} KST, scheduled ${scheduleTime}`
      );
      return;
    }

    const url = `${BLOG_BASE_URL.value()}/api/cron/auto-blog`;
    const secret = CRON_SECRET.value();
    if (!secret) {
      console.error("[autoBlog] CRON_SECRET not configured, aborting");
      return;
    }

    console.log(`[autoBlog] firing at ${seoulNow} KST → ${url}`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      });
      const body = await res.text();
      console.log(`[autoBlog] response ${res.status}: ${body.slice(0, 500)}`);
    } catch (err) {
      console.error("[autoBlog] fetch failed", err);
    }
  }
);
