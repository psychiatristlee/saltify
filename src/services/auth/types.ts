export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'firebase' | 'toss';
}

export interface AuthService {
  getCurrentUser(): User | null;
  signInWithGoogle(): Promise<User>;
  signInWithKakao(): Promise<User>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
