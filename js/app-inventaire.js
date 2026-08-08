// ============================================================
// app-inventaire.js — Popover "Sac" : inventaire + dés
// ============================================================
import { h, render } from "https://esm.sh/preact@10.23.1";
import { useState } from "https://esm.sh/preact@10.23.1/hooks";
import { useHudState } from "./hud-state.js";
import { html, EcranChargement, EcranErreur, BarreSelectionMJ, Inventaire, PanneauDes, versNombre } from "./ui.js";

function App() {
  const s = useHudState();
  const [onglet, setOnglet] = useState("sac");

  if (s.erreur) return html`<${EcranErreur} texte=${s.erreur} />`;
  if (!s.pret) return html`<${EcranChargement} texte="Connexion à Owlbear Rodeo…" />`;
  if (!s.sceneOuverte) return html`<${EcranChargement} texte="Ouvrez une scène pour utiliser le HUD." />`;

  const t = s.trainerAffiche;

  return html`
    <div class="app-hud fenetre-ds">
      <${BarreSelectionMJ}
        gm=${s.gm}
        moi=${s.moi}
        party=${s.party}
        selection=${s.selection}
        setSelection=${s.setSelection}
        trainerAffiche=${t}
        nomJoueurAffiche=${s.nomJoueurAffiche}
        creerFicheJoueur=${s.creerFicheJoueur}
        idAffiche=${s.idAffiche}
      />

      <div class="onglets">
        <button class="onglet ${onglet === "sac" ? "actif" : ""}" onClick=${() => setOnglet("sac")}>🎒 Sac</button>
        <button class="onglet ${onglet === "des" ? "actif" : ""}" onClick=${() => setOnglet("des")}>🎲 Dés</button>
        ${s.gm && html`<button class="onglet ${onglet === "reglages" ? "actif" : ""}" onClick=${() => setOnglet("reglages")}>⚙️</button>`}
      </div>

      <div class="carte-ds sans-entete">
        ${onglet === "sac" &&
        (t
          ? html`<${Inventaire} items=${t.inventaire} editable=${s.editable} onChange=${(inv) => s.majTrainer(s.idAffiche, { ...t, inventaire: inv })} />`
          : html`<${EcranChargement} texte=${s.gm ? "Sélectionnez ou créez une fiche de dresseur." : "Le MJ n'a pas encore créé votre fiche."} />`)}

        ${onglet === "des" && html`<${PanneauDes} gm=${s.gm} moi=${s.moi} party=${s.party} />`}

        ${onglet === "reglages" &&
        s.gm &&
        html`
          <div class="reglages">
            <label class="ligne-reglage">
              Mètres par case de grille
              <input
                type="number"
                step="0.1"
                value=${s.settings.metresParCase}
                onInput=${(e) => {
                  const settings = { ...s.settings, metresParCase: Math.max(0.1, versNombre(e.target.value, s.settings.metresParCase)) };
                  s.setSettingsState(settings);
                  import("./obr.js").then((m) => m.setSettings(settings));
                }}
              />
            </label>
            <p class="texte-aide">Utilisé par l'outil de mesure 📏 dans la barre d'outils de la scène.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

try {
  render(html`<${App} />`, document.getElementById("root"));
} catch (e) {
  document.getElementById("root").innerHTML = `<div class="chargement erreur">⚠️ Erreur : ${e.message}</div>`;
  console.error(e);
}

window.addEventListener("error", (e) => {
  const root = document.getElementById("root");
  if (root && !root.innerHTML) root.innerHTML = `<div class="chargement erreur">⚠️ ${e.message}</div>`;
});
