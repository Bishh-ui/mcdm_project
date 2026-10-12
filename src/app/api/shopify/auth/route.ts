import { NextRequest, NextResponse } from "next/server";
import { shopifyConfig } from "@/lib/shopify/config";
import crypto from "crypto";

/**
 * GET /api/shopify/auth?shop=store.myshopify.com
 * Redirects the user to Shopify's OAuth consent screen.
 */
export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop");

  if (!shop) {
    return NextResponse.json(
      { error: "Missing 'shop' parameter. Provide the myshopify.com domain." },
      { status: 400 }
    );
  }

  // Sanitize shop domain
  const domain = shop.includes(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;

  // Generate a random nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString("hex");

  // Store nonce in a cookie for verification in the callback
  const redirectUrl = `${shopifyConfig.appUrl}/api/shopify/callback`;

  const authUrl = new URL(`https://${domain}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", shopifyConfig.clientId);
  authUrl.searchParams.set("scope", shopifyConfig.scopes);
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  authUrl.searchParams.set("state", nonce);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("shopify_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  response.cookies.set("shopify_shop", domain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
