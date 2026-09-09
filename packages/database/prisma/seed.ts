/**
 * One-time seed: mirrors apps/storefront/src/lib/shop-data.ts into the real
 * database (Phase 2 of docs/DEVELOPMENT_ROADMAP.md), so there's real data to
 * develop Phase 3's API against instead of an empty database.
 *
 * Image URLs are placeholders (the storefront's asset filenames) — shop-data.ts
 * imports them as Vite-bundled modules, which can't be resolved outside a Vite
 * build, and there is no real image hosting yet (that's Phase 4). Replace
 * these with real hosted URLs once object storage is wired up.
 *
 * Run with: bun run --cwd=packages/database db:seed
 */
import { prisma } from "../src/client";

// Every mock product shares this table (see apps/storefront/src/lib/shop-data.ts).
const nutritionFacts = [
  { label: "Energy", value: "361 kcal" },
  { label: "Protein", value: "11.6 g" },
  { label: "Dietary Fibre", value: "8.5 g" },
  { label: "Carbohydrates", value: "67.5 g" },
  { label: "Total Fat", value: "4.2 g" },
];

const categories = [
  {
    slug: "millet-grains",
    name: "Millet Grains",
    description: "Whole ancient grains, cleaned and sun-dried the traditional way.",
    image: "/assets/cat-grains.jpg",
  },
  {
    slug: "millet-flours",
    name: "Millet Flours",
    description: "Stone-ground flours milled slowly to keep nutrition intact.",
    image: "/assets/cat-flours.jpg",
  },
  {
    slug: "millet-ready-mix",
    name: "Millet Ready Mix",
    description: "Everyday health mixes for a nourishing start to the morning.",
    image: "/assets/cat-readymix.jpg",
  },
  {
    slug: "nuts-seeds",
    name: "Nuts & Seeds",
    description: "Hand-picked nuts and seeds, roasted in small batches.",
    image: "/assets/cat-nuts.jpg",
  },
  {
    slug: "combo-packs",
    name: "Combo Packs",
    description: "Thoughtfully curated pantry sets for the whole family.",
    image: "/assets/cat-combo.jpg",
  },
];

const products = [
  {
    slug: "kambu-broken",
    name: "Kambu Broken",
    categorySlug: "millet-grains",
    price: 95,
    mrp: 120,
    weights: ["500 g", "1 kg"],
    image: "/assets/p-kambu.jpg",
    bestseller: true,
    inStock: true,
    description:
      "Broken pearl millet, gently processed to cook quickly while keeping its rustic texture. Perfect for kanji, upma and everyday porridge.",
    ingredients: "100% pearl millet (Kambu). Nothing else.",
  },
  {
    slug: "foxtail-millet",
    name: "Foxtail Millet (Thinai)",
    categorySlug: "millet-grains",
    price: 110,
    mrp: 140,
    weights: ["500 g", "1 kg"],
    image: "/assets/p-thinai.jpg",
    bestseller: true,
    inStock: true,
    description:
      "A light, golden grain with a delicate bite. A gentle everyday swap for rice in pongal, pulao and lemon rice.",
    ingredients: "100% foxtail millet (Thinai).",
  },
  {
    slug: "raagi-whole",
    name: "Raagi Whole",
    categorySlug: "millet-grains",
    price: 85,
    mrp: 100,
    weights: ["500 g", "1 kg"],
    image: "/assets/p-raagi.jpg",
    bestseller: false,
    inStock: true,
    description:
      "Whole finger millet, naturally rich in calcium and fibre. Sprout it, malt it, or grind it fresh at home.",
    ingredients: "100% finger millet (Raagi).",
  },
  {
    slug: "jowar-flour",
    name: "Jowar Flour",
    categorySlug: "millet-flours",
    price: 120,
    mrp: 150,
    weights: ["500 g", "1 kg"],
    image: "/assets/p-jowar.jpg",
    bestseller: false,
    inStock: true,
    description:
      "Stone-ground sorghum flour with a soft, sweet aroma. Rolls out into pliable rotis and light dosas.",
    ingredients: "100% sorghum (Jowar), stone-ground.",
  },
  {
    slug: "roasted-pistachios",
    name: "Roasted Pistachios",
    categorySlug: "nuts-seeds",
    price: 480,
    mrp: 560,
    weights: ["250 g", "500 g"],
    image: "/assets/p-pista.jpg",
    bestseller: true,
    inStock: true,
    description:
      "Plump pistachios roasted in small batches with a whisper of sea salt. Crisp shells, deeply green kernels.",
    ingredients: "Pistachios, sea salt.",
  },
  {
    slug: "millet-healthy-mix",
    name: "Millet Healthy Mix",
    categorySlug: "millet-ready-mix",
    price: 260,
    mrp: 320,
    weights: ["500 g", "1 kg"],
    image: "/assets/p-mix.jpg",
    bestseller: false,
    inStock: false,
    description:
      "Eighteen roasted grains, pulses and nuts ground into one wholesome morning drink. Just add hot milk or water.",
    ingredients: "Millets, pulses, nuts, cardamom. No preservatives, no added colour.",
  },
  {
    slug: "raagi-flour",
    name: "Raagi Flour",
    categorySlug: "millet-flours",
    price: 105,
    mrp: 130,
    weights: ["500 g", "1 kg"],
    image: "/assets/cat-flours.jpg",
    bestseller: false,
    inStock: true,
    description: "Freshly milled finger millet flour for koozh, rotis and baby porridge.",
    ingredients: "100% finger millet, stone-ground.",
  },
  {
    slug: "family-pantry-combo",
    name: "Family Pantry Combo",
    categorySlug: "combo-packs",
    price: 899,
    mrp: 1120,
    weights: ["3 kg"],
    image: "/assets/cat-combo.jpg",
    bestseller: true,
    inStock: true,
    description:
      "Four everyday millets and one flour, packed together for a month of wholesome cooking.",
    ingredients: "Kambu, Thinai, Raagi, Samai, Jowar flour.",
  },
  {
    slug: "mixed-seeds",
    name: "Roasted Mixed Seeds",
    categorySlug: "nuts-seeds",
    price: 240,
    mrp: 300,
    weights: ["250 g", "500 g"],
    image: "/assets/cat-nuts.jpg",
    bestseller: false,
    inStock: true,
    description: "Pumpkin, sunflower, flax and melon seeds, lightly roasted for daily snacking.",
    ingredients: "Pumpkin seeds, sunflower seeds, flax seeds, melon seeds.",
  },
  {
    slug: "sprouted-ragi-mix",
    name: "Sprouted Raagi Mix",
    categorySlug: "millet-ready-mix",
    price: 210,
    mrp: 250,
    weights: ["500 g"],
    image: "/assets/cat-readymix.jpg",
    bestseller: false,
    inStock: true,
    description: "Sprouted and roasted finger millet, ground fine for an easy digestible drink.",
    ingredients: "Sprouted finger millet, cardamom.",
  },
];

async function main() {
  console.log(`Seeding ${categories.length} categories...`);
  const categoryIdBySlug = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
    categoryIdBySlug.set(c.slug, row.id);
  }

  console.log(`Seeding ${products.length} products...`);
  for (const p of products) {
    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${p.categorySlug}`);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        ingredients: p.ingredients,
        nutritionFacts,
        categoryId,
        status: "ACTIVE",
        bestseller: p.bestseller,
        images: { create: [{ url: p.image, alt: p.name, position: 0 }] },
      },
      update: {
        name: p.name,
        description: p.description,
        ingredients: p.ingredients,
        nutritionFacts,
        categoryId,
        bestseller: p.bestseller,
      },
    });

    for (const weight of p.weights) {
      const sku = `${p.slug}-${weight.replace(/\s+/g, "").toLowerCase()}`;
      const variant = await prisma.productVariant.upsert({
        where: { sku },
        create: {
          productId: product.id,
          sku,
          weight,
          price: p.price,
          mrp: p.mrp,
          stock: p.inStock ? 100 : 0,
        },
        update: {
          price: p.price,
          mrp: p.mrp,
        },
      });

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        create: { variantId: variant.id, quantity: p.inStock ? 100 : 0 },
        update: {},
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
