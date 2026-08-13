// Google Sign-In (Google Identity Services). The Client ID is PUBLIC — safe to
// ship in the browser. Create it in Google Cloud Console → APIs & Services →
// Credentials → OAuth client ID (type: Web application), and add your site to
// "Authorized JavaScript origins":
//   https://rotionapp.com
//   https://motionstudio.graphicspeed.workers.dev   (optional, for testing)
//
// Then paste the Client ID here AND set the same value as the Worker var
// GOOGLE_CLIENT_ID (wrangler.jsonc), which the server uses to verify tokens.
// No client secret is needed for ID-token sign-in.

export const GOOGLE_CLIENT_ID = ''; // e.g. 1234567890-abc.apps.googleusercontent.com

export function googleConfigured() {
  return !!GOOGLE_CLIENT_ID;
}
