import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { resolve } from 'path';

const serviceAccount = require(resolve(process.cwd(), 'serviceAccountKey.json'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://amols-cafe-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = getDatabase();

async function checkRules() {
  const rules = await db.getRules();
  console.log("Current Database Rules:\n", rules);
  process.exit(0);
}

checkRules().catch(err => {
  console.error("Error getting rules:", err);
  process.exit(1);
});
