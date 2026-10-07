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

const menuItems = [
  // PIZZA
  { name: "Veg Pizza", price: 100, category: "Pizza", description: "Fresh vegetable pizza", available: true, popular: true, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop" },
  { name: "Cheese Pizza", price: 120, category: "Pizza", description: "Classic cheese pizza", available: true, popular: false, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop" },
  { name: "Sweet Corn Pizza", price: 120, category: "Pizza", description: "Sweet corn and cheese", available: true, popular: false, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop" },
  { name: "Paneer Pizza", price: 130, category: "Pizza", description: "Delicious paneer toppings", available: true, popular: true, image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=600&auto=format&fit=crop" },
  
  // SANDWICH
  { name: "Veg Sandwich", price: 40, category: "Sandwich", description: "Fresh vegetables", available: true, popular: false, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop" },
  { name: "Veg Cheese Sandwich", price: 55, category: "Sandwich", description: "Veggie and cheese", available: true, popular: true, image: "https://images.unsplash.com/photo-1550508139-83a9033660c2?q=80&w=600&auto=format&fit=crop" },
  { name: "Veg Grill Sandwich", price: 60, category: "Sandwich", description: "Grilled perfection", available: true, popular: false, image: "https://images.unsplash.com/photo-1481070555726-e2fe8357725c?q=80&w=600&auto=format&fit=crop" },
  { name: "Paneer Grill Sandwich", price: 65, category: "Sandwich", description: "Grilled paneer special", available: true, popular: true, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop" },
  { name: "Cheese Garlic Toast", price: 60, category: "Sandwich", description: "Garlic and melted cheese", available: true, popular: false, image: "https://images.unsplash.com/photo-1587208365261-26c9df0eb826?q=80&w=600&auto=format&fit=crop" },

  // BURGERS
  { name: "Veg Burger", price: 60, category: "Burgers", description: "Classic veg patty", available: true, popular: true, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" },
  { name: "Veg Cheese Burger", price: 70, category: "Burgers", description: "Veg patty with cheese", available: true, popular: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop" },
  { name: "Aloo Tikki Burger", price: 75, category: "Burgers", description: "Spicy aloo tikki", available: true, popular: false, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=600&auto=format&fit=crop" },

  // MAGGIE NOODLES
  { name: "Maggie", price: 40, category: "Maggie Noodles", description: "Classic 2-minute noodles", available: true, popular: true, image: "https://images.unsplash.com/photo-1612929633738-8fe01f7c8166?q=80&w=600&auto=format&fit=crop" },
  { name: "Cheese Maggie", price: 55, category: "Maggie Noodles", description: "Cheesy goodness", available: true, popular: true, image: "https://images.unsplash.com/photo-1612929633738-8fe01f7c8166?q=80&w=600&auto=format&fit=crop" },
  { name: "Peri Peri Cheese Maggie", price: 60, category: "Maggie Noodles", description: "Spicy and cheesy", available: true, popular: false, image: "https://images.unsplash.com/photo-1612929633738-8fe01f7c8166?q=80&w=600&auto=format&fit=crop" },
  { name: "Paneer Cheese Maggie", price: 65, category: "Maggie Noodles", description: "Paneer and cheese mix", available: true, popular: false, image: "https://images.unsplash.com/photo-1612929633738-8fe01f7c8166?q=80&w=600&auto=format&fit=crop" },

  // DRINK MENU
  { name: "Hot Coffee", price: 20, category: "Drink Menu", description: "Freshly brewed", available: true, popular: false, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop" },
  { name: "Cold Coffee", price: 40, category: "Drink Menu", description: "Refreshing cold coffee", available: true, popular: true, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=600&auto=format&fit=crop" },
  { name: "Milk Shake", price: 50, category: "Drink Menu", description: "Classic milkshake", available: true, popular: false, image: "https://images.unsplash.com/photo-1572490122747-3968b75bb827?q=80&w=600&auto=format&fit=crop" },
  { name: "Chocolate Shake", price: 60, category: "Drink Menu", description: "Rich chocolate", available: true, popular: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75bb827?q=80&w=600&auto=format&fit=crop" },
  { name: "Oreo Shake", price: 60, category: "Drink Menu", description: "Crushed Oreos", available: true, popular: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75bb827?q=80&w=600&auto=format&fit=crop" },
  { name: "Strawberry Shake", price: 60, category: "Drink Menu", description: "Sweet strawberry", available: true, popular: false, image: "https://images.unsplash.com/photo-1572490122747-3968b75bb827?q=80&w=600&auto=format&fit=crop" },

  // MOMOS
  { name: "Veg Momos", price: 50, category: "Momos", description: "Steamed veg momos", available: true, popular: true, image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?q=80&w=600&auto=format&fit=crop" },
  { name: "Paneer Momos", price: 60, category: "Momos", description: "Paneer stuffed momos", available: true, popular: true, image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?q=80&w=600&auto=format&fit=crop" },

  // SNACKS
  { name: "French Fries", price: 60, category: "Snacks", description: "Classic salted fries", available: true, popular: true, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=600&auto=format&fit=crop" },
  { 
    name: "Peri Peri French Fries", 
    price: 70, 
    category: "Snacks", 
    description: "Spicy peri peri fries", 
    available: true, 
    popular: true,
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=600&auto=format&fit=crop",
    variants: [
      { name: "₹70", price: 70 },
      { name: "₹90", price: 90 }
    ]
  },
  { name: "Cheese Corn (6 pcs)", price: 75, category: "Snacks", description: "Cheese stuffed corn balls", available: true, popular: false, image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=600&auto=format&fit=crop" },

  // MOCKTAILS
  { name: "Green Mint Mojito", price: 50, category: "Mocktails", description: "Refreshing mint", available: true, popular: true, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=600&auto=format&fit=crop" },
  { name: "Blue Curacao", price: 60, category: "Mocktails", description: "Sweet and tangy", available: true, popular: false, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=600&auto=format&fit=crop" },
];

async function seedDatabase() {
  console.log("Connecting to Realtime Database with Admin SDK...");
  const menuRef = db.ref("menu_items");

  console.log("Clearing existing menu items...");
  await menuRef.remove();

  console.log("Seeding new menu items...");
  const updates: Record<string, any> = {};
  
  menuItems.forEach((item, index) => {
    // Generate a simple key or use push()
    const id = `item_${index}`;
    updates[id] = {
      ...item,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    console.log(`Prepared: ${item.name}`);
  });

  await menuRef.set(updates);

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seedDatabase().catch(console.error);
