import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { resolve } from 'path';
import * as fs from 'fs';

const serviceAccount = require(resolve(process.cwd(), 'serviceAccountKey.json'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://amols-cafe-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = getDatabase();

async function upload() {
  console.log("Uploading hero image to Firebase...");
  const base64 = fs.readFileSync('heroBase64.txt', 'utf8');
  await db.ref("settings/heroImage").set(base64);
  console.log("Successfully uploaded to settings/heroImage!");
  process.exit(0);
}

upload();
