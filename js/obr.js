// ============================================================
// obr.js — Fine couche au-dessus du SDK @owlbear-rodeo/sdk
// ============================================================
import OBR, { buildImage, buildShape, isImage } from "https://esm.sh/@owlbear-rodeo/sdk@2?bundle";
import {
  METADATA_KEY,
  METADATA_SETTINGS_KEY,
  ITEM_METADATA_HP_KEY,
  BROADCAST_DICE_CHANNEL,
  emptySettings,
} from "./data.js";

export { OBR, buildImage, isImage };

export function onReady(cb) {
  return OBR.onReady(cb);
}

export async function isGM() {
  const role = await OBR.player.getRole();
  return role === "GM";
}

export async function getSceneTrainers() {
  if (!(await OBR.scene.isReady())) return {};
  const meta = await OBR.scene.getMetadata();
  return meta[METADATA_KEY] || {};
}

export async function setSceneTrainers(trainersObj) {
  await OBR.scene.setMetadata({ [METADATA_KEY]: trainersObj });
}

export function onTrainersChange(cb) {
  return OBR.scene.onMetadataChange((meta) => {
    cb(meta[METADATA_KEY] || {});
  });
}

export async function updateTrainer(playerId, updater) {
  const trainers = await getSceneTrainers();
  const current = trainers[playerId];
  if (!current) return;
  const draft = structuredClone(current);
  updater(draft);
  trainers[playerId] = draft;
  await setSceneTrainers(trainers);
}

export async function getParty() {
  try {
    return await OBR.party.getPlayers();
  } catch {
    return [];
  }
}

// Choisir une image depuis la bibliothèque d'assets déjà uploadée par le MJ
// (sprites téléchargés à l'avance depuis Poképédia / poke5e.app puis
// importés dans Owlbear via l'Asset Manager).
export async function pickSpriteFromLibrary() {
  const results = await OBR.assets.downloadImages(false, "", "PROP");
  if (results && results.length > 0) {
    return results[0];
  }
  return null;
}

// Place un pion Pokémon sur la scène, à côté du token du dresseur si trouvé,
// sinon au centre du viewport actuel.
export async function envoyerPokemonSurScene(pokemon, playerName) {
  if (!pokemon.sprite) throw new Error("Aucun sprite défini pour ce Pokémon.");
  if (!(await OBR.scene.isReady())) throw new Error("Aucune scène ouverte.");

  let position = { x: 0, y: 0 };
  try {
    const characters = await OBR.scene.items.getItems(
      (item) => isImage(item) && item.layer === "CHARACTER"
    );
    const own = characters.find(
      (c) => c.name && playerName && c.name.toLowerCase().includes(playerName.toLowerCase())
    );
    if (own) {
      position = { x: own.position.x + 150, y: own.position.y };
    } else {
      position = await OBR.viewport.getPosition();
    }
  } catch {
    position = { x: 0, y: 0 };
  }

  const dpi = await OBR.scene.grid.getDpi();

  const item = buildImage(
    {
      width: pokemon.spriteWidth || dpi,
      height: pokemon.spriteHeight || dpi,
      url: pokemon.sprite,
      mime: "image/png",
    },
    { dpi, offset: { x: (pokemon.spriteWidth || dpi) / 2, y: (pokemon.spriteHeight || dpi) / 2 } }
  )
    .position(position)
    .layer("CHARACTER")
    .name(pokemon.surnom || pokemon.nom || "Pokémon")
    .build();

  await OBR.scene.items.addItems([item]);
  return item.id;
}

export async function rappelerPokemon(itemId) {
  if (!itemId) return;
  if (!(await OBR.scene.isReady())) return;
  await OBR.scene.items.deleteItems([itemId]);
}

// ---------- Paramètres de la scène (mètres par case, etc.) ----------

export async function getSettings() {
  if (!(await OBR.scene.isReady())) return emptySettings();
  const meta = await OBR.scene.getMetadata();
  return { ...emptySettings(), ...(meta[METADATA_SETTINGS_KEY] || {}) };
}

export async function setSettings(settings) {
  await OBR.scene.setMetadata({ [METADATA_SETTINGS_KEY]: settings });
}

// ---------- Dés — le MJ choisit le(s) dé(s) que le joueur doit lancer ----------

// data: { type: "demande"|"resultat", cibleId, cibleNom, label, nombreDes, typeDe, modificateur, resultats, total, auteur }
export function envoyerMessageDes(data) {
  OBR.broadcast.sendMessage(BROADCAST_DICE_CHANNEL, data, { destination: "ALL" });
}

export function onMessageDes(callback) {
  return OBR.broadcast.onMessage(BROADCAST_DICE_CHANNEL, (event) => callback(event.data));
}

// ---------- Points de vie sur un token de la carte (joueur / PNJ / Pokémon) ----------
// Une petite barre colorée (2 formes) est attachée au token et suit ses déplacements.

async function trouverBarres(tokenId) {
  const items = await OBR.scene.items.getItems(
    (item) => item.attachedTo === tokenId && item.metadata && item.metadata[ITEM_METADATA_HP_KEY]
  );
  return items;
}

export async function getHpDuToken(tokenId) {
  const [token] = await OBR.scene.items.getItems([tokenId]);
  if (!token) return null;
  return token.metadata[ITEM_METADATA_HP_KEY] || null;
}

export async function definirHpDuToken(tokenId, pv, pvMax) {
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (const item of items) {
      item.metadata[ITEM_METADATA_HP_KEY] = { pv, pvMax };
    }
  });

  const [token] = await OBR.scene.items.getItems([tokenId]);
  if (!token) return;

  const dpi = await OBR.scene.grid.getDpi();
  const largeur = dpi * 0.9;
  const hauteur = dpi * 0.12;
  const ratio = pvMax > 0 ? Math.max(0, Math.min(1, pv / pvMax)) : 0;
  let couleur = "#78C850";
  if (ratio <= 0.5) couleur = "#F8D030";
  if (ratio <= 0.2) couleur = "#F08030";

  const offsetY = dpi * 0.55;
  const existantes = await trouverBarres(tokenId);

  if (existantes.length === 2) {
    await OBR.scene.items.updateItems(
      existantes.map((i) => i.id),
      (items) => {
        for (const item of items) {
          if (item.name === "hp-bar-fond") {
            item.width = largeur;
            item.height = hauteur;
            item.position = { x: token.position.x - largeur / 2, y: token.position.y + offsetY };
          } else {
            item.width = Math.max(1, largeur * ratio);
            item.height = hauteur;
            item.style.fillColor = couleur;
            item.position = { x: token.position.x - largeur / 2, y: token.position.y + offsetY };
          }
        }
      }
    );
  } else {
    // (re)crée les deux formes : fond gris + remplissage coloré
    const idsAncienne = existantes.map((i) => i.id);
    if (idsAncienne.length) await OBR.scene.items.deleteItems(idsAncienne);

    const fond = buildShape()
      .width(largeur)
      .height(hauteur)
      .shapeType("RECTANGLE")
      .position({ x: token.position.x - largeur / 2, y: token.position.y + offsetY })
      .attachedTo(tokenId)
      .layer("ATTACHMENT")
      .locked(true)
      .disableHit(true)
      .name("hp-bar-fond")
      .build();
    fond.style.fillColor = "#20201c";
    fond.style.fillOpacity = 0.9;
    fond.style.strokeWidth = 1;
    fond.metadata[ITEM_METADATA_HP_KEY] = true;

    const remplissage = buildShape()
      .width(Math.max(1, largeur * ratio))
      .height(hauteur)
      .shapeType("RECTANGLE")
      .position({ x: token.position.x - largeur / 2, y: token.position.y + offsetY })
      .attachedTo(tokenId)
      .layer("ATTACHMENT")
      .locked(true)
      .disableHit(true)
      .name("hp-bar-remplissage")
      .build();
    remplissage.style.fillColor = couleur;
    remplissage.style.strokeWidth = 0;
    remplissage.metadata[ITEM_METADATA_HP_KEY] = true;

    await OBR.scene.items.addItems([fond, remplissage]);
  }
}

export async function supprimerHpDuToken(tokenId) {
  const existantes = await trouverBarres(tokenId);
  if (existantes.length) await OBR.scene.items.deleteItems(existantes.map((i) => i.id));
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (const item of items) delete item.metadata[ITEM_METADATA_HP_KEY];
  });
}
