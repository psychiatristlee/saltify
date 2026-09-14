import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as admin from "firebase-admin";

// Re-export scheduled functions
export { searchKeywordsScheduled } from "./scheduled/searchKeywords.js";
export { autoBlogScheduler } from "./scheduled/autoBlog.js";

admin.initializeApp();

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// Delete invalid alert cards (vertexai URLs, Reddit, YouTube) - admin only
export const cleanupInvalidAlertCards = onCall(async (request: CallableRequest) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "관리자만 실행할 수 있습니다.");
  }

  try {
    const db = admin.firestore();
    const cardsSnapshot = await db.collection("alertCards").get();

    const invalidPatterns = [
      "vertexaisearch.cloud.google.com",
      "reddit.com",
      "youtube.com",
      "youtu.be",
      "instagram.com",
      "facebook.com",
      "twitter.com",
      "x.com",
    ];

    const batch = db.batch();
    let deleteCount = 0;

    cardsSnapshot.docs.forEach((doc) => {
      const url = doc.data().url as string;
      if (url && invalidPatterns.some((pattern) => url.includes(pattern))) {
        batch.delete(doc.ref);
        deleteCount++;
      }
    });

    if (deleteCount > 0) {
      await batch.commit();
    }

    return { success: true, deletedCount: deleteCount };
  } catch (error) {
    console.error("Error cleaning up alert cards:", error);
    throw new HttpsError("internal", "정리에 실패했습니다.");
  }
});
