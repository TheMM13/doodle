// Original word bank (not copied from skribbl.io's proprietary compiled list --
// see README) grouped loosely by theme purely for maintainability; gameplay
// treats it as one flat pool. Sized and diversified to match the breadth of
// a real skribbl-style word list (categories, common nouns and gerunds,
// occasional two-word phrases).
const WORD_BANK = [
  // animals
  "elephant", "giraffe", "penguin", "dolphin", "octopus", "kangaroo", "raccoon", "squirrel",
  "hedgehog", "flamingo", "crocodile", "butterfly", "jellyfish", "chameleon", "peacock", "walrus",
  "otter", "koala", "camel", "gorilla", "cheetah", "zebra", "rhinoceros", "hippopotamus",
  "lobster", "seahorse", "porcupine", "platypus", "toucan", "owl", "panda", "tiger",
  "lion", "wolf", "fox", "bear", "moose", "deer", "rabbit", "hamster",
  "ferret", "skunk", "beaver", "bat", "bison", "buffalo", "antelope", "gazelle",
  "llama", "alpaca", "donkey", "mule", "goat", "sheep", "pig", "cow",
  "horse", "rooster", "turkey", "duck", "goose", "swan", "pelican", "stork",
  "vulture", "eagle", "falcon", "hawk", "parrot", "cockatoo",

  // food & drink
  "pizza", "hamburger", "spaghetti", "pancake", "watermelon", "pineapple", "avocado", "croissant",
  "popcorn", "sandwich", "doughnut", "sushi", "taco", "pretzel", "cupcake", "waffle",
  "strawberry", "broccoli", "mushroom", "cheese", "noodles", "lemonade", "ice cream", "chocolate bar",
  "burrito", "lasagna", "dumpling", "pumpkin pie", "carrot cake", "milkshake", "hot dog", "french fries",
  "nachos", "popsicle", "marshmallow", "gingerbread man", "birthday cake", "meatball", "omelette", "corn on the cob",
  "honeycomb", "peanut butter", "jelly bean", "candy cane", "lollipop", "bubblegum", "potato chip", "garlic bread",
  "fried egg", "bacon", "sausage", "cereal", "yogurt",

  // everyday objects
  "umbrella", "backpack", "telescope", "flashlight", "scissors", "lightbulb", "keyboard", "headphones",
  "microphone", "camera", "candle", "mirror", "ladder", "hammer", "paintbrush", "envelope",
  "suitcase", "wristwatch", "trophy", "balloon", "anchor", "compass", "magnet", "typewriter",
  "calculator", "stapler", "thermometer", "calendar", "wallet", "padlock", "rope", "bucket",
  "broom", "mop", "vacuum cleaner", "toaster", "blender", "kettle", "iron", "sewing machine",
  "electric fan", "remote control", "battery", "matchstick", "safety pin", "paperclip", "rubber band", "glue stick",
  "ruler", "eraser", "pencil sharpener", "globe", "hourglass", "kite", "parachute", "fireworks",
  "treasure chest", "binoculars", "magnifying glass", "periscope", "satellite dish",

  // places & buildings
  "volcano", "waterfall", "lighthouse", "castle", "pyramid", "island", "desert", "glacier",
  "rainforest", "skyscraper", "windmill", "playground", "library", "aquarium", "stadium", "cave",
  "canyon", "oasis", "swamp", "jungle", "farm", "greenhouse", "barn", "treehouse",
  "igloo", "tent", "cabin", "cottage", "mansion", "dungeon", "maze", "bridge",
  "tunnel", "harbor", "marketplace", "museum", "temple", "palace", "fortress", "observatory",
  "planetarium",

  // actions
  "juggling", "sneezing", "yawning", "dancing", "swimming", "climbing", "whistling", "skateboarding",
  "snoring", "sleepwalking", "cartwheel", "tightrope walking", "arm wrestling", "hula hoop", "bungee jumping", "hiccup",
  "laughing", "crying", "jumping rope", "tug of war", "piggyback ride", "thumb war", "staring contest", "pillow fight",
  "snowball fight", "kite flying", "breakdancing", "moonwalking", "karate chop", "high five", "fist bump", "handstand",
  "somersault", "cannonball", "belly flop", "limbo", "hopscotch", "yodeling", "hair braiding", "face painting",
  "balancing", "tiptoeing", "crawling", "hiking", "rowing", "paddling", "sledding", "tobogganing",

  // nature & weather
  "rainbow", "thunderstorm", "snowflake", "tornado", "avalanche", "sunrise", "sunset", "eclipse",
  "earthquake", "meteor", "iceberg", "quicksand", "campfire", "beehive", "spiderweb", "coral reef",
  "lightning", "hurricane", "blizzard", "fog", "dew", "frost", "hailstorm", "monsoon",
  "whirlpool", "geyser", "stalactite", "sand dune", "tide pool", "northern lights", "shooting star", "comet",
  "constellation", "black hole", "supernova", "solar flare",

  // fantasy & mythical
  "dragon", "unicorn", "wizard", "mermaid", "vampire", "werewolf", "ghost", "genie",
  "zombie", "robot", "alien", "dinosaur", "pirate", "ninja", "superhero", "knight",
  "troll", "goblin", "fairy", "elf", "dwarf", "centaur", "phoenix", "griffin",
  "sphinx", "cyclops", "kraken", "yeti", "bigfoot", "gnome",

  // sports & hobbies
  "basketball", "bowling", "surfing", "archery", "gymnastics", "fencing", "snowboarding", "badminton",
  "chess", "origami", "knitting", "gardening", "fishing", "skydiving", "rock climbing", "yoga",
  "tennis", "golf", "cricket", "rugby", "volleyball", "hockey", "boxing", "wrestling",
  "weightlifting", "marathon", "triathlon", "horseback riding", "sailing", "scuba diving", "snorkeling", "ice skating",
  "figure skating", "curling", "darts", "billiards", "ping pong", "frisbee", "painting", "sculpting",
  "pottery", "calligraphy", "scrapbooking",

  // vehicles
  "submarine", "helicopter", "bicycle", "rocket", "hot air balloon", "sailboat", "bulldozer", "tractor",
  "ambulance", "scooter", "skateboard", "canoe", "spaceship", "train", "jet ski", "wheelbarrow",
  "motorcycle", "unicycle", "golf cart", "forklift", "fire truck", "garbage truck", "cement mixer", "monster truck",
  "race car", "go-kart", "hovercraft", "blimp", "glider", "tricycle", "rickshaw", "gondola",
  "cable car",

  // professions
  "firefighter", "astronaut", "detective", "chef", "magician", "dentist", "lifeguard", "electrician",
  "librarian", "photographer", "farmer", "plumber", "veterinarian", "referee", "beekeeper", "tailor",
  "judge", "pilot", "sailor", "surgeon", "journalist", "architect", "carpenter", "mechanic",
  "barber", "butcher", "baker", "jeweler", "florist", "zookeeper", "lumberjack", "blacksmith",
  "sculptor", "cartoonist",

  // body & everyday
  "eyebrow", "elbow", "fingerprint", "shadow", "reflection", "footprint", "handshake", "toothbrush",
  "shoelace", "sunglasses", "necklace", "bracelet", "raincoat", "pajamas", "mustache", "freckles",
  "dimple", "wrinkle", "goosebumps", "ponytail", "braid", "earring", "tattoo", "scar",
  "blister", "callus", "knuckle", "kneecap", "collarbone", "eyelash",

  // technology & street furniture
  "smartphone", "laptop", "tablet", "drone", "printer", "router", "joystick", "gamepad",
  "virtual reality headset", "robot arm", "solar panel", "wind turbine", "security camera", "credit card", "barcode scanner", "atm machine",
  "vending machine", "escalator", "elevator", "revolving door", "traffic light", "streetlight", "fire hydrant", "mailbox",
  "birdhouse", "doghouse", "scarecrow", "weathervane", "wind chime", "sundial",

  // clothing & accessories
  "top hat", "baseball cap", "bowtie", "necktie", "scarf", "mittens", "earmuffs", "poncho",
  "kilt", "tuxedo", "wedding dress", "ballet tutu", "cowboy hat", "sombrero", "turban", "cape",
  "armor", "wetsuit", "apron", "overalls", "flip-flops", "high heels", "roller skates", "ice skates",

  // space & science
  "space station", "satellite", "asteroid", "galaxy", "microscope", "test tube", "beaker", "dna strand",
  "atom", "hologram", "laser", "moon rover", "alien spaceship", "meteor shower", "gravity", "wormhole",
  "time machine", "teleporter",

  // insects & small creatures
  "ladybug", "grasshopper", "dragonfly", "caterpillar", "cocoon", "ant", "beetle", "firefly",
  "mosquito", "snail", "slug", "worm", "centipede", "scorpion", "tarantula", "praying mantis",
  "cockroach", "moth", "wasp",

  // birds
  "hummingbird", "woodpecker", "seagull", "sparrow", "crow", "raven", "robin", "blue jay",
  "cardinal", "ostrich", "emu", "kiwi bird", "puffin", "albatross",

  // ocean & underwater
  "shark", "whale", "starfish", "sea turtle", "stingray", "clownfish", "angelfish", "hermit crab",
  "sea urchin", "seaweed", "coral", "shipwreck", "pearl", "oyster", "fishing net", "buoy",
  "surfboard", "tsunami", "riptide", "sandcastle", "message in a bottle",

  // music & instruments
  "guitar", "piano", "violin", "drum set", "trumpet", "saxophone", "flute", "harmonica",
  "accordion", "banjo", "harp", "ukulele", "xylophone", "tambourine", "maracas", "bagpipes",
  "cello", "trombone", "tuba", "cymbals",

  // school & office
  "chalkboard", "whiteboard", "notebook", "textbook", "report card", "graduation cap", "diploma", "school bus",
  "locker", "cafeteria tray", "pencil case", "highlighter", "sticky note", "paper airplane", "spelling bee", "science fair",
  "book report", "hall pass", "detention",

  // kitchen & household
  "frying pan", "cutting board", "rolling pin", "oven mitt", "dish soap", "laundry basket", "clothesline", "ironing board",
  "wardrobe", "bunk bed", "rocking chair", "hammock", "chandelier", "doormat", "garden hose", "lawn mower",
  "watering can", "flower pot", "birdbath", "garden gnome", "picket fence",

  // games & toys
  "jigsaw puzzle", "rubiks cube", "yo-yo", "teddy bear", "rocking horse", "toy soldier", "building blocks", "marbles",
  "board game", "dice", "playing cards", "dominoes", "slingshot", "pinwheel", "bubble wand", "water gun",
  "paper boat", "sock puppet", "jack in the box", "spinning top", "kaleidoscope", "snow globe", "piggy bank", "treasure map",

  // monsters & halloween
  "jack-o-lantern", "haunted house", "skeleton", "witch", "cauldron", "broomstick", "black cat", "tombstone",
  "mummy", "frankenstein", "headless horseman", "candy corn",

  // compound / two-word phrases
  "rubber duck", "traffic jam", "snow angel", "sand dune buggy", "water balloon", "paper cut", "campfire story", "lemonade stand",
  "garage sale", "block party", "food fight", "staring match", "bubble bath", "tea party", "treasure hunt", "scavenger hunt",
  "obstacle course", "relay race", "potato sack race", "three legged race", "pillow fort", "blanket fort", "snowman", "ice sculpture",
  "balloon animal", "face mask",

  // miscellaneous
  "wind sock", "fire extinguisher", "first aid kit", "stethoscope", "wheelchair", "crutches", "band-aid", "x-ray",
  "syringe", "medicine bottle", "hospital bed", "police badge", "handcuffs", "jail cell", "wanted poster", "pirate flag",
  "genie lamp", "magic carpet", "crystal ball", "tarot cards", "fortune cookie", "magic wand",
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
