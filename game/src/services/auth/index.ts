import { firebaseAuthService } from './firebaseAuth';
import { tossAuthService } from './tossAuth';
import { isTossApp } from '../../lib/platform';
import type { AuthService } from './types';

export const authService: AuthService = isTossApp() ? tossAuthService : firebaseAuthService;

export type { User, AuthService } from './types';
