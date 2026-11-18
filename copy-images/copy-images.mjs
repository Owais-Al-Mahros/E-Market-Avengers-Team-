// نسخ صور bucket "upload-image" من المشروع القديم (Mumbai) إلى الجديد (Frankfurt)
// التشغيل:  node copy-images.mjs
// يحتاج Node 18 أو أحدث + الحزمة @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";

const OLD_URL = "https://lapuzdofxtotnmltjdkh.supabase.co";
const NEW_URL = "https://mxneblvnfkldjcraiyat.supabase.co";
const OLD_KEY = process.env.OLD_KEY; // Secret key (service_role) للمشروع القديم
const NEW_KEY = process.env.NEW_KEY; // Secret key (service_role) للمشروع الجديد
const BUCKET = "upload-image";

if (!OLD_KEY || !NEW_KEY) {
  console.error("ضع OLD_KEY و NEW_KEY كمتغيرات بيئة أولاً.");
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const oldSb = createClient(OLD_URL, OLD_KEY, opts);
const newSb = createClient(NEW_URL, NEW_KEY, opts);

// يعدّ كل الملفات داخل الـ bucket بما فيها المجلدات الفرعية
async function listAll(prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const { data, error } = await oldSb.storage
      .from(BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listAll(path))); // مجلد
      else files.push({ path, type: item.metadata?.mimetype });
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

// نفس الدالة لكن على المشروع الجديد: لمعرفة ما نُسخ سابقاً وتخطيه
async function listNew() {
  const names = new Set();
  let offset = 0;
  for (;;) {
    const { data, error } = await newSb.storage
      .from(BUCKET)
      .list("", { limit: 100, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    data.forEach((d) => names.add(d.name));
    if (data.length < 100) break;
    offset += 100;
  }
  return names;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function copyOne(f) {
  const { data: blob, error: dErr } = await oldSb.storage
    .from(BUCKET)
    .download(f.path);
  if (dErr) throw dErr;
  const { error: uErr } = await newSb.storage
    .from(BUCKET)
    .upload(f.path, blob, {
      upsert: true,
      contentType: f.type || blob.type || "application/octet-stream",
      cacheControl: "31536000",
    });
  if (uErr) throw uErr;
}

const files = await listAll();
const already = await listNew();
console.log(`عدد الملفات في القديم: ${files.length}`);
console.log(`موجود مسبقاً في الجديد (سيتم تخطيه): ${already.size}`);

let ok = 0;
let skipped = 0;
const failed = [];
for (const [i, f] of files.entries()) {
  if (already.has(f.path)) {
    skipped++;
    continue;
  }
  let done = false;
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      await copyOne(f);
      done = true;
      ok++;
    } catch (e) {
      if (attempt === 3) {
        failed.push(f.path);
        console.error("فشل:", f.path, e.message ?? e);
      } else {
        await sleep(3000 * attempt); // انتظار ثم إعادة المحاولة
      }
    }
  }
  if ((i + 1) % 20 === 0) console.log(`${i + 1}/${files.length}`);
}
console.log(`تخطي (موجود مسبقاً): ${skipped}`);

console.log(`\nنُسخ الآن: ${ok} | الإجمالي في الجديد: ${ok + skipped} من ${files.length}`);
if (failed.length) {
  console.log("الملفات الفاشلة:\n" + failed.join("\n"));
  process.exit(2);
}
