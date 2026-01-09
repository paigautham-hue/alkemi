import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Super admin email whitelist
const SUPER_ADMIN_EMAILS = [
  "paigautham@gmail.com",
  "gpai@msn.com",
  "gautham@manipalgroup.info"
];

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function determineUserRole(email: string | null | undefined): "admin" | "chemist" {
  if (!email) return "chemist";
  const normalizedEmail = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalizedEmail) ? "admin" : "chemist";
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Get or create organization for this user
      const organizationId = await db.getOrCreateOrganizationForUser(
        userInfo.openId,
        userInfo.name || null
      );
      
      // Determine role based on email
      const role = determineUserRole(userInfo.email);
      
      await db.upsertUser({
        organizationId,
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        role,
        lastSignedIn: new Date(),
      });
      
      if (role === "admin") {
        console.log(`[OAuth] Super admin logged in: ${userInfo.email}`);
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      // Log more details for debugging
      if (error instanceof Error) {
        console.error("[OAuth] Error message:", error.message);
        console.error("[OAuth] Error stack:", error.stack);
      }
      res.status(500).json({ 
        error: "OAuth callback failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
