// app/sessions.js

import { createCookieSessionStorage } from "@remix-run/node";

// Create session storage with secure cookie settings
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "shopify_app_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET], // add this env variable in your .env file
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
});

// Export helper functions
export const getSession = (cookie) => sessionStorage.getSession(cookie);
export const commitSession = (session) => sessionStorage.commitSession(session);
export const destroySession = (session) => sessionStorage.destroySession(session);
