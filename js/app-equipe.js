// ============================================================
// app-equipe.js — Popover "Équipe" : les 6 Pokémon
// ============================================================
import { h, render } from "https://esm.sh/preact@10.23.1";
import { useHudState } from "./hud-state.js";
import { html, EcranChargement, EcranErreur, BarreSelectionMJ, PokemonCard } from "./ui.js";
import { emptyPokemon } from "./data.js";

function App() {
  const s = useHudState();

  if (s.erreur) return html`<${EcranErreur} texte=${s.erreur} />`;
  if (!s.pret) return html`<${EcranChargement} texte="Connexion à Owlbear Rodeo…" />`;
  if (!s.sceneOuverte) return html`<${EcranChargement} texte="Ouvrez une scène pour utiliser le HUD." />`;

  const t = s.trainerAffiche;
  const majPokemon = (idx, pokemon) => {
    const equipe = t.equipe.map((p, i) => (i === idx ? pokemon : p));
    s.majTrainer(s.idAffiche, { ...t, equipe });
  };
  const supprimerPokemon = (idx) => s.majTrainer(s.idAffiche, { ...t, equipe: t.equipe.filter((_, i) => i !== idx) });
  const ajouterPokemon = () => {
    if (t.equipe.length >= 6) return;
    s.majTrainer(s.idAffiche, { ...t, equipe: [...t.equipe, emptyPokemon()] });
  };

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

      ${!t
        ? html`<${EcranChargement} texte=${s.gm ? "Sélectionnez ou créez une fiche de dresseur." : "Le MJ n'a pas encore créé votre fiche."} />`
        : html`
            <div class="carte-ds sans-entete">
              <div class="section-titre">🔴 Équipe de ${t.nomDresseur}</div>
              <div class="equipe-grille">
                ${t.equipe.map(
                  (p, idx) => html`
                    <${PokemonCard}
                      pokemon=${p}
                      editable=${s.editable}
                      playerName=${t.nomDresseur}
                      onChange=${(np) => majPokemon(idx, np)}
                      onDelete=${() => supprimerPokemon(idx)}
                    />
                  `
                )}
                ${s.editable && t.equipe.length < 6 && html`<button class="btn btn-ajouter-pokemon" onClick=${ajouterPokemon}>+ Ajouter un Pokémon</button>`}
                ${t.equipe.length === 0 && html`<p class="texte-vide">Aucun Pokémon dans l'équipe.</p>`}
              </div>
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
