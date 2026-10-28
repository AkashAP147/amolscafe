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

async function check() {
  const settingsSnap = await db.ref("settings").once("value");
  console.log("Settings in DB:", settingsSnap.val());

  const ordersSnap = await db.ref("orders").once("value");
  const orders = ordersSnap.val() || {};
  console.log("Existing order IDs in DB:", Object.keys(orders));
  process.exit(0);
}

check();
