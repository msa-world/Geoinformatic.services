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

  const form = await req.formData();
  const userId = form.get("userId")?.toString();
  const file = form.get("file") as any;
  if (!userId || !file) return NextResponse.json({ error: "userId and file required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("id,google_refresh_token").eq("id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile || !profile.google_refresh_token) return NextResponse.json({ error: "no google token" }, { status: 404 });

  try {
    const tokenResp: any = await refreshAccessToken(profile.google_refresh_token);
    const accessToken = tokenResp.access_token;

    const fileName = file.name || "upload";
    const fileType = file.type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();

    const metadata = { name: fileName };
    const uploadForm = new FormData();
    uploadForm.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    uploadForm.append("file", new Blob([arrayBuffer], { type: fileType }), fileName);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: uploadForm as any,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(text || "Drive upload failed");
    }
    const json = await uploadRes.json();
    return NextResponse.json({ file: json });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
