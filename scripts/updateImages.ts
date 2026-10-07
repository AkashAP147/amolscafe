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

async function updateImages() {
  console.log("Connecting to Realtime Database to update images...");
  const menuRef = db.ref("menu_items");
  
  const snapshot = await menuRef.once("value");
  const items = snapshot.val();
  
  if (!items) {
    console.log("No items found in DB!");
    process.exit(1);
  }

  const updates: Record<string, any> = {};
  
  for (const [key, item] of Object.entries<any>(items)) {
    // Generate a sleek, dark-themed premium placeholder with the exact item name
    const encodedName = encodeURIComponent(item.name);
    // Dark grey background (2a2a2a), Amol's Cafe Orange text (F58A1F)
    const specificImage = `https://placehold.co/600x400/2a2a2a/F58A1F/png?text=${encodedName}`;
    
    updates[`${key}/image`] = specificImage;
    console.log(`Updated ${item.name} -> Placeholder Image`);
  }

  if (Object.keys(updates).length > 0) {
    await menuRef.update(updates);
    console.log("✅ Successfully fixed all broken images in the database!");
  }

  process.exit(0);
}

updateImages().catch(console.error);
