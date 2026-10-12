export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { shopifyConfig } from "@/lib/shopify/config";
import { setDocument } from "@/lib/firebase/firestore";
import crypto from "crypto";

/**
 * GET /api/shopify/callback
 * Shopify redirects here after merchant authorizes the app.
 * Exchanges the authorization code for a permanent access token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");
  const hmac = searchParams.get("hmac");

  // Validate required params
  if (!code || !shop || !state || !hmac) {
    return NextResponse.json(
      { error: "Missing required OAuth parameters" },
      { status: 400 }
    );
  }

  // Verify nonce (CSRF protection)
  const storedNonce = request.cookies.get("shopify_nonce")?.value;
  if (!storedNonce || storedNonce !== state) {
    return NextResponse.json(
      { error: "Invalid state parameter. Possible CSRF attack." },
      { status: 403 }
    );
  }

  // Verify HMAC
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "hmac") params.set(key, value);
  });
  params.sort();
  const message = params.toString();
  const expectedHmac = crypto
    .createHmac("sha256", shopifyConfig.clientSecret)
    .update(message)
    .digest("hex");

  if (hmac !== expectedHmac) {
    return NextResponse.json(
      { error: "HMAC validation failed" },
      { status: 403 }
    );
  }

  // Exchange code for permanent access token
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: shopifyConfig.clientId,
      client_secret: shopifyConfig.clientSecret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return NextResponse.json(
      { error: `Token exchange failed: ${body}` },
      { status: 500 }
    );
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    scope: string;
  };

  // Store the token in Firestore (encrypted in production)
  await setDocument(`shopify_stores/${shop}`, {
    shop,
    accessToken: tokenData.access_token,
    scope: tokenData.scope,
    installedAt: new Date().toISOString(),
    lastSyncAt: null,
  });

  // Redirect to dashboard with success message
  const response = NextResponse.redirect(
    `${shopifyConfig.appUrl}/dashboard/connectors?connected=shopify&shop=${shop}`
  );

  // Clear the nonce cookie
  response.cookies.delete("shopify_nonce");

  return response;
}
