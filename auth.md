# Google Auth Implementation (NextAuth frontend + Spring Boot/JWT backend)

This describes how "Sign in with Google" works in this repo. The pattern is:
**NextAuth handles the OAuth dance with Google on the frontend, then hands
the Google ID token to the backend, which verifies it independently and
issues its own JWT.** The backend never trusts NextAuth's session directly —
it mints its own token that all API calls use.

> This repo's backend is Spring Boot (Java), not Express. The sections below
> were originally written for a Node/Express backend and are kept as a
> reference for the general pattern; see "Actual implementation in this repo"
> further down for what's really wired up here (`GoogleIdTokenVerifier`
> instead of `google-auth-library`, field name `idToken` not `token`, no
> server-driven `oauth2Login` redirect flow).

## Architecture

```
Browser --(1) signIn("google")--> NextAuth (frontend, Next.js route handler)
                                        |
                                        | (2) OAuth redirect/consent w/ Google
                                        v
                                   Google OAuth
                                        |
                                        | (3) id_token back to NextAuth
                                        v
NextAuth signIn() callback --(4) POST /api/auth/google { token: id_token }--> Backend
                                        |
                                        | (5) verifyIdToken(id_token) via google-auth-library
                                        | (6) find-or-create User row, sign backend JWT
                                        v
                                   Backend responds { user, token }
                                        |
NextAuth stores backend JWT + user in the NextAuth session (jwt strategy)
                                        |
Browser uses `session.accessToken` as Bearer token on subsequent API calls
```

Two distinct tokens exist:
- **Google ID token** — only used once, server-to-server, to prove identity to the backend.
- **Backend JWT** — what the frontend actually uses for all authenticated API calls (`Authorization: Bearer <token>`), independent of NextAuth's own session cookie.

## Frontend (Next.js + NextAuth v4)

### Dependencies
```
next-auth@^4.24.0
axios
```

### `src/lib/auth.ts` — NextAuth config
```ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    // Runs after Google redirects back with tokens.
    async signIn({ user, account, profile }) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
          { token: account?.id_token },
        );

        const authData = response.data.data;
        if (authData?.token) {
          // Stash the backend's JWT + user record onto the NextAuth `user`
          // object so the jwt() callback below can pick it up.
          user.accessToken = authData.token;
          user.backendUser = authData.user;
          return true;
        }
        return false; // blocks sign-in if backend rejects the token
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    // Persists accessToken/backendUser into the encrypted JWT session token.
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.backendUser = user.backendUser;
      }
      return token;
    },
    // Exposes them on the client-facing `session` object.
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = { ...session.user, ...token.backendUser };
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days, matches backend JWT expiry
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;
```

Note: `user.accessToken`, `user.backendUser`, `session.accessToken` etc.
require augmenting NextAuth's TypeScript types (a `next-auth.d.ts` declaring
`interface Session`/`User`/`JWT` with these extra fields) — check for that
file when porting.

### API route — `src/app/api/auth/[...nextauth]/route.ts`
```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Provider wrapper — `src/app/providers.tsx`
```tsx
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```
Wrap the root layout's `{children}` in `<Providers>` (in `layout.tsx`).

### Triggering sign-in — `src/app/auth/signin/page.tsx`
```tsx
"use client";
import { signIn } from "next-auth/react";

const handleGoogleSignIn = async () => {
  await signIn("google", { callbackUrl: "/dashboard" });
};
```
A plain button calling `signIn("google", ...)` — no custom OAuth UI needed,
NextAuth handles the redirect to Google's consent screen.

### Frontend env vars
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=...   # required by NextAuth, not shown above but mandatory
NEXTAUTH_URL=http://localhost:3000
```

## Backend (Express + google-auth-library + jsonwebtoken)

### Dependencies
```
google-auth-library@^9.1.0
jsonwebtoken@^9.0.2
```

### `src/services/AuthService.ts` — core logic
```ts
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Op } from "sequelize";

export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async authenticateWithGoogle(token: string) {
    // 1. Verify the ID token's signature/audience/expiry against Google.
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid Google token");
    const { email, name, picture, sub } = payload; // `sub` = stable Google user id

    // 2. Find-or-create the local user, matching on email OR google_id
    //    (so a user who registered by email first still links up on
    //    first Google sign-in).
    let user = await User.findOne({
      where: { [Op.or]: [{ email }, { google_id: sub }] },
    });

    if (!user) {
      user = await User.create({
        email: email!,
        google_id: sub!,
        name: name!,
        avatar_url: picture || "",
        role: "customer",
        phone: "",
        verified: true, // Google accounts are treated as pre-verified
      });
    } else {
      await user.update({
        google_id: sub!,
        name: name!,
        avatar_url: picture || "",
        last_login: new Date(),
      });
    }

    // 3. Issue the backend's own JWT — this is what the frontend actually uses.
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      token: jwtToken,
    };
  }
}
```

Key points worth carrying over:
- **`verifyIdToken` is the trust boundary.** It validates the token's
  signature against Google's public keys and checks `audience` ===
  `GOOGLE_CLIENT_ID`. Never trust a decoded-but-unverified JWT payload from
  the client.
- **Find-or-create by `email` OR `google_id`** avoids duplicate accounts if
  a user signs up by email/password first and later uses Google.
- The backend JWT payload is intentionally minimal (`id`, `email`, `role`)
  — enough to authorize requests without a DB hit on every route (though
  this project's middleware still does a DB lookup, see below).

### `src/controllers/AuthController.ts` — thin HTTP wrapper
```ts
async googleAuth(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: "Google token is required" });

  try {
    const result = await authService.authenticateWithGoogle(token);
    res.status(200).json({ success: true, data: result, message: "Authentication successful" });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || "Authentication failed" });
  }
}
```

### `src/routes/auth.ts`
```ts
router.post("/google", authController.googleAuth);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", authController.getCurrentUser);
```
Mounted at `/api/auth` in the app entrypoint.

### `src/middlewares/auth.ts` — protecting other routes
```ts
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };

  const user = await User.findByPk(decoded.id);
  if (!user) return res.status(401).json({ success: false, message: "User not found." });

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
};
```
Apply this to any route that needs a logged-in user; `req.user.role` feeds
role-based route guards (`src/middlewares/role.ts` in this repo).

### `User` model fields relevant to Google auth
```ts
email!: string;        // unique, required
google_id!: string;    // unique, nullable — populated on first Google sign-in
name!: string;
avatar_url!: string;
role!: string;         // "customer" | "security_provider" | "admin"
verified!: boolean;
last_login!: Date;
```
`toJSON()` strips `google_id` before sending user objects to the client.

### Backend env vars
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback  # not actually used by verifyIdToken flow, kept for OAuth2Client constructor
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
```
Note: `GOOGLE_REDIRECT_URI` is passed to the `OAuth2Client` constructor but
this flow never does a server-side redirect — NextAuth handles the full
OAuth redirect on the frontend and only ships the resulting `id_token` to
the backend. It's effectively vestigial here; safe to omit if not doing a
server-driven OAuth flow elsewhere.

## Google Cloud Console setup (needed either way)

1. Create an OAuth 2.0 Client ID (Web application) in Google Cloud Console.
2. Authorized JavaScript origins: your frontend origin(s), e.g. `http://localhost:3000`.
3. Authorized redirect URIs: NextAuth's callback, e.g. `http://localhost:3000/api/auth/callback/google`.
4. Use the same Client ID on both frontend (`GOOGLE_CLIENT_ID` for NextAuth) and backend (`GOOGLE_CLIENT_ID` as the `audience` for `verifyIdToken`) — they must match, or token verification fails.

## Actual implementation in this repo

The backend is Spring Boot, and the frontend previously used a server-driven
`oauth2Login` redirect instead of NextAuth. Both have been ported to match
the pattern above. Differences from the generic write-up:

- **Backend token verification** (`backend/src/main/java/.../services/AuthService.java`):
  uses `com.google.api-client:google-api-client`'s `GoogleIdTokenVerifier`
  instead of `google-auth-library`. It's built once in a `@PostConstruct`
  with `setAudience(List.of(googleClientId))`, and `verify(idToken)` is the
  trust boundary — a `null` return or thrown exception means the token is
  rejected. There used to be a version of this method that just base64-decoded
  the JWT payload with a regex and never checked the signature; that was a
  critical auth bypass (anyone could forge a token-shaped JSON blob with any
  email/sub) and has been replaced.
- **Request field name**: the backend's `AuthRequest` DTO has always used
  `idToken`, not `token`. The frontend's NextAuth `signIn` callback posts
  `{ idToken: account.id_token }` to match.
- **Endpoint URL**: `POST {NEXT_PUBLIC_API_URL}/auth/google` — this repo's
  `NEXT_PUBLIC_API_URL` already includes the `/api` prefix (e.g.
  `http://localhost:8080/api`), matching the convention used by `lib/api.ts`
  elsewhere in the frontend.
- **No server-driven OAuth2 login.** `spring-boot-starter-oauth2-client`,
  `CustomOAuth2UserService`, `OAuth2LoginSuccessHandler`, and the
  `.oauth2Login(...)` block in `SecurityConfig` were removed — NextAuth now
  owns the entire OAuth redirect/consent dance, so Spring never needs to
  talk to Google directly. `spring-boot-starter-security` was added back
  explicitly since it was previously being pulled in transitively by the
  oauth2-client starter.
- **NextAuth config** lives at `frontend/src/lib/authOptions.ts` (not
  `lib/auth.ts` — that file already held unrelated helpers: `signOut`,
  `selectRole`, the `AuthResponse` type — so the NextAuth config got its own
  file to avoid a collision).
- **Bridging to the rest of the app**: most pages in this frontend read the
  backend JWT from `localStorage` (`localStorage.getItem("token")`) rather
  than `useSession()`. `frontend/src/app/auth/page.tsx` mirrors
  `session.accessToken`/`session.user` into `localStorage` right after
  NextAuth completes sign-in, so the rest of the app didn't need a rewrite.

### Setup checklist

- [ ] `cd frontend && npm install` — adds `next-auth` (added to
      `package.json` but not installed in this environment because npm
      couldn't reach the configured registry over this network).
- [ ] `frontend/.env.local` needs `NEXTAUTH_URL` and `NEXTAUTH_SECRET` (both
      have been added/generated already) alongside the existing
      `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
- [ ] In Google Cloud Console, add authorized redirect URI
      `http://localhost:3000/api/auth/callback/google` (NextAuth's callback).
      The old Spring callback (`http://localhost:8080/login/oauth2/code/google`)
      is no longer used and can be removed once this is confirmed working.
- [ ] Backend keeps `GOOGLE_CLIENT_ID` (used as the verifier's audience);
      `GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI` are no longer read by the
      backend (only the frontend's NextAuth config needs the secret now).
