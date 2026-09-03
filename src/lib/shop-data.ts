import catGrains from "@/assets/cat-grains.jpg";
import catFlours from "@/assets/cat-flours.jpg";
import catReadyMix from "@/assets/cat-readymix.jpg";
import catNuts from "@/assets/cat-nuts.jpg";
import catCombo from "@/assets/cat-combo.jpg";
import pKambu from "@/assets/p-kambu.jpg";
import pThinai from "@/assets/p-thinai.jpg";
import pRaagi from "@/assets/p-raagi.jpg";
import pJowar from "@/assets/p-jowar.jpg";
import pPista from "@/assets/p-pista.jpg";
import pMix from "@/assets/p-mix.jpg";

export type Category = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

export const categories: Category[] = [
  {
    slug: "millet-grains",
    name: "Millet Grains",
    description: "Whole ancient grains, cleaned and sun-dried the traditional way.",
    image: catGrains,
  },
  {
    slug: "millet-flours",
    name: "Millet Flours",
    description: "Stone-ground flours milled slowly to keep nutrition intact.",
    image: catFlours,
  },
  {
    slug: "millet-ready-mix",
    name: "Millet Ready Mix",
    description: "Everyday health mixes for a nourishing start to the morning.",
    image: catReadyMix,
  },
  {
    slug: "nuts-seeds",
    name: "Nuts & Seeds",
    description: "Hand-picked nuts and seeds, roasted in small batches.",
    image: catNuts,
  },
  {
    slug: "combo-packs",
    name: "Combo Packs",
    description: "Thoughtfully curated pantry sets for the whole family.",
    image: catCombo,
  },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  mrp: number;
  weight: string;
  weights: string[];
  image: string;
  bestseller?: boolean;
  inStock: boolean;
  rating: number;
  reviews: number;
  description: string;
  ingredients: string;
  nutrition: { label: string; value: string }[];
};

const nutrition = [
  { label: "Energy", value: "361 kcal" },
  { label: "Protein", value: "11.6 g" },
  { label: "Dietary Fibre", value: "8.5 g" },
  { label: "Carbohydrates", value: "67.5 g" },
  { label: "Total Fat", value: "4.2 g" },
];

export const products: Product[] = [
  {
    id: "kambu-broken",
    name: "Kambu Broken",
    category: "Millet Grains",
    categorySlug: "millet-grains",
    price: 95,
    mrp: 120,
    weight: "500 g",
    weights: ["500 g", "1 kg"],
    image: pKambu,
    bestseller: true,
    inStock: true,
    rating: 4.8,
    reviews: 126,
    description:
      "Broken pearl millet, gently processed to cook quickly while keeping its rustic texture. Perfect for kanji, upma and everyday porridge.",
    ingredients: "100% pearl millet (Kambu). Nothing else.",
    nutrition,
  },
  {
    id: "foxtail-millet",
    name: "Foxtail Millet (Thinai)",
    category: "Millet Grains",
    categorySlug: "millet-grains",
    price: 110,
    mrp: 140,
    weight: "500 g",
    weights: ["500 g", "1 kg"],
    image: pThinai,
    bestseller: true,
    inStock: true,
    rating: 4.7,
    reviews: 98,
    description:
      "A light, golden grain with a delicate bite. A gentle everyday swap for rice in pongal, pulao and lemon rice.",
    ingredients: "100% foxtail millet (Thinai).",
    nutrition,
  },
  {
    id: "raagi-whole",
    name: "Raagi Whole",
    category: "Millet Grains",
    categorySlug: "millet-grains",
    price: 85,
    mrp: 100,
    weight: "500 g",
    weights: ["500 g", "1 kg"],
    image: pRaagi,
    inStock: true,
    rating: 4.9,
    reviews: 211,
    description:
      "Whole finger millet, naturally rich in calcium and fibre. Sprout it, malt it, or grind it fresh at home.",
    ingredients: "100% finger millet (Raagi).",
    nutrition,
  },
  {
    id: "jowar-flour",
    name: "Jowar Flour",
    category: "Millet Flours",
    categorySlug: "millet-flours",
    price: 120,
    mrp: 150,
    weight: "1 kg",
    weights: ["500 g", "1 kg"],
    image: pJowar,
    inStock: true,
    rating: 4.6,
    reviews: 74,
    description:
      "Stone-ground sorghum flour with a soft, sweet aroma. Rolls out into pliable rotis and light dosas.",
    ingredients: "100% sorghum (Jowar), stone-ground.",
    nutrition,
  },
  {
    id: "roasted-pistachios",
    name: "Roasted Pistachios",
    category: "Nuts & Seeds",
    categorySlug: "nuts-seeds",
    price: 480,
    mrp: 560,
    weight: "250 g",
    weights: ["250 g", "500 g"],
    image: pPista,
    bestseller: true,
    inStock: true,
    rating: 4.8,
    reviews: 143,
    description:
      "Plump pistachios roasted in small batches with a whisper of sea salt. Crisp shells, deeply green kernels.",
    ingredients: "Pistachios, sea salt.",
    nutrition,
  },
  {
    id: "millet-healthy-mix",
    name: "Millet Healthy Mix",
    category: "Millet Ready Mix",
    categorySlug: "millet-ready-mix",
    price: 260,
    mrp: 320,
    weight: "500 g",
    weights: ["500 g", "1 kg"],
    image: pMix,
    inStock: false,
    rating: 4.9,
    reviews: 302,
    description:
      "Eighteen roasted grains, pulses and nuts ground into one wholesome morning drink. Just add hot milk or water.",
    ingredients: "Millets, pulses, nuts, cardamom. No preservatives, no added colour.",
    nutrition,
  },
  {
    id: "raagi-flour",
    name: "Raagi Flour",
    category: "Millet Flours",
    categorySlug: "millet-flours",
    price: 105,
    mrp: 130,
    weight: "1 kg",
    weights: ["500 g", "1 kg"],
    image: catFlours,
    inStock: true,
    rating: 4.7,
    reviews: 65,
    description: "Freshly milled finger millet flour for koozh, rotis and baby porridge.",
    ingredients: "100% finger millet, stone-ground.",
    nutrition,
  },
  {
    id: "family-pantry-combo",
    name: "Family Pantry Combo",
    category: "Combo Packs",
    categorySlug: "combo-packs",
    price: 899,
    mrp: 1120,
    weight: "3 kg",
    weights: ["3 kg"],
    image: catCombo,
    bestseller: true,
    inStock: true,
    rating: 4.9,
    reviews: 88,
    description:
      "Four everyday millets and one flour, packed together for a month of wholesome cooking.",
    ingredients: "Kambu, Thinai, Raagi, Samai, Jowar flour.",
    nutrition,
  },
  {
    id: "mixed-seeds",
    name: "Roasted Mixed Seeds",
    category: "Nuts & Seeds",
    categorySlug: "nuts-seeds",
    price: 240,
    mrp: 300,
    weight: "250 g",
    weights: ["250 g", "500 g"],
    image: catNuts,
    inStock: true,
    rating: 4.5,
    reviews: 41,
    description: "Pumpkin, sunflower, flax and melon seeds, lightly roasted for daily snacking.",
    ingredients: "Pumpkin seeds, sunflower seeds, flax seeds, melon seeds.",
    nutrition,
  },
  {
    id: "sprouted-ragi-mix",
    name: "Sprouted Raagi Mix",
    category: "Millet Ready Mix",
    categorySlug: "millet-ready-mix",
    price: 210,
    mrp: 250,
    weight: "500 g",
    weights: ["500 g"],
    image: catReadyMix,
    inStock: true,
    rating: 4.8,
    reviews: 57,
    description: "Sprouted and roasted finger millet, ground fine for an easy digestible drink.",
    ingredients: "Sprouted finger millet, cardamom.",
    nutrition,
  },
];

export const bestsellerIds = [
  "kambu-broken",
  "foxtail-millet",
  "raagi-whole",
  "jowar-flour",
  "roasted-pistachios",
  "millet-healthy-mix",
];

export const bestsellers = bestsellerIds
  .map((id) => products.find((p) => p.id === id)!)
  .filter(Boolean);

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
