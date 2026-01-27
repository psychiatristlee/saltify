import { firebaseAuthService } from './firebaseAuth';
import type { AuthService } from './types';

// 나중에 토스 인증 추가 시:
// import { tossAuthService } from './tossAuth';
// const authProvider = import.meta.env.VITE_AUTH_PROVIDER;
// export const authService: AuthService = authProvider === 'toss' ? tossAuthService : firebaseAuthService;

export const authService: AuthService = firebaseAuthService;

export type { User, AuthService } from './types';
