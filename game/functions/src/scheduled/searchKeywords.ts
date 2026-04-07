import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { searchWeb, SearchResult } from "../utils/googleSearch.js";
import { searchNaver } from "../utils/naverSearch.js";
import { searchBaidu, searchYahooJapan } from "../utils/serpApiSearch.js";
import { generateSuggestedReply, checkTravelRelevance } from "../utils/aiReply.js";
import { sendAlertEmail } from "../utils/mailer.js";
import { scrapePages } from "../utils/scraper.js";

interface AlertCardInfo {
  id: string;
  title: string;
  siteName: string;
  keyword: string;
  snippet: string;
  url: string;
}

export const searchKeywordsScheduled = onSchedule(
  {
    schedule: "every 1 hours",
    region: "us-central1",
    maxInstances: 1,
    timeoutSeconds: 540,
  },
  async () => {
    const db = admin.firestore();
    console.log("Starting keyword search...");

    // 1. Get active keywords
    const keywordsSnapshot = await db
      .collection("alertKeywords")
      .where("isActive", "==", true)
      .get();

    if (keywordsSnapshot.empty) {
      console.log("No active keywords found.");
      return;
    }

    const keywords = keywordsSnapshot.docs.map((doc) => ({
      id: doc.id,
      keyword: doc.data().keyword as string,
      language: doc.data().language as string,
    }));

    // 2. Get existing URLs to avoid duplicates
    const existingCardsSnapshot = await db
      .collection("alertCards")
      .select("url")
      .get();
    const existingUrls = new Set(
      existingCardsSnapshot.docs.map((doc) => doc.data().url as string)
    );

    // 3. Search for each keyword
    const newCards: AlertCardInfo[] = [];

    for (const kw of keywords) {
      console.log(`Searching for: "${kw.keyword}" (${kw.language})`);

      // Search all sources in parallel
      const [geminiResults, naverResults, baiduResults, yahooJpResults] =
        await Promise.all([
          searchWeb(kw.keyword),
          searchNaver(kw.keyword),
          searchBaidu(kw.keyword),
          searchYahooJapan(kw.keyword),
        ]);

      const results: SearchResult[] = [
        ...geminiResults,
        ...naverResults,
        ...baiduResults,
        ...yahooJpResults,
      ];

      // Deduplicate by URL within this batch
      const seen = new Set<string>();
      const deduped = results.filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

      // Filter out already-seen URLs and our own site
      const newResults = deduped.filter(
        (r) => !existingUrls.has(r.url) && !r.url.includes("salt-bbang.com")
      );

      console.log(`Found ${newResults.length} new results for "${kw.keyword}"`);

      // Scrape page content for new results
      const urlsToScrape = newResults.map((r) => r.url);
      const scrapedMap = await scrapePages(urlsToScrape);

      for (const result of newResults) {
        // Mark URL as seen to avoid duplicates within this batch
        existingUrls.add(result.url);

        // Use scraped content if available, fall back to search snippet
        const scraped = scrapedMap.get(result.url);
        const pageContent = scraped?.success ? scraped.text : "";
        const enrichedSnippet = pageContent || result.snippet;

        // Check if the post is travel-related
        const isRelevant = await checkTravelRelevance(
          result.title,
          enrichedSnippet,
          result.siteName
        );
        if (!isRelevant) continue;

        // Generate AI-suggested reply with richer context
        const suggestedReply = await generateSuggestedReply(
          result.title,
          enrichedSnippet,
          result.siteName,
          kw.keyword
        );

        // Save to Firestore
        const cardRef = await db.collection("alertCards").add({
          keyword: kw.keyword,
          title: result.title,
          snippet: result.snippet,
          url: result.url,
          siteName: result.siteName,
          suggestedReply,
          status: "new",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        newCards.push({
          id: cardRef.id,
          title: result.title,
          siteName: result.siteName,
          keyword: kw.keyword,
          snippet: result.snippet,
          url: result.url,
        });
      }
    }

    // 4. Send email notifications for new cards
    if (newCards.length > 0) {
      const emailsSnapshot = await db.collection("alertEmails").get();
      const emails = emailsSnapshot.docs.map(
        (doc) => doc.data().email as string
      );

      if (emails.length > 0) {
        console.log(
          `Sending alert email to ${emails.length} recipients for ${newCards.length} new cards`
        );
        const sent = await sendAlertEmail(emails, newCards);

        if (sent) {
          // Update notifiedAt for new cards
          const batch = db.batch();
          for (const card of newCards) {
            batch.update(db.collection("alertCards").doc(card.id), {
              notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          await batch.commit();
        }
      }
    }

    console.log(`Keyword search complete. ${newCards.length} new cards created.`);
  }
);
