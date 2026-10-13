// Integration checks against an explicitly supplied disposable local Supabase stack.
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
const file = process.env.CLOUDCV_LOCAL_CONFIG;
if (!file)
  throw new Error(
    "Set CLOUDCV_LOCAL_CONFIG to the private JSON output of supabase status -o json.",
  );
const config = JSON.parse(fs.readFileSync(file, "utf8"));
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(config.API_URL))
  throw new Error("Tests must target disposable local Supabase.");
const client = () =>
  createClient(config.API_URL, config.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const a = client(),
  b = client(),
  anon = client();
const stamp = Date.now();
const password = crypto.randomBytes(20).toString("base64url") + "9a";
const identities = [];
let passed = 0;
const check = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log("PASS " + name);
    });
async function emailToken(email, type) {
  for (let i = 0; i < 30; i++) {
    const list = await fetch("http://127.0.0.1:54324/api/v1/messages").then(
      (r) => r.json(),
    );
    const msg = list.messages.find(
      (m) =>
        m.To.some((t) => t.Address === email) &&
        (type === "recovery"
          ? /reset/i.test(m.Subject)
          : /confirm/i.test(m.Subject)),
    );
    if (msg) {
      const full = await fetch(
        "http://127.0.0.1:54324/api/v1/message/" + msg.ID,
      ).then((r) => r.json());
      const match = (full.Text + " " + full.HTML).match(/token=([^&\s"<>]+)/);
      if (match) return match[1];
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Verification email was not delivered locally.");
}
async function signup(c, email) {
  const r = await c.auth.signUp({
    email,
    password,
    options: { data: { full_name: "Synthetic QA User" } },
  });
  assert.ifError(r.error);
  assert.equal(r.data.session, null);
  identities.push(r.data.user.id);
  const token = await emailToken(email, "signup");
  const verified = await c.auth.verifyOtp({
    token_hash: token,
    type: "signup",
  });
  assert.ifError(verified.error);
  assert.ok(verified.data.session);
  return verified.data.user;
}
try {
  let ua, ub, doc;
  const email = `qa-a-${stamp}@example.test`;
  await check(
    "registration requires verified email and local confirmation completes",
    async () => {
      ua = await signup(a, email);
      ub = await signup(b, `qa-b-${stamp}@example.test`);
    },
  );
  await check("duplicate registration does not grant a session", async () => {
    const result = await anon.auth.signUp({ email, password });
    assert.equal(result.data.session, null);
  });
  await check("profile save and persistence across logout/login", async () => {
    const profile = {
      personal: {
        full_name: "Synthetic QA User",
        email,
        summary: "Backend validation profile",
      },
      sections: {
        education: [
          { id: "edu", institution: "Test University", grade: "8.5" },
        ],
        skills: [{ id: "skill", name: "TypeScript" }],
      },
    };
    const saved = await a.rpc("save_profile", {
      p_data: profile,
      p_revision: 1,
    });
    assert.ifError(saved.error);
    await a.auth.signOut();
    const login = await a.auth.signInWithPassword({ email, password });
    assert.ifError(login.error);
    const read = await a.from("profiles").select("*").single();
    assert.ifError(read.error);
    assert.equal(read.data.data.sections.education[0].grade, "8.5");
  });
  await check("optimistic profile saves reject stale writes", async () => {
    const r = await a.rpc("save_profile", {
      p_data: { personal: {}, sections: {} },
      p_revision: 1,
    });
    assert.match(r.error.message, /CONFLICT/);
  });
  await check(
    "direct profile edits cannot bypass conflict detection",
    async () => {
      const result = await a
        .from("profiles")
        .update({ data: { personal: { full_name: "Bypass" }, sections: {} } })
        .eq("user_id", ua.id);
      assert.ok(result.error);
    },
  );
  await check("documents persist independent profile snapshots", async () => {
    const p = await a.from("profiles").select("*").single();
    const result = await a
      .from("documents")
      .insert({
        user_id: ua.id,
        title: "QA Resume",
        document_type: "Resume",
        purpose: "Internship",
        template_id: "modern",
        profile_snapshot: p.data.data,
        document_overrides: {},
        included_sections: ["summary", "education", "skills"],
        design_settings: {
          color: "#294c41",
          accent: "#d7e5dc",
          font: "Arial",
          fontSize: 11,
          headingSize: 12,
          lineHeight: 1.5,
          margin: 44,
          spacing: 18,
          layout: "one-column",
          paper: "a4",
          photo: false,
          photoShape: "circle",
          photoPosition: "50% 50%",
          textColor: "#303936",
          dividers: true,
          alignment: "left",
          background: "#ffffff",
        },
      })
      .select()
      .single();
    assert.ifError(result.error);
    doc = result.data;
  });
  await check(
    "partial update preserves content and design; version creation is atomic",
    async () => {
      const edited = {
        ...doc,
        document_overrides: { "education/edu/grade": "9.1" },
      };
      const result = await a.rpc("save_document", {
        p_id: doc.id,
        p_revision: doc.revision,
        p_data: edited,
        p_summary: "Grade update",
      });
      assert.ifError(result.error);
      assert.deepEqual(result.data.design_settings, doc.design_settings);
      assert.equal(
        result.data.profile_snapshot.sections.education[0].grade,
        "8.5",
      );
      const versions = await a
        .from("document_versions")
        .select("*")
        .eq("document_id", doc.id);
      assert.ifError(versions.error);
      assert.equal(versions.data.length, 1);
      assert.equal(
        versions.data[0].saved_document_data.document_overrides[
          "education/edu/grade"
        ],
        undefined,
      );
      doc = result.data;
    },
  );
  await check(
    "stale document update is rejected and does not create a version",
    async () => {
      const result = await a.rpc("save_document", {
        p_id: doc.id,
        p_revision: 1,
        p_data: doc,
      });
      assert.match(result.error.message, /CONFLICT/);
      const versions = await a
        .from("document_versions")
        .select("*")
        .eq("document_id", doc.id);
      assert.equal(versions.data.length, 1);
    },
  );
  await check("direct document update cannot bypass versioning", async () => {
    const result = await a
      .from("documents")
      .update({ title: "Bypass" })
      .eq("id", doc.id);
    assert.ok(result.error);
  });
  await check("restore previous version retains a new revision", async () => {
    const { data } = await a
      .from("document_versions")
      .select("*")
      .eq("document_id", doc.id)
      .single();
    const restored = await a.rpc("save_document", {
      p_id: doc.id,
      p_revision: doc.revision,
      p_data: data.saved_document_data,
      p_summary: "Restore",
    });
    assert.ifError(restored.error);
    assert.equal(restored.data.revision, 3);
    assert.deepEqual(restored.data.document_overrides, {});
    doc = restored.data;
  });
  await check(
    "user B and anonymous clients cannot read user A data",
    async () => {
      for (const c of [b, anon])
        for (const table of ["profiles", "documents", "document_versions"]) {
          const result = await c.from(table).select("*").eq("user_id", ua.id);
          assert.ok(result.error || result.data.length === 0);
        }
    },
  );
  await check(
    "forged owner and cross-user save are rejected outside UI",
    async () => {
      const forged = await b
        .from("documents")
        .insert({ ...doc, id: crypto.randomUUID() });
      assert.ok(forged.error);
      const save = await b.rpc("save_document", {
        p_id: doc.id,
        p_revision: doc.revision,
        p_data: doc,
      });
      assert.match(save.error.message, /access denied/);
      const profile = await b
        .from("profiles")
        .insert({ user_id: ua.id, data: { personal: {}, sections: {} } });
      assert.ok(profile.error);
    },
  );
  await check(
    "private storage enforces owner paths and MIME types",
    async () => {
      const image = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6V3cAAAAASUVORK5CYII=",
        "base64",
      );
      const path = ua.id + "/qa.png";
      assert.ifError(
        (
          await a.storage
            .from("profile-assets")
            .upload(path, image, { contentType: "image/png" })
        ).error,
      );
      assert.ok(
        (await b.storage.from("profile-assets").createSignedUrl(path, 60))
          .error,
      );
      assert.ok(
        (
          await b.storage
            .from("profile-assets")
            .upload(ua.id + "/forged.png", image, { contentType: "image/png" })
        ).error,
      );
      assert.ok(
        (
          await a.storage
            .from("profile-assets")
            .upload(ua.id + "/bad.txt", Buffer.from("bad"), {
              contentType: "text/plain",
            })
        ).error,
      );
      const signed = await a.storage
        .from("profile-assets")
        .createSignedUrl(path, 60);
      assert.ifError(signed.error);
      assert.equal((await fetch(signed.data.signedUrl)).status, 200);
      assert.ifError(
        (await a.storage.from("profile-assets").remove([path])).error,
      );
    },
  );
  await check(
    "password recovery email, reset, old-password rejection and new-password login",
    async () => {
      assert.ifError(
        (
          await a.auth.resetPasswordForEmail(email, {
            redirectTo: "http://localhost:3000/reset-password",
          })
        ).error,
      );
      const token = await emailToken(email, "recovery");
      assert.ifError(
        (await a.auth.verifyOtp({ token_hash: token, type: "recovery" })).error,
      );
      const next = password + "new";
      assert.ifError((await a.auth.updateUser({ password: next })).error);
      await a.auth.signOut();
      assert.ok((await a.auth.signInWithPassword({ email, password })).error);
      assert.ifError(
        (await a.auth.signInWithPassword({ email, password: next })).error,
      );
    },
  );
  await check("invalid recovery token is rejected", async () =>
    assert.ok(
      (await anon.auth.verifyOtp({ token_hash: "invalid", type: "recovery" }))
        .error,
    ),
  );
  await check("duplicate documents can be edited independently", async () => {
    const { id, created_at, updated_at, ...copy } = doc;
    const inserted = await a
      .from("documents")
      .insert({ ...copy, title: "Independent copy" })
      .select()
      .single();
    assert.ifError(inserted.error);
    const edited = await a.rpc("save_document", {
      p_id: inserted.data.id,
      p_revision: inserted.data.revision,
      p_data: { ...inserted.data, title: "Changed copy" },
    });
    assert.ifError(edited.error);
    const original = await a
      .from("documents")
      .select("*")
      .eq("id", doc.id)
      .single();
    assert.equal(original.data.title, "QA Resume");
  });
  await check("deleting a document preserves master profile", async () => {
    assert.ifError((await a.from("documents").delete().eq("id", doc.id)).error);
    const profile = await a.from("profiles").select("*").single();
    assert.ifError(profile.error);
    assert.equal(profile.data.data.personal.full_name, "Synthetic QA User");
  });
  await check("account deletion cascades active records", async () => {
    assert.ifError((await a.rpc("delete_my_account")).error);
    const remaining = await admin
      .from("documents")
      .select("*")
      .eq("user_id", ua.id);
    assert.equal(remaining.data.length, 0);
    const profile = await admin
      .from("profiles")
      .select("*")
      .eq("user_id", ua.id);
    assert.equal(profile.data.length, 0);
  });
  console.log(`Completed ${passed} backend integration checks.`);
} finally {
  for (const id of identities) await admin.auth.admin.deleteUser(id);
}
