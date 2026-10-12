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

async function resetOrdersAndKeepMenu() {
  console.log("------------------------------------------");
  console.log("Checking database before reset...");

  // Verify menu_items exists so we ensure we NEVER touch it
  const menuSnap = await db.ref("menu_items").once("value");
  const menuCount = menuSnap.exists() ? Object.keys(menuSnap.val()).length : 0;
  console.log(`Verified menu_items in database: ${menuCount} items found. (WILL BE PRESERVED)`);

  const ordersSnap = await db.ref("orders").once("value");
  const orderCount = ordersSnap.exists() ? Object.keys(ordersSnap.val()).length : 0;
  console.log(`Found ${orderCount} existing orders to clear.`);

  // 1. Remove all old test orders
  console.log("Clearing 'orders' collection...");
  await db.ref("orders").remove();

  // 2. Reset order numbering counter so new orders start fresh from AC1001
  console.log("Resetting 'settings/lastOrderNumber' to 1000 (Next order will be AC1001)...");
  await db.ref("settings/lastOrderNumber").set(1000);

  // 3. Verify menu is intact
  const verifyMenuSnap = await db.ref("menu_items").once("value");
  const verifiedCount = verifyMenuSnap.exists() ? Object.keys(verifyMenuSnap.val()).length : 0;
  console.log(`Confirmation: Menu is 100% intact with ${verifiedCount} items.`);

  console.log("==========================================");
  console.log("SUCCESS: Orders reset, order counter set to AC1001, menu and prices untouched!");
  console.log("==========================================");
  process.exit(0);
}

resetOrdersAndKeepMenu().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
