import type { Category } from "./inventory-data";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageEmoji: string;
  timeMinutes: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  ingredients: { name: string; amount: string; category?: Category }[];
  steps: string[];
}

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Avocado Toast",
    description: "Quick, creamy, and satisfying breakfast.",
    imageEmoji: "🥑",
    timeMinutes: 8,
    servings: 2,
    difficulty: "Easy",
    tags: ["Breakfast", "Vegetarian", "Quick"],
    ingredients: [
      { name: "Sourdough Bread", amount: "2 slices", category: "Bakery" },
      { name: "Avocados", amount: "1", category: "Produce" },
      { name: "Olive Oil", amount: "1 tsp", category: "Pantry" },
      { name: "Salt & pepper", amount: "to taste" },
    ],
    steps: [
      "Toast the sourdough until golden.",
      "Mash avocado with salt, pepper and a drizzle of olive oil.",
      "Spread on toast and serve immediately.",
    ],
  },
  {
    id: "r2",
    title: "Chicken Stir Fry",
    description: "Fast weeknight dinner with crisp veggies.",
    imageEmoji: "🍗",
    timeMinutes: 15,
    servings: 3,
    difficulty: "Easy",
    tags: ["Dinner", "High protein", "Business mode"],
    ingredients: [
      { name: "Chicken Breast", amount: "500 g", category: "Meat" },
      { name: "Frozen Peas", amount: "200 g", category: "Frozen" },
      { name: "Olive Oil", amount: "2 tbsp", category: "Pantry" },
      { name: "Soy sauce", amount: "3 tbsp" },
    ],
    steps: [
      "Slice chicken into thin strips.",
      "Heat oil in a wok and sear chicken 4 min.",
      "Add peas, soy sauce, toss 3 min and serve.",
    ],
  },
  {
    id: "r3",
    title: "Banana Pancakes",
    description: "Use up ripe bananas in fluffy pancakes.",
    imageEmoji: "🥞",
    timeMinutes: 20,
    servings: 4,
    difficulty: "Easy",
    tags: ["Breakfast", "Sweet"],
    ingredients: [
      { name: "Bananas", amount: "2 ripe", category: "Produce" },
      { name: "Whole Milk", amount: "200 ml", category: "Dairy" },
      { name: "Flour", amount: "150 g" },
      { name: "Eggs", amount: "2" },
    ],
    steps: [
      "Mash bananas with milk and eggs.",
      "Whisk in flour to a smooth batter.",
      "Cook spoonfuls on a hot pan 2 min per side.",
    ],
  },
  {
    id: "r4",
    title: "Spaghetti Aglio e Olio",
    description: "Classic Italian pantry pasta.",
    imageEmoji: "🍝",
    timeMinutes: 12,
    servings: 2,
    difficulty: "Easy",
    tags: ["Dinner", "Vegetarian", "Business mode"],
    ingredients: [
      { name: "Spaghetti", amount: "200 g", category: "Pantry" },
      { name: "Olive Oil", amount: "4 tbsp", category: "Pantry" },
      { name: "Garlic", amount: "4 cloves" },
      { name: "Chili flakes", amount: "1 tsp" },
    ],
    steps: [
      "Boil spaghetti until al dente.",
      "Gently fry sliced garlic in olive oil with chili.",
      "Toss pasta with the oil and serve.",
    ],
  },
  {
    id: "r5",
    title: "Yogurt Berry Parfait",
    description: "Layered, healthy, ready in minutes.",
    imageEmoji: "🍓",
    timeMinutes: 5,
    servings: 1,
    difficulty: "Easy",
    tags: ["Breakfast", "Snack", "Business mode"],
    ingredients: [
      { name: "Greek Yogurt", amount: "1 cup", category: "Dairy" },
      { name: "Berries", amount: "1 handful", category: "Produce" },
      { name: "Honey", amount: "1 tsp" },
    ],
    steps: ["Layer yogurt, berries, drizzle honey.", "Repeat layers.", "Serve cold."],
  },
  {
    id: "r6",
    title: "Beef Tacos",
    description: "Weeknight tacos with seasoned beef.",
    imageEmoji: "🌮",
    timeMinutes: 25,
    servings: 4,
    difficulty: "Medium",
    tags: ["Dinner", "Mexican"],
    ingredients: [
      { name: "Ground Beef", amount: "400 g", category: "Meat" },
      { name: "Tortillas", amount: "8" },
      { name: "Cheddar Cheese", amount: "100 g", category: "Dairy" },
      { name: "Salsa", amount: "1 cup" },
    ],
    steps: [
      "Brown beef and season.",
      "Warm tortillas.",
      "Assemble with cheese and salsa.",
    ],
  },
  {
    id: "r7",
    title: "Spinach Smoothie",
    description: "Green, fresh, and energizing.",
    imageEmoji: "🥬",
    timeMinutes: 5,
    servings: 1,
    difficulty: "Easy",
    tags: ["Breakfast", "Vegan", "Business mode"],
    ingredients: [
      { name: "Spinach", amount: "1 handful", category: "Produce" },
      { name: "Bananas", amount: "1", category: "Produce" },
      { name: "Orange Juice", amount: "200 ml", category: "Beverages" },
    ],
    steps: ["Blend everything until smooth.", "Pour and enjoy."],
  },
  {
    id: "r8",
    title: "Grilled Cheese",
    description: "Melty, golden, comforting.",
    imageEmoji: "🧀",
    timeMinutes: 10,
    servings: 1,
    difficulty: "Easy",
    tags: ["Lunch", "Vegetarian", "Business mode"],
    ingredients: [
      { name: "Sourdough Bread", amount: "2 slices", category: "Bakery" },
      { name: "Cheddar Cheese", amount: "60 g", category: "Dairy" },
      { name: "Butter", amount: "1 tbsp", category: "Dairy" },
    ],
    steps: ["Butter bread.", "Add cheese, grill 3 min per side.", "Slice and serve."],
  },
  {
    id: "r9",
    title: "Croissant French Toast",
    description: "Decadent brunch using day-old croissants.",
    imageEmoji: "🥐",
    timeMinutes: 18,
    servings: 2,
    difficulty: "Medium",
    tags: ["Breakfast", "Sweet"],
    ingredients: [
      { name: "Croissants", amount: "2", category: "Bakery" },
      { name: "Eggs", amount: "2" },
      { name: "Whole Milk", amount: "100 ml", category: "Dairy" },
      { name: "Maple syrup", amount: "to serve" },
    ],
    steps: [
      "Whisk eggs and milk.",
      "Dip croissants and pan-fry until golden.",
      "Serve with maple syrup.",
    ],
  },
  {
    id: "r10",
    title: "Sparkling Citrus Cooler",
    description: "Refreshing 3-ingredient drink.",
    imageEmoji: "🍹",
    timeMinutes: 3,
    servings: 2,
    difficulty: "Easy",
    tags: ["Drink", "Business mode"],
    ingredients: [
      { name: "Sparkling Water", amount: "500 ml", category: "Beverages" },
      { name: "Orange Juice", amount: "200 ml", category: "Beverages" },
      { name: "Mint", amount: "a few leaves" },
    ],
    steps: ["Mix juice and sparkling water.", "Garnish with mint and ice."],
  },
  {
    id: "r11",
    title: "Veggie Frittata",
    description: "One-pan, packed with leftovers.",
    imageEmoji: "🍳",
    timeMinutes: 22,
    servings: 4,
    difficulty: "Medium",
    tags: ["Lunch", "Vegetarian"],
    ingredients: [
      { name: "Eggs", amount: "6" },
      { name: "Spinach", amount: "1 cup", category: "Produce" },
      { name: "Cheddar Cheese", amount: "80 g", category: "Dairy" },
    ],
    steps: [
      "Whisk eggs, fold in spinach and cheese.",
      "Cook in oven-safe pan, finish under broiler.",
    ],
  },
  {
    id: "r12",
    title: "Ice Cream Affogato",
    description: "2-ingredient dessert.",
    imageEmoji: "🍨",
    timeMinutes: 3,
    servings: 1,
    difficulty: "Easy",
    tags: ["Dessert", "Business mode"],
    ingredients: [
      { name: "Ice Cream", amount: "1 scoop", category: "Frozen" },
      { name: "Espresso", amount: "1 shot" },
    ],
    steps: ["Pour hot espresso over ice cream.", "Serve immediately."],
  },
];

export const ALL_TAGS = Array.from(
  new Set(MOCK_RECIPES.flatMap((r) => r.tags)),
).sort();

export function getRecipeById(id: string): Recipe | undefined {
  return MOCK_RECIPES.find((r) => r.id === id);
}
