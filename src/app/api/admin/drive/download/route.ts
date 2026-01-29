import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams();
  params.append("client_id", process.env.GOOGLE_CLIENT_ID || "");
  params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET || "");
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: params,
  });
  if (!r.ok) throw new Error("Failed to refresh google token");
  return r.json();
}

export async function POST(req: Request) {
  const adminToken = req.headers.get("x-admin-token");
  if (!adminToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, fileId } = await req.json();
  if (!userId || !fileId) return NextResponse.json({ error: "userId and fileId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("id,google_refresh_token").eq("id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile || !profile.google_refresh_token) return NextResponse.json({ error: "no google token" }, { status: 404 });

  try {
    const tokenResp: any = await refreshAccessToken(profile.google_refresh_token);
    const accessToken = tokenResp.access_token;
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!driveRes.ok) {
      const text = await driveRes.text();
      throw new Error(text || "Drive download failed");
    }
    const contentType = driveRes.headers.get("content-type") || "application/octet-stream";
    const body = await driveRes.arrayBuffer();
    return new Response(body, { headers: { "Content-Type": contentType } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
