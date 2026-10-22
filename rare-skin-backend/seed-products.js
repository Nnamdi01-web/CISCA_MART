const db = require('./config/db');

const products = [
  // --- CLEANSERS ---
  {
    name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    price: 9500,
    description: 'Non-foaming lotion cleanser with 3 essential ceramides and hyaluronic acid for normal to dry skin.',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Dryness & Barrier Support'
  },
  {
    name: 'Foaming Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    price: 9800,
    description: 'Refreshing gel cleanser that removes excess oil, dirt, and makeup without disrupting the protective skin barrier.',
    image_url: 'https://images.unsplash.com/photo-1608248597262-11c52d6a7d0d?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Oily & Combination Skin'
  },
  {
    name: 'Gentle Foaming Cleanser',
    brand: 'Rare Skin',
    category: 'Cleanser',
    price: 6500,
    description: 'Sulfate-free daily cleanser infused with green tea extract and aloe vera to calm irritated skin.',
    image_url: 'https://images.unsplash.com/photo-1556228722-d119f01b17d0?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Sensitivity & Redness'
  },

  // --- TONERS & ESSENCES ---
  {
    name: 'Glycolic Acid 7% Exfoliating Toner',
    brand: 'The Ordinary',
    category: 'Toner',
    price: 8500,
    description: 'An exfoliating toning solution that targets skin surface radiance and visibly improves clarity with continued use.',
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'night',
    target_concern: 'Dullness & Uneven Texture'
  },
  {
    name: 'Hydrating Rice & Oat Milk Toner',
    brand: 'Rare Skin',
    category: 'Toner',
    price: 7200,
    description: 'Milky, soothing toner designed to restore hydration levels and repair compromised moisture barriers.',
    image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Dehydration & Irritation'
  },

  // --- SERUMS & TREATMENTS ---
  {
    name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Serum',
    price: 7500,
    description: 'High-strength vitamin and mineral formula to visibly reduce blemishes, enlarged pores, and oil production.',
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Dark Spots & Congestion'
  },
  {
    name: 'Vitamin C 20% + Ferulic Acid Serum',
    brand: 'Rare Skin',
    category: 'Serum',
    price: 6000,
    description: 'Potent antioxidant serum formulated to brighten uneven skin tone, fade hyperpigmentation, and fight environmental damage.',
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'morning',
    target_concern: 'Hyperpigmentation & Glow'
  },
  {
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'Serum',
    price: 7000,
    description: 'Multi-depth hydration formula combining low, medium, and high molecular weight hyaluronic acid.',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Fine Lines & Dryness'
  },
  {
    name: 'Advanced 0.5% Retinol Night Serum',
    brand: 'Paula\'s Choice',
    category: 'Serum',
    price: 14500,
    description: 'Cell-communicating serum that accelerates cell turnover, reduces fine lines, and clears stubborn breakouts.',
    image_url: 'https://images.unsplash.com/photo-1608248597262-11c52d6a7d0d?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'night',
    target_concern: 'Anti-Aging & Texture'
  },

  // --- MOISTURIZERS ---
  {
    name: 'Moisturizing Cream with Pump',
    brand: 'CeraVe',
    category: 'Moisturizer',
    price: 12500,
    description: 'Rich, non-greasy cream with MVE delivery technology for 24-hour hydration and barrier restoration.',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Severe Dryness & Eczema Prone'
  },
  {
    name: 'PM Facial Moisturizing Lotion',
    brand: 'CeraVe',
    category: 'Moisturizer',
    price: 11000,
    description: 'Ultra-lightweight night cream with niacinamide, hyaluronic acid, and ceramides to soothe skin while sleeping.',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'night',
    target_concern: 'Overnight Barrier Support'
  },
  {
    name: 'Barrier Repair Water Cream',
    brand: 'Rare Skin',
    category: 'Moisturizer',
    price: 8000,
    description: 'Oil-free gel moisturizer that delivers burst hydration without clogging pores or triggering breakouts.',
    image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'both',
    target_concern: 'Oily & Acne-Prone Skin'
  },

  // --- SUNSCREENS ---
  {
    name: 'Invisible Sheer Sunscreen SPF 50',
    brand: 'Rare Skin',
    category: 'Sunscreen',
    price: 6500,
    description: 'Broad-spectrum UVA/UVB protection with zero white cast, specially formulated for darker skin tones.',
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'morning',
    target_concern: 'Sun Protection & Dark Spot Prevention'
  },
  {
    name: 'AM Facial Moisturizing Lotion SPF 30',
    brand: 'CeraVe',
    category: 'Sunscreen',
    price: 11500,
    description: 'Morning skincare moisturizer with broad-spectrum SPF 30 protection and essential ceramides.',
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=80',
    time_of_day: 'morning',
    target_concern: 'Daily UV Protection'
  }
];

async function seedProducts() {
  try {
    console.log('--- SEEDING PRODUCT CATALOG ---');
    
    // Clear existing products if needed (or comment out to append)
    // await db.query('TRUNCATE TABLE products CASCADE;');

    for (const prod of products) {
      await db.query(
        `INSERT INTO products (name, brand, category, price, description, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING;`,
        [prod.name, prod.brand, prod.category, prod.price, prod.description, prod.image_url]
      );
    }

    console.log(`✅ Successfully seeded ${products.length} products into the database!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedProducts();