// Avatar "face" options. Each face is a small animated icon (Lottie JSON)
// served from /public/faces/<id>.json. To add a new face, drop a JSON file
// in web/public/faces/ and add an entry here.
export interface FaceOption {
  id: number;
  label: string;
}

export const FACES: FaceOption[] = [
  { id: 1, label: "Disco Ball" },
  { id: 2, label: "Skull" },
  { id: 3, label: "Woodpecker" },
  { id: 4, label: "Spider" },
  { id: 5, label: "Shark" },
  { id: 6, label: "Bear" },
  { id: 7, label: "Duck" },
  { id: 8, label: "Squirrel" },
  { id: 9, label: "Cat" },
  { id: 10, label: "Wings" },
  { id: 11, label: "Pumpkin" },
  { id: 12, label: "Santa" },
  { id: 13, label: "Ghost" },
  { id: 14, label: "Santa 2" },
  { id: 15, label: "Paper Boat" },
  { id: 16, label: "Lucky Cat" },
  { id: 17, label: "Smile" },
  { id: 18, label: "Wow" },
  { id: 19, label: "Glasses" },
  { id: 21, label: "Champagne" },
  { id: 22, label: "Monster" },
  { id: 23, label: "Spa Flower" },
  { id: 24, label: "Clover" },
  { id: 25, label: "Flower" },
  { id: 26, label: "Dandelion" },
  { id: 27, label: "Sunflower" },
  { id: 28, label: "Skull 2" },
];

export const FACE_IDS = FACES.map((f) => f.id);
export const DEFAULT_FACE_ID = FACES[0].id;

export function faceUrl(id: number): string {
  return `/faces/${id}.json`;
}

export function isValidFaceId(id: unknown): id is number {
  return typeof id === "number" && FACE_IDS.includes(id);
}