// ============================================================
// app-fiche.js — Popover "Fiche" : dresseur + Pokédex
// ============================================================
import { h, render } from "https://esm.sh/preact@10.23.1";
import { useHudState } from "./hud-state.js";
import { html, EcranChargement, EcranErreur, BarreSelectionMJ, BarrePV, Pokedex } from "./ui.js";

function App() {
  const s = useHudState();

  if (s.erreur) return html`<${EcranErreur} texte=${s.erreur} />`;
  if (!s.pret) return html`<${EcranChargement} texte="Connexion à Owlbear Rodeo…" />`;
  if (!s.sceneOuverte) return html`<${EcranChargement} texte="Ouvrez une scène pour utiliser le HUD." />`;

  const majChamp = (champ, valeur) => s.majTrainer(s.idAffiche, { ...s.trainerAffiche, [champ]: valeur });

  return html`
    <div class="app-hud fenetre-ds">
      <${BarreSelectionMJ}
        gm=${s.gm}
        moi=${s.moi}
        party=${s.party}
        selection=${s.selection}
        setSelection=${s.setSelection}
        trainerAffiche=${s.trainerAffiche}
        nomJoueurAffiche=${s.nomJoueurAffiche}
        creerFicheJoueur=${s.creerFicheJoueur}
        idAffiche=${s.idAffiche}
      />

      ${!s.trainerAffiche
        ? html`<${EcranChargement}
            texte=${s.gm ? "Sélectionnez ou créez une fiche de dresseur." : "Le MJ n'a pas encore créé votre fiche."}
          />`
        : html`
            <div class="carte-ds">
              <div class="entete-dresseur">
                <div class="portrait-conteneur">
                  ${s.trainerAffiche.portrait
                    ? html`<img src=${s.trainerAffiche.portrait} class="portrait" />`
                    : html`<div class="portrait portrait-vide">🧑</div>`}
                </div>
                <div class="entete-dresseur-info">
                  ${s.editable
                    ? html`<input class="input-nom-dresseur" value=${s.trainerAffiche.nomDresseur} onInput=${(e) => majChamp("nomDresseur", e.target.value)} />`
                    : html`<div class="nom-dresseur">${s.trainerAffiche.nomDresseur}</div>`}
                  <div class="sous-info-dresseur">
                    ${s.editable
                      ? html`
                          Niv. <input class="input-mini" type="number" value=${s.trainerAffiche.niveau} onInput=${(e) => majChamp("niveau", +e.target.value)} />
                          <input class="input-role" placeholder="Rôle / Spécialité" value=${s.trainerAffiche.role} onInput=${(e) => majChamp("role", e.target.value)} />
                        `
                      : html`Niv. ${s.trainerAffiche.niveau} ${s.trainerAffiche.role && `— ${s.trainerAffiche.role}`}`}
                  </div>
                  <${BarrePV} pv=${s.trainerAffiche.pv} pvMax=${s.trainerAffiche.pvMax} taille="dresseur" />
                  ${s.editable &&
                  html`<div class="pv-rapides" style=${{ marginTop: "4px" }}>
                    <button class="btn-mini" onClick=${() => majChamp("pv", Math.max(0, s.trainerAffiche.pv - 5))}>−5</button>
                    <button class="btn-mini" onClick=${() => majChamp("pv", Math.min(s.trainerAffiche.pvMax, s.trainerAffiche.pv + 5))}>+5</button>
                  </div>`}
                </div>
              </div>

              <div class="section-titre">📖 Pokédex</div>
              <${Pokedex} entries=${s.trainerAffiche.pokedex || []} editable=${s.editable} onChange=${(dex) => majChamp("pokedex", dex)} />
            </div>
          `}
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
