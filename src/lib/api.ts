import { db } from "./supabase";
import { emptyProfile, type CVDocument, type ProfileData } from "./model";
export async function loadProfile() {
  const {
    data: { user },
  } = await db().auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  const { data, error } = await db()
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data)
    return data as {
      data: ProfileData;
      revision: number;
      updated_at: string;
      preferences: Record<string, string>;
    };
  const profile = emptyProfile();
  profile.personal.full_name = user.user_metadata.full_name || "";
  profile.personal.email = user.email || "";
  return { data: profile, revision: 1, updated_at: "", preferences: {} };
}
export async function saveProfile(data: ProfileData, revision: number) {
  const result = await db().rpc("save_profile", {
    p_data: data,
    p_revision: revision,
  });
  if (result.error) throw result.error;
  return result.data as {
    data: ProfileData;
    revision: number;
    updated_at: string;
  };
}
export async function listDocuments() {
  const { data, error } = await db()
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as CVDocument[];
}
export async function loadDocument(id: string) {
  const { data, error } = await db()
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    throw new Error(
      "This document is unavailable. It may have been deleted or belong to another account.",
    );
  return data as CVDocument;
}
export async function createDocument(doc: Partial<CVDocument>) {
  const {
    data: { user },
  } = await db().auth.getUser();
  if (!user) throw new Error("Please sign in.");
  const {
    id: _id,
    revision: _revision,
    created_at: _created,
    updated_at: _updated,
    ...rest
  } = doc;
  const { data, error } = await db()
    .from("documents")
    .insert({ ...rest, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as CVDocument;
}
export async function saveDocument(doc: CVDocument, summary: string) {
  const { data, error } = await db().rpc("save_document", {
    p_id: doc.id,
    p_revision: doc.revision,
    p_data: doc,
    p_summary: summary,
  });
  if (error) throw error;
  return data as CVDocument;
}
export async function signedPhoto(path?: string) {
  if (!path) return undefined;
  const { data, error } = await db()
    .storage.from("profile-assets")
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
export function errorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Something went wrong. Please try again.";
  return /fetch|network|offline/i.test(message)
    ? "Could not connect to your cloud. Your edits are still here. Check your connection and try saving again."
    : message;
}

export async function exportRows(table: string) {
  const all: unknown[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db()
      .from(table)
      .select("*")
      .order(table === "profiles" ? "user_id" : "id")
      .range(offset, offset + 499);
    if (error) throw error;
    all.push(...data);
    if (data.length < 500) return all;
  }
}
