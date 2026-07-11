// Original word bank (not copied from any proprietary source), grouped loosely
// by theme purely for maintainability -- gameplay treats it as one flat pool.
const WORD_BANK = [
  // animals
  "elephant", "giraffe", "penguin", "dolphin", "octopus", "kangaroo", "raccoon", "squirrel",
  "hedgehog", "flamingo", "crocodile", "butterfly", "jellyfish", "chameleon", "peacock", "walrus",
  "otter", "koala", "camel", "gorilla", "cheetah", "zebra", "rhinoceros", "hippopotamus",
  "lobster", "seahorse", "porcupine", "platypus", "toucan", "owl",
  // food
  "pizza", "hamburger", "spaghetti", "pancake", "watermelon", "pineapple", "avocado", "croissant",
  "popcorn", "sandwich", "doughnut", "sushi", "taco", "pretzel", "cupcake", "waffle",
  "strawberry", "broccoli", "mushroom", "cheese", "noodles", "lemonade", "ice cream", "chocolate bar",
  // objects
  "umbrella", "backpack", "telescope", "flashlight", "scissors", "lightbulb", "keyboard", "headphones",
  "microphone", "camera", "candle", "mirror", "ladder", "hammer", "paintbrush", "envelope",
  "suitcase", "wristwatch", "trophy", "balloon", "anchor", "compass", "magnet", "typewriter",
  // places
  "volcano", "waterfall", "lighthouse", "castle", "pyramid", "island", "desert", "glacier",
  "rainforest", "skyscraper", "windmill", "playground", "library", "aquarium", "stadium", "cave",
  // actions
  "juggling", "sneezing", "yawning", "dancing", "swimming", "climbing", "whistling", "skateboarding",
  "snoring", "sleepwalking", "cartwheel", "tightrope walking", "arm wrestling", "hula hoop", "bungee jumping", "hiccup",
  // nature / weather
  "rainbow", "thunderstorm", "snowflake", "tornado", "avalanche", "sunrise", "eclipse", "earthquake",
  "waterfall", "meteor", "iceberg", "quicksand", "campfire", "beehive", "spiderweb", "coral reef",
  // fantasy
  "dragon", "unicorn", "wizard", "mermaid", "vampire", "werewolf", "ghost", "genie",
  "zombie", "robot", "alien", "dinosaur", "pirate", "ninja", "superhero", "knight",
  // sports & hobbies
  "basketball", "bowling", "surfing", "archery", "gymnastics", "fencing", "snowboarding", "badminton",
  "chess", "origami", "knitting", "gardening", "fishing", "skydiving", "rock climbing", "yoga",
  // vehicles
  "submarine", "helicopter", "bicycle", "rocket", "hot air balloon", "sailboat", "bulldozer", "tractor",
  "ambulance", "scooter", "skateboard", "canoe", "spaceship", "train", "jet ski", "wheelbarrow",
  // professions
  "firefighter", "astronaut", "detective", "chef", "magician", "dentist", "lifeguard", "electrician",
  "librarian", "photographer", "farmer", "plumber", "veterinarian", "referee", "beekeeper", "tailor",
  // body / everyday
  "eyebrow", "elbow", "fingerprint", "shadow", "reflection", "footprint", "handshake", "hiccup",
  "toothbrush", "shoelace", "backpack", "sunglasses", "necklace", "bracelet", "raincoat", "pajamas",
];

export function getWordBank(customWords: string[] = [], useCustomOnly = false): string[] {
  const cleanedCustom = customWords.map((w) => w.trim().toLowerCase()).filter(Boolean);
  if (useCustomOnly && cleanedCustom.length >= 3) return cleanedCustom;
  return [...WORD_BANK, ...cleanedCustom];
}

export function pickWordChoices(pool: string[], count: number, exclude: Set<string>): string[] {
  const available = pool.filter((w) => !exclude.has(w));
  const source = available.length >= count ? available : pool;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
