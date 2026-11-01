import { unsplash } from "@/lib/unsplash";
import type { Occasion } from "@/types/catalog";

// Editorial homepage content. Not catalog data, so it stays in code.

export const heroImage = unsplash(
  "1457089328109-e5d9bd499191",
  "Deep red and coral blooms arranged against a dark background",
  2400,
);

export const storyImage = unsplash(
  "1563241527-3004b7be0ffd",
  "Blush garden roses wrapped in kraft paper on a wooden table",
  1600,
);

export const occasions: Occasion[] = [
  { slug: "birthday", name: "Birthday", image: unsplash("1522057384400-681b421cfebc", "Tiered celebration cake decorated with flowers", 800) },
  { slug: "anniversary", name: "Anniversary", image: unsplash("1526047932273-341f2a7631f9", "Hands holding a heart made of pink flowers", 800) },
  { slug: "sympathy", name: "Sympathy", image: unsplash("1606041008023-472dfb5e530f", "White daisy against a warm blurred background", 800) },
  { slug: "congratulations", name: "Congratulations", image: unsplash("1490750967868-88aa4486c946", "Field of yellow poppies under a blue sky", 800) },
  { slug: "thank-you", name: "Thank You", image: unsplash("1520763185298-1b434c919102", "A single pink tulip on a pink background", 800) },
  { slug: "get-well", name: "Get Well Soon", image: unsplash("1455659817273-f96807779a8a", "Bright sunflowers filling the frame", 800) },
];
