import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as admin from "firebase-admin";

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
