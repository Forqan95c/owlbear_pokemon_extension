// ============================================================
// data.js — Modèle de données & constantes de l'univers Pokémon
// ============================================================

export const NAMESPACE = "com.pokemon-ttrpg-hud";
export const METADATA_KEY = `${NAMESPACE}/trainers`;
export const METADATA_SCENARIO_KEY = `${NAMESPACE}/scenario`;
export const METADATA_SETTINGS_KEY = `${NAMESPACE}/settings`;
export const ITEM_METADATA_HP_KEY = `${NAMESPACE}/hp`; // metadata posée sur un item de la carte (PNJ, joueur, pokémon)
export const BROADCAST_DICE_CHANNEL = `${NAMESPACE}/dice`;
export const CONTEXT_MENU_HP_ID = `${NAMESPACE}/context-menu-hp`;
export const TOOL_DISTANCE_ID = `${NAMESPACE}/tool-distance`;
export const TOOL_DISTANCE_MODE_ID = `${NAMESPACE}/tool-distance-mode`;

// Couleurs officielles (approx.) par type Pokémon, utilisées pour les badges
export const TYPE_COLORS = {
  Normal: "#A8A878",
  Feu: "#F08030",
  Eau: "#6890F0",
  Plante: "#78C850",
  Électrik: "#F8D030",
  Glace: "#98D8D8",
  Combat: "#C03028",
  Poison: "#A040A0",
  Sol: "#E0C068",
  Vol: "#A890F0",
  Psy: "#F85888",
  Insecte: "#A8B820",
  Roche: "#B8A038",
  Spectre: "#705898",
  Dragon: "#7038F8",
  Ténèbres: "#705848",
  Acier: "#B8B8D0",
  Fée: "#EE99AC",
};

export const TYPE_LIST = Object.keys(TYPE_COLORS);

// Statuts altérés, façon jeu vidéo (abréviation, couleur, libellé complet)
export const STATUS_LIST = {
  AUCUN: { label: "Sain", abbr: "", color: "#4CAF50" },
  PAR: { label: "Paralysé", abbr: "PAR", color: "#F8D030" },
  BRN: { label: "Brûlé", abbr: "BRN", color: "#F08030" },
  PSN: { label: "Empoisonné", abbr: "PSN", color: "#A040A0" },
  SLP: { label: "Endormi", abbr: "SLP", color: "#A8A878" },
  FRZ: { label: "Gelé", abbr: "FRZ", color: "#98D8D8" },
  CONF: { label: "Confus", abbr: "CONF", color: "#F85888" },
  KO: { label: "K.O.", abbr: "K.O.", color: "#333333" },
};

export function emptyAttaque() {
  return { nom: "", type: "Normal", degats: 0, pp: 0, ppMax: 0, categorie: "Physique" };
}

export function emptyCaracteristiques() {
  return { attaque: 10, defense: 10, attaqueSpe: 10, defenseSpe: 10, vitesse: 10 };
}

export function emptyPokemon() {
  return {
    id: crypto.randomUUID(),
    nom: "",
    surnom: "",
    niveau: 5,
    typePrimaire: "Normal",
    typeSecondaire: "",
    sprite: "",
    pv: 20,
    pvMax: 20,
    statut: "AUCUN",
    caracteristiques: emptyCaracteristiques(),
    attaques: [emptyAttaque(), emptyAttaque(), emptyAttaque(), emptyAttaque()],
    surLeTerrain: false,
    itemIdSurScene: null, // id du token OBR posé sur la carte, pour le bouton "Rappeler"
  };
}

export function emptyPokedexEntry() {
  return {
    id: crypto.randomUUID(),
    espece: "",
    sprite: "",
    typePrimaire: "Normal",
    typeSecondaire: "",
    statutDex: "VU", // VU | CAPTURE
    description: "",
  };
}

export const DES_DISPONIBLES = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

export function emptySettings() {
  return { metresParCase: 1.5 };
}

export function emptyInventaireItem() {
  return { id: crypto.randomUUID(), nom: "", quantite: 1, categorie: "Objet", description: "" };
}

export function emptyTrainer(playerId, playerName) {
  return {
    playerId,
    nomDresseur: playerName || "Nouveau Dresseur",
    niveau: 1,
    role: "",
    pv: 20,
    pvMax: 20,
    portrait: "",
    equipe: [emptyPokemon()],
    inventaire: [
      { id: crypto.randomUUID(), nom: "Poké Ball", quantite: 5, categorie: "Ball", description: "Capture un Pokémon sauvage." },
      { id: crypto.randomUUID(), nom: "Potion", quantite: 3, categorie: "Soin", description: "Restaure 20 PV." },
    ],
    pokedex: [],
  };
}

export const CATEGORIES_OBJET = ["Ball", "Soin", "Objet tenu", "CT/CS", "Baie", "Objet clé", "Objet"];
