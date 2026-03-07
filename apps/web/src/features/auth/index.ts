export { authConfigMessages, authSetupChecklist } from './config';
export {
  getExistingSession,
  signInWithOAuth,
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
} from './auth-service';
export type { OAuthProvider, AuthActionResult } from './types';
