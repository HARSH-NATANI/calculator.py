import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const config = JSON.parse(
  fs.readFileSync(process.env.CLOUDCV_LOCAL_CONFIG, "utf8"),
);
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(config.API_URL))
  throw new Error("Local disposable backend only");
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const credentials = {
  email: `browser-${Date.now()}@example.test`,
  password: crypto.randomBytes(18).toString("base64url") + "1a",
};
const { data, error } = await admin.auth.admin.createUser({
  ...credentials,
  email_confirm: true,
  user_metadata: { full_name: "Avery Brooks" },
});
if (error) throw error;
fs.writeFileSync(
  "/tmp/cloudcv-ui-test.json",
  JSON.stringify({ ...credentials, id: data.user.id }),
  { mode: 0o600 },
);
console.log("Disposable browser account prepared.");
