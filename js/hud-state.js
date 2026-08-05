// ============================================================
// hud-state.js — état partagé (connexion OBR, party, fiches)
// réutilisé par les 3 popovers (fiche / équipe / inventaire)
// ============================================================
import { useState, useEffect, useCallback } from "https://esm.sh/preact@10.23.1/hooks";
import {
  OBR,
  onReady,
  isGM,
  getSceneTrainers,
  setSceneTrainers,
  getParty,
  onTrainersChange,
  getSettings,
} from "./obr.js";
import { emptyTrainer, emptySettings } from "./data.js";

export function useHudState() {
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [sceneOuverte, setSceneOuverte] = useState(false);
  const [gm, setGm] = useState(false);
  const [moi, setMoi] = useState(null);
  const [party, setParty] = useState([]);
  const [trainers, setTrainers] = useState({});
  const [settings, setSettingsState] = useState(emptySettings());
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    let annule = false;
    const unsub = onReady(async () => {
      try {
        setPret(true);
        const role = await isGM();
        if (annule) return;
        setGm(role);
        const id = await OBR.player.getId();
        const name = await OBR.player.getName();
        if (annule) return;
        setMoi({ id, name });
        setSelection((s) => s || id);

        const majParty = async () => setParty(await getParty());
        await majParty();
        const unsubParty = OBR.party.onChange(majParty);

        const chargerScene = async () => {
          const ready = await OBR.scene.isReady();
          setSceneOuverte(ready);
          if (ready) {
            setTrainers(await getSceneTrainers());
            setSettingsState(await getSettings());
          }
        };
        await chargerScene();
        const unsubScene = OBR.scene.onReadyChange(chargerScene);
        const unsubTrainers = onTrainersChange(setTrainers);

        return () => {
          unsubParty();
          unsubScene();
          unsubTrainers();
        };
      } catch (e) {
        console.error(e);
        setErreur(e.message || String(e));
      }
    });
    return () => {
      annule = true;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const creerFicheJoueur = useCallback(async (playerId, playerName) => {
    const t = await getSceneTrainers();
    if (!t[playerId]) {
      t[playerId] = emptyTrainer(playerId, playerName);
      await setSceneTrainers(t);
    }
  }, []);

  const majTrainer = useCallback(async (playerId, trainer) => {
    const t = await getSceneTrainers();
    t[playerId] = trainer;
    await setSceneTrainers(t);
  }, []);

  const idAffiche = gm ? selection : moi?.id;
  const trainerAffiche = idAffiche ? trainers[idAffiche] : null;
  const nomJoueurAffiche = moi && idAffiche === moi.id ? moi.name : party.find((p) => p.id === idAffiche)?.name || "Joueur";

  return {
    pret,
    erreur,
    sceneOuverte,
    gm,
    moi,
    party,
    trainers,
    settings,
    setSettingsState,
    selection,
    setSelection,
    idAffiche,
    trainerAffiche,
    nomJoueurAffiche,
    creerFicheJoueur,
    majTrainer,
    editable: gm || (moi && idAffiche === moi.id),
  };
}
