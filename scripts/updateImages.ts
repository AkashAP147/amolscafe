import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync(resolve(process.cwd(), 'serviceAccountKey.json'), 'utf8'));

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
    let imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"; // Default food
    
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();

    if (cat.includes("pizza") || name.includes("pizza")) {
      imageUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("burger") || name.includes("burger")) {
      imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("sandwich") || name.includes("sandwich")) {
      imageUrl = "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("maggie") || name.includes("maggie") || name.includes("noodle")) {
      imageUrl = "https://images.unsplash.com/photo-1612929633738-8fe01f7c8166?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("coffee") || name.includes("coffee")) {
      imageUrl = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("shake") || name.includes("shake")) {
      imageUrl = "https://images.unsplash.com/photo-1572490122747-3968b75bb827?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("momo") || name.includes("momo")) {
      imageUrl = "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("fries") || name.includes("fries") || cat.includes("snack")) {
      imageUrl = "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=600&auto=format&fit=crop";
    } else if (cat.includes("mocktail") || name.includes("mojito") || name.includes("drink")) {
      imageUrl = "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=600&auto=format&fit=crop";
    }

    updates[`${key}/image`] = imageUrl;
    console.log(`Updated ${item.name} -> Unsplash Image`);
  }

  if (Object.keys(updates).length > 0) {
    await menuRef.update(updates);
    console.log("✅ Successfully fixed all broken images in the database!");
  }

  process.exit(0);
}

updateImages().catch(console.error);
