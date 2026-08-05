// ============================================================
// background.js — tourne en continu (manifest.background_url)
// Enregistre : le menu contextuel "Points de Vie" et l'outil
// "Mesurer une distance" (en mètres), disponibles pour TOUT
// token de la carte (joueur, PNJ, Pokémon).
// ============================================================
import OBR, { buildCurve, isImage } from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { CONTEXT_MENU_HP_ID, TOOL_DISTANCE_ID, TOOL_DISTANCE_MODE_ID, METADATA_SETTINGS_KEY } from "./data.js";

OBR.onReady(async () => {
  try {
  // ---------- Menu contextuel : Points de Vie ----------
  await OBR.contextMenu.create({
    id: CONTEXT_MENU_HP_ID,
    icons: [
      {
        icon: "icons/heart.svg",
        label: "Points de Vie",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: "layer", value: "MOUNT", coordinator: "||" },
          ],
          max: 1,
        },
      },
    ],
    embed: {
      url: "hp.html",
      height: 130,
    },
  });

  // ---------- Outil : Mesurer une distance (en mètres) ----------
  await OBR.tool.create({
    id: TOOL_DISTANCE_ID,
    icons: [{ icon: "icons/ruler.svg", label: "Mesurer une distance" }],
    defaultMode: TOOL_DISTANCE_MODE_ID,
  });

  await OBR.tool.createMode({
    id: TOOL_DISTANCE_MODE_ID,
    icons: [{ icon: "icons/ruler.svg", label: "Mesurer une distance" }],
    cursors: [{ cursor: "crosshair" }],
    async onToolClick(context, event) {
      const metadata = await OBR.tool.getMetadata(TOOL_DISTANCE_ID);
      const premierPoint = metadata?.premierPoint;

      if (!premierPoint) {
        await OBR.tool.setMetadata(TOOL_DISTANCE_ID, {
          premierPoint: event.pointerPosition,
          premierNom: event.target?.name || null,
        });
        OBR.notification.show("Cliquez sur une 2ᵉ cible pour mesurer la distance.", "INFO");
        return;
      }

      const dx = event.pointerPosition.x - premierPoint.x;
      const dy = event.pointerPosition.y - premierPoint.y;
      const distancePx = Math.sqrt(dx * dx + dy * dy);
      const dpi = await OBR.scene.grid.getDpi();
      const sceneMeta = await OBR.scene.getMetadata();
      const metresParCase = sceneMeta[METADATA_SETTINGS_KEY]?.metresParCase ?? 1.5;
      const distanceM = (distancePx / dpi) * metresParCase;

      const nomA = premierNomOuDefaut(metadata.premierNom);
      const nomB = premierNomOuDefaut(event.target?.name);

      OBR.notification.show(`📏 ${nomA} → ${nomB} : ${distanceM.toFixed(1)} m`, "SUCCESS");

      // Trait temporaire visuel (local, non synchronisé, auto-supprimé)
      const ligne = buildCurve()
        .points([premierPoint, event.pointerPosition])
        .tension(0)
        .strokeColor("#F8D030")
        .strokeWidth(4)
        .strokeOpacity(0.9)
        .fillOpacity(0)
        .closed(false)
        .build();
      await OBR.scene.local.addItems([ligne]);
      setTimeout(() => {
        OBR.scene.local.deleteItems([ligne.id]);
      }, 3000);

      await OBR.tool.setMetadata(TOOL_DISTANCE_ID, { premierPoint: null, premierNom: null });
    },
    onDeactivate() {
      OBR.tool.setMetadata(TOOL_DISTANCE_ID, { premierPoint: null, premierNom: null });
    },
  });
  } catch (e) {
    console.error("Erreur d'initialisation du module général Pokémon :", e);
  }
});

function premierNomOuDefaut(nom) {
  return nom || "Point";
}
