import personas from "./personas.json";

/**
 * Returns the full persona object by key.
 * Example: getPersona("piscesGhost")
 */
export function getPersona(key) {
  return personas[key] || null;
}

/**
 * Returns the systemInstruction string for a persona.
 * Example: getInstruction("firstLady")
 */
export function getInstruction(key) {
  return personas[key]?.systemInstruction || "";
}

/**
 * Returns an array of all persona keys.
 * Useful for rendering the Zodiac Council dock.
 */
export function getPersonaKeys() {
  return Object.keys(personas);
}

/**
 * Returns an array of persona objects.
 * Useful for mapping avatars in UI.
 */
export function getAllPersonas() {
  return Object.keys(personas).map((key) => ({
    key,
    ...personas[key]
  }));
}

/**
 * Returns a filtered list of Zodiac Council personas
 * (excludes Pisces Ghost + First Lady).
 */
export function getZodiacCouncil() {
  return Object.keys(personas)
    .filter((key) => key !== "piscesGhost" && key !== "firstLady")
    .map((key) => ({
      key,
      ...personas[key]
    }));
}

export default personas;
