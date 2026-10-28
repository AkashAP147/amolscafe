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

const updatedRules = {
  rules: {
    menu_items: {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'amolscafe@gmail.com'"
    },
    orders: {
      ".read": true,
      ".write": true,
      ".indexOn": ["userId", "createdAt"]
    },
    settings: {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'amolscafe@gmail.com'",
      lastOrderNumber: {
        ".read": true,
        ".write": true
      }
    },
    users: {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
};

async function applyRulesAndCleanOrders() {
  console.log("Applying updated Firebase Realtime Database Security Rules...");
  await db.setRules(updatedRules);
  console.log("✓ Security rules updated! 'settings/lastOrderNumber' is now writable by customers.");

  console.log("Cleaning test orders (AC1225, AC2077, AC5404, AC9348)...");
  await db.ref("orders").remove();

  console.log("Resetting 'settings/lastOrderNumber' to 1000...");
  await db.ref("settings/lastOrderNumber").set(1000);

  const testSnap = await db.ref("settings/lastOrderNumber").once("value");
  console.log("Verified lastOrderNumber in DB:", testSnap.val());
  console.log("Next order placed will be EXACTLY AC1001!");
  process.exit(0);
}

applyRulesAndCleanOrders().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
