import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CharacterData, createInitialCharacter } from '../../models/Character';
import { Inventory, createInitialInventory } from '../../models/Item';

const USERS_COLLECTION = 'users';
const REFERRALS_COLLECTION = 'referrals';

export interface CharacterDocument {
  character: CharacterData;
  inventory: Inventory;
}

export async function loadCharacterData(userId: string): Promise<CharacterDocument> {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      character: data.character ?? createInitialCharacter(),
      inventory: data.inventory ?? createInitialInventory(),
    };
  }
  return {
    character: createInitialCharacter(),
    inventory: createInitialInventory(),
  };
}

export async function saveCharacterData(
  userId: string,
  character: CharacterData,
  inventory: Inventory,
): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    { character, inventory },
    { merge: true },
  );
}

export interface FriendCharacter {
  userId: string;
  displayName: string;
  photoURL: string | null;
  character: CharacterData;
}

// Load characters of referred friends (both directions: people I invited + person who invited me)
export async function loadFriendsCharacters(userId: string): Promise<FriendCharacter[]> {
  try {
    // Get my referral doc to find people I invited
    const myReferralDoc = await getDoc(doc(db, REFERRALS_COLLECTION, userId));
    const friendIds: Set<string> = new Set();

    if (myReferralDoc.exists()) {
      const data = myReferralDoc.data();
      // People I referred
      if (data.referredUsers) {
        (data.referredUsers as string[]).forEach((id) => friendIds.add(id));
      }
      // Person who referred me
      if (data.referredBy) {
        friendIds.add(data.referredBy as string);
      }
    }

    if (friendIds.size === 0) return [];

    // Load each friend's user doc
    const friends: FriendCharacter[] = [];
    const promises = Array.from(friendIds).map(async (friendId) => {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, friendId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        friends.push({
          userId: friendId,
          displayName: data.displayName || '???',
          photoURL: data.photoURL || null,
          character: data.character ?? createInitialCharacter(),
        });
      }
    });

    await Promise.all(promises);
    // Sort by level descending
    friends.sort((a, b) => b.character.level - a.character.level);
    return friends;
  } catch (error) {
    console.error('Error loading friends characters:', error);
    return [];
  }
}
