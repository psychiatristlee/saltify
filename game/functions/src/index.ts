import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as admin from "firebase-admin";

// Re-export scheduled functions
export { searchKeywordsScheduled } from "./scheduled/searchKeywords.js";

admin.initializeApp();

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

interface AddRemoveAdminData {
  userId: string;
}

interface SearchData {
  emailQuery: string;
}

// Add admin role to a user (only callable by existing admins)
export const addAdminRole = onCall(async (request: CallableRequest<AddRemoveAdminData>) => {
  // Check if the caller is an admin
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "관리자만 권한을 부여할 수 있습니다.");
  }

  const userId = request.data?.userId;
  if (!userId || typeof userId !== "string") {
    throw new HttpsError("invalid-argument", "유효한 사용자 ID가 필요합니다.");
  }

  try {
    await admin.auth().setCustomUserClaims(userId, { admin: true });
    return { success: true, message: "관리자 권한이 부여되었습니다." };
  } catch (error) {
    console.error("Error adding admin role:", error);
    throw new HttpsError("internal", "관리자 권한 부여에 실패했습니다.");
  }
});

// Remove admin role from a user (only callable by existing admins)
export const removeAdminRole = onCall(async (request: CallableRequest<AddRemoveAdminData>) => {
  // Check if the caller is an admin
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "관리자만 권한을 제거할 수 있습니다.");
  }

  const userId = request.data?.userId;
  if (!userId || typeof userId !== "string") {
    throw new HttpsError("invalid-argument", "유효한 사용자 ID가 필요합니다.");
  }

  // Prevent removing own admin role
  if (request.auth.uid === userId) {
    throw new HttpsError("failed-precondition", "자신의 관리자 권한은 제거할 수 없습니다.");
  }

  try {
    await admin.auth().setCustomUserClaims(userId, { admin: false });
    return { success: true, message: "관리자 권한이 제거되었습니다." };
  } catch (error) {
    console.error("Error removing admin role:", error);
    throw new HttpsError("internal", "관리자 권한 제거에 실패했습니다.");
  }
});

// Get all admin users (only callable by admins)
export const getAllAdmins = onCall(async (request: CallableRequest) => {
  // Check if the caller is an admin
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "관리자만 조회할 수 있습니다.");
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const admins = listUsersResult.users
      .filter((user) => user.customClaims?.admin === true)
      .map((user) => ({
        id: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email || "",
        photoURL: user.photoURL || null,
        isAdmin: true,
      }));

    return { admins };
  } catch (error) {
    console.error("Error getting admins:", error);
    throw new HttpsError("internal", "관리자 목록 조회에 실패했습니다.");
  }
});

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

interface ProcessReferralData {
  referrerId: string;
}

// Process referral securely on server side
export const processReferralSecure = onCall(async (request: CallableRequest<ProcessReferralData>) => {
  // Must be authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const userId = request.auth.uid;
  const referrerId = request.data?.referrerId;

  if (!referrerId || typeof referrerId !== "string") {
    throw new HttpsError("invalid-argument", "유효한 추천인 ID가 필요합니다.");
  }

  // Don't allow self-referral
  if (userId === referrerId) {
    return { success: false, message: "자기 자신을 초대할 수 없습니다.", isExistingUser: false };
  }

  const db = admin.firestore();

  try {
    // Check if this user was already referred
    const referralDoc = await db.collection("referrals").doc(userId).get();
    if (referralDoc.exists && referralDoc.data()?.referredBy) {
      return { success: false, message: "이미 초대된 사용자입니다.", isExistingUser: false };
    }

    // Check if referrer exists
    const referrerUserDoc = await db.collection("users").doc(referrerId).get();
    const referrerReferralDoc = await db.collection("referrals").doc(referrerId).get();
    if (!referrerUserDoc.exists && !referrerReferralDoc.exists) {
      return { success: false, message: "유효하지 않은 초대 코드입니다.", isExistingUser: false };
    }

    // SERVER-SIDE CHECK: Is this an existing user?
    const userDoc = await db.collection("users").doc(userId).get();
    let isExisting = false;

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.totalGamesPlayed > 0 || userData?.lastPlayedAt || userData?.highScore > 0) {
        isExisting = true;
      }
    }

    // Also check coupons
    if (!isExisting) {
      const couponsSnapshot = await db.collection("coupons")
        .where("userId", "==", userId)
        .limit(1)
        .get();
      if (!couponsSnapshot.empty) {
        isExisting = true;
      }
    }

    if (isExisting) {
      // Existing user - just add friend connection, no coupons
      await addFriendConnectionServer(db, userId, referrerId);
      return {
        success: false,
        message: "기존 사용자는 쿠폰을 받을 수 없지만, 친구로 연결되었습니다.",
        isExistingUser: true,
      };
    }

    // New user - process referral
    // Mark as referred
    await db.collection("referrals").doc(userId).set({
      referredBy: referrerId,
      referredAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Add to referrer's list
    await db.collection("referrals").doc(referrerId).set({
      referredUsers: admin.firestore.FieldValue.arrayUnion(userId),
    }, { merge: true });

    return { success: true, message: "초대가 완료되었습니다.", isExistingUser: false };
  } catch (error) {
    console.error("Error processing referral:", error);
    throw new HttpsError("internal", "초대 처리에 실패했습니다.");
  }
});

// Helper function to add bidirectional friend connection
async function addFriendConnectionServer(
  db: admin.firestore.Firestore,
  userId: string,
  friendId: string
): Promise<void> {
  // Add to user's friends
  await db.collection("referrals").doc(userId).set({
    friends: admin.firestore.FieldValue.arrayUnion(friendId),
  }, { merge: true });

  // Add to friend's friends (bidirectional)
  await db.collection("referrals").doc(friendId).set({
    friends: admin.firestore.FieldValue.arrayUnion(userId),
  }, { merge: true });
}

// Create custom token from a verified Firebase ID token (for native → web SDK auth sync)
export const createCustomToken = onCall(async (request: CallableRequest<{ idToken: string }>) => {
  const idToken = request.data?.idToken;
  if (!idToken || typeof idToken !== "string") {
    throw new HttpsError("invalid-argument", "ID 토큰이 필요합니다.");
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const customToken = await admin.auth().createCustomToken(decoded.uid);
    return { customToken };
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new HttpsError("unauthenticated", "유효하지 않은 ID 토큰입니다.");
  }
});

// Create Firebase custom token for Toss game users (Apps in Toss)
export const createTossGameToken = onCall(async (request: CallableRequest<{ tossUserHash: string }>) => {
  const tossUserHash = request.data?.tossUserHash;
  if (!tossUserHash || typeof tossUserHash !== "string") {
    throw new HttpsError("invalid-argument", "토스 유저 해시가 필요합니다.");
  }

  // Create deterministic UID from Toss user hash to avoid collisions with Firebase UIDs
  const uid = `toss_${tossUserHash}`;

  try {
    // Get or create the Firebase user
    try {
      await admin.auth().getUser(uid);
    } catch {
      await admin.auth().createUser({
        uid,
        displayName: "토스 사용자",
      });
    }

    const customToken = await admin.auth().createCustomToken(uid);
    return { customToken };
  } catch (error) {
    console.error("Error creating Toss game token:", error);
    throw new HttpsError("internal", "토스 게임 토큰 생성에 실패했습니다.");
  }
});

// Exchange Toss authorization code for Firebase custom token (Apps in Toss OAuth flow)
export const exchangeTossToken = onCall(async (request: CallableRequest<{ authorizationCode: string; referrer: string }>) => {
  const authorizationCode = request.data?.authorizationCode;
  if (!authorizationCode || typeof authorizationCode !== "string") {
    throw new HttpsError("invalid-argument", "인가 코드가 필요합니다.");
  }

  try {
    // TODO: Exchange authorizationCode with Toss OAuth server
    // Requires TOSS_CLIENT_ID and TOSS_CLIENT_SECRET from Apps in Toss console
    // const tokenResponse = await fetch('https://api.apps-in-toss.com/oauth/token', { ... });
    // const userInfo = await fetch('https://api.apps-in-toss.com/user/info', { ... });

    // For now, create user based on the authorization code hash
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update(authorizationCode).digest("hex").substring(0, 28);
    const uid = `toss_oauth_${hash}`;

    try {
      await admin.auth().getUser(uid);
    } catch {
      await admin.auth().createUser({
        uid,
        displayName: "토스 사용자",
      });
    }

    const customToken = await admin.auth().createCustomToken(uid);
    return { customToken };
  } catch (error) {
    console.error("Error exchanging Toss token:", error);
    throw new HttpsError("internal", "토스 토큰 교환에 실패했습니다.");
  }
});

// Delete user account and data (for Toss users who can't use Firebase deleteUser directly)
export const deleteUserAccount = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const userId = request.auth.uid;
  const db = admin.firestore();

  try {
    // Delete user data from Firestore
    const collections = ["users", "referrals", "coupons"];
    for (const col of collections) {
      const docRef = db.collection(col).doc(userId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        await docRef.delete();
      }
    }

    // Delete the Firebase Auth user
    await admin.auth().deleteUser(userId);

    return { success: true };
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw new HttpsError("internal", "계정 삭제에 실패했습니다.");
  }
});

// Search users by email (only callable by admins)
export const searchUsersByEmail = onCall(async (request: CallableRequest<SearchData>) => {
  // Check if the caller is an admin
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "관리자만 검색할 수 있습니다.");
  }

  const emailQuery = request.data?.emailQuery;
  if (!emailQuery || typeof emailQuery !== "string") {
    throw new HttpsError("invalid-argument", "검색어가 필요합니다.");
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users
      .filter((user) =>
        user.email && user.email.toLowerCase().includes(emailQuery.toLowerCase())
      )
      .slice(0, 20)
      .map((user) => ({
        id: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email || "",
        photoURL: user.photoURL || null,
        isAdmin: user.customClaims?.admin === true,
      }));

    return { users };
  } catch (error) {
    console.error("Error searching users:", error);
    throw new HttpsError("internal", "사용자 검색에 실패했습니다.");
  }
});
