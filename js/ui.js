// ============================================================
// ui.js — Composants Preact partagés entre les 3 popovers
// ============================================================
import { h } from "https://esm.sh/preact@10.23.1";
import { useState, useEffect, useRef } from "https://esm.sh/preact@10.23.1/hooks";
import htm from "https://esm.sh/htm@3.1.1";
import { OBR, pickSpriteFromLibrary, envoyerPokemonSurScene, rappelerPokemon, envoyerMessageDes, onMessageDes } from "./obr.js";
import { TYPE_COLORS, TYPE_LIST, STATUS_LIST, CATEGORIES_OBJET, DES_DISPONIBLES, emptyInventaireItem, emptyPokedexEntry } from "./data.js";

export const html = htm.bind(h);

function clamp(v, min, max) {
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

// Convertit une saisie utilisateur en nombre fini, avec repli si vide/invalide.
// Évite qu'un champ vidé (NaN) ne se propage dans les données partagées de la
// scène et ne casse l'affichage chez tout le monde.
export function versNombre(valeur, repli = 0) {
  const n = Number(valeur);
  return Number.isFinite(n) ? n : repli;
}

const STATUTS_RAPIDES = ["AUCUN", "PAR", "BRN", "PSN", "SLP", "KO"];

// Champ texte "tamponné" : la frappe reste locale et instantanée (pas de
// saut de curseur), la valeur n'est envoyée à la scène partagée qu'après une
// courte pause (anti-scintillement + évite de spammer le réseau à chaque lettre).
export function ChampTexte({ value, onCommit, delay = 500, multiline = false, ...props }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const onInput = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onCommit(v), delay);
  };

  const onBlur = (e) => {
    clearTimeout(timerRef.current);
    onCommit(e.target.value);
  };

  return multiline
    ? html`<textarea ...${props} value=${local} onInput=${onInput} onBlur=${onBlur}></textarea>`
    : html`<input ...${props} value=${local} onInput=${onInput} onBlur=${onBlur} />`;
}

// ---------- Écrans d'état ----------

export function EcranChargement({ texte }) {
  return html`<div class="chargement"><div class="pokeball-spin"></div>${texte}</div>`;
}

export function EcranErreur({ texte }) {
  return html`<div class="chargement erreur">⚠️ ${texte}</div>`;
}

// ---------- Sélecteur MJ (quelle fiche afficher) ----------

export function BarreSelectionMJ({ gm, moi, party, selection, setSelection, trainerAffiche, nomJoueurAffiche, creerFicheJoueur, idAffiche }) {
  if (!gm) return null;
  return html`
    <div class="barre-gm">
      <label>
        Dresseur
        <select value=${selection} onChange=${(e) => setSelection(e.target.value)}>
          <option value=${moi.id}>${moi.name} (moi, MJ)</option>
          ${party.map((p) => html`<option value=${p.id}>${p.name}</option>`)}
        </select>
      </label>
      ${!trainerAffiche &&
      html`<button class="btn btn-mini" onClick=${() => creerFicheJoueur(idAffiche, nomJoueurAffiche)}>+ Créer sa fiche</button>`}
    </div>
  `;
}

// ---------- Petits composants utilitaires ----------

export function BarrePV({ pv, pvMax, taille = "normal" }) {
  const ratio = pvMax > 0 ? Math.max(0, Math.min(1, pv / pvMax)) : 0;
  let couleur = "#6abe30";
  if (ratio <= 0.5) couleur = "#f7d51d";
  if (ratio <= 0.2) couleur = "#e8432b";
  return html`
    <div class="barre-pv-conteneur ${taille}">
      <span class="barre-pv-label">PV</span>
      <div class="barre-pv-fond">
        <div class="barre-pv-remplissage" style=${{ width: `${ratio * 100}%`, background: couleur }}></div>
      </div>
      <span class="barre-pv-texte">${pv}/${pvMax}</span>
    </div>
  `;
}

export function BadgeType({ type }) {
  if (!type) return null;
  return html`<span class="badge-type" style=${{ background: TYPE_COLORS[type] || "#999" }}>${type}</span>`;
}

export function BadgeStatut({ statut }) {
  const s = STATUS_LIST[statut] || STATUS_LIST.AUCUN;
  if (statut === "AUCUN") return null;
  return html`<span class="badge-statut" style=${{ background: s.color }}>${s.abbr}</span>`;
}

// ---------- Carte Pokémon (équipe) ----------

export function PokemonCard({ pokemon, editable, playerName, onChange, onDelete }) {
  const [ouvert, setOuvert] = useState(false);

  const majChamp = (champ, valeur) => onChange({ ...pokemon, [champ]: valeur });
  const majCarac = (champ, valeur) => onChange({ ...pokemon, caracteristiques: { ...pokemon.caracteristiques, [champ]: valeur } });
  const majAttaque = (idx, champ, valeur) => {
    const attaques = pokemon.attaques.map((a, i) => (i === idx ? { ...a, [champ]: valeur } : a));
    onChange({ ...pokemon, attaques });
  };

  const choisirSprite = async () => {
    const img = await pickSpriteFromLibrary();
    if (img) onChange({ ...pokemon, sprite: img.image.url, spriteWidth: img.image.width, spriteHeight: img.image.height });
  };

  const envoyer = async () => {
    try {
      // Si l'état pense que le Pokémon est déjà sur le terrain, on vérifie
      // que le token existe encore (il a pu être supprimé manuellement).
      if (pokemon.surLeTerrain && pokemon.itemIdSurScene) {
        const existeEncore = await OBR.scene.items.getItems([pokemon.itemIdSurScene]);
        if (existeEncore.length > 0) {
          OBR.notification.show("Ce Pokémon est déjà sur le terrain.", "WARNING");
          return;
        }
      }
      const itemId = await envoyerPokemonSurScene(pokemon, playerName);
      onChange({ ...pokemon, surLeTerrain: true, itemIdSurScene: itemId });
    } catch (e) {
      OBR.notification.show(e.message || "Impossible d'envoyer ce Pokémon.", "ERROR");
    }
  };

  const rappeler = async () => {
    try {
      await rappelerPokemon(pokemon.itemIdSurScene);
    } catch (e) {
      // Le token a peut-être déjà été supprimé manuellement : pas grave,
      // on remet quand même l'état à jour ci-dessous.
    }
    onChange({ ...pokemon, surLeTerrain: false, itemIdSurScene: null });
  };

  const relacher = () => {
    if (confirm(`Relâcher ${pokemon.surnom || pokemon.nom || "ce Pokémon"} ? Cette action est irréversible.`)) {
      if (pokemon.surLeTerrain) rappelerPokemon(pokemon.itemIdSurScene);
      onDelete();
    }
  };

  return html`
    <div class="carte-pokemon ${pokemon.statut === "KO" ? "ko" : ""}">
      <div class="carte-pokemon-entete" onClick=${() => setOuvert(!ouvert)}>
        <div class="sprite-conteneur">
          ${pokemon.sprite ? html`<img src=${pokemon.sprite} class="sprite" alt=${pokemon.nom} /> ` : html`<div class="sprite sprite-vide"><div class="mini-pokeball"></div></div>`}
        </div>
        <div class="carte-pokemon-info">
          <div class="carte-pokemon-nom">
            ${pokemon.surnom || pokemon.nom || "Pokémon"} <span class="niveau">Niv.${pokemon.niveau}</span>
            <${BadgeStatut} statut=${pokemon.statut} />
          </div>
          <div class="carte-pokemon-types">
            <${BadgeType} type=${pokemon.typePrimaire} />
            <${BadgeType} type=${pokemon.typeSecondaire} />
          </div>
          <${BarrePV} pv=${pokemon.pv} pvMax=${pokemon.pvMax} />
        </div>
        <div class="carte-pokemon-toggle">${ouvert ? "▲" : "▼"}</div>
      </div>

      <div class="carte-pokemon-actions">
        ${!pokemon.surLeTerrain
          ? html`<button class="btn btn-envoyer" onClick=${envoyer}>⚡ Envoyer au combat</button>`
          : html`<button class="btn btn-rappeler" onClick=${rappeler}>↩ Rappeler</button>`}
        <div class="pv-rapides">
          <button class="btn-mini" onClick=${() => majChamp("pv", clamp(pokemon.pv - 5, 0, pokemon.pvMax))} title="−5 PV">−5</button>
          <button class="btn-mini" onClick=${() => majChamp("pv", clamp(pokemon.pv - 1, 0, pokemon.pvMax))} title="−1 PV">−1</button>
          <button class="btn-mini" onClick=${() => majChamp("pv", clamp(pokemon.pv + 1, 0, pokemon.pvMax))} title="+1 PV">+1</button>
          <button class="btn-mini" onClick=${() => majChamp("pv", clamp(pokemon.pv + 5, 0, pokemon.pvMax))} title="+5 PV">+5</button>
        </div>
      </div>

      ${editable &&
      html`
        <div class="statuts-rapides">
          ${STATUTS_RAPIDES.map((s) => {
            const def = STATUS_LIST[s];
            const actif = pokemon.statut === s;
            return html`
              <button
                class="chip-statut ${actif ? "actif" : ""}"
                style=${actif ? { background: def.color, borderColor: def.color } : {}}
                onClick=${() => majChamp("statut", s)}
                title=${def.label}
              >
                ${s === "AUCUN" ? "✓" : def.abbr}
              </button>
            `;
          })}
        </div>
      `}

      ${ouvert &&
      html`
        <div class="carte-pokemon-details">
          ${editable &&
          html`
            <div class="grille-champs">
              <label>Espèce <${ChampTexte} value=${pokemon.nom} onCommit=${(v) => majChamp("nom", v)} /></label>
              <label>Surnom <${ChampTexte} value=${pokemon.surnom} onCommit=${(v) => majChamp("surnom", v)} /></label>
              <label>Niveau <input type="number" min="1" max="100" value=${pokemon.niveau} onInput=${(e) => majChamp("niveau", clamp(+e.target.value, 1, 100))} /></label>
              <label>PV Max <input type="number" min="1" value=${pokemon.pvMax} onInput=${(e) => majChamp("pvMax", Math.max(1, +e.target.value || 1))} /></label>
              <label>PV actuels <input type="number" min="0" value=${pokemon.pv} onInput=${(e) => majChamp("pv", clamp(+e.target.value, 0, pokemon.pvMax))} /></label>
              <label>
                Type 1
                <select value=${pokemon.typePrimaire} onChange=${(e) => majChamp("typePrimaire", e.target.value)}>
                  ${TYPE_LIST.map((t) => html`<option value=${t}>${t}</option>`)}
                </select>
              </label>
              <label>
                Type 2
                <select value=${pokemon.typeSecondaire} onChange=${(e) => majChamp("typeSecondaire", e.target.value)}>
                  <option value="">—</option>
                  ${TYPE_LIST.map((t) => html`<option value=${t}>${t}</option>`)}
                </select>
              </label>
              <label>
                Statut
                <select value=${pokemon.statut} onChange=${(e) => majChamp("statut", e.target.value)}>
                  ${Object.keys(STATUS_LIST).map((s) => html`<option value=${s}>${STATUS_LIST[s].label}</option>`)}
                </select>
              </label>
            </div>

            <div class="caracteristiques-grille">
              ${["attaque", "defense", "attaqueSpe", "defenseSpe", "vitesse"].map(
                (c) => html`
                  <label class="carac-champ"
                    >${{ attaque: "Attaque", defense: "Défense", attaqueSpe: "Atq. Spé.", defenseSpe: "Déf. Spé.", vitesse: "Vitesse" }[c]}
                    <input type="number" min="1" value=${pokemon.caracteristiques?.[c] ?? 10} onInput=${(e) => majCarac(c, Math.max(1, versNombre(e.target.value, 10)))} />
                  </label>
                `
              )}
            </div>

            <button class="btn-lien" onClick=${choisirSprite}>🖼 Choisir le sprite (bibliothèque OBR)</button>
          `}
          ${!editable &&
          html`
            <div class="caracteristiques-grille lecture">
              ${["attaque", "defense", "attaqueSpe", "defenseSpe", "vitesse"].map(
                (c) => html`
                  <div class="carac-champ-ro">
                    <span>${{ attaque: "Attaque", defense: "Défense", attaqueSpe: "Atq. Spé.", defenseSpe: "Déf. Spé.", vitesse: "Vitesse" }[c]}</span>
                    <strong>${pokemon.caracteristiques?.[c] ?? 10}</strong>
                  </div>
                `
              )}
            </div>
          `}

          <div class="attaques-liste">
            ${pokemon.attaques.map(
              (a, idx) => html`
                <div class="attaque-ligne">
                  ${editable
                    ? html`
                        <${ChampTexte} class="attaque-nom" placeholder="Attaque" value=${a.nom} onCommit=${(v) => majAttaque(idx, "nom", v)} />
                        <select value=${a.type} onChange=${(e) => majAttaque(idx, "type", e.target.value)}>
                          ${TYPE_LIST.map((t) => html`<option value=${t}>${t}</option>`)}
                        </select>
                        <input class="attaque-degats" type="number" min="0" title="Dégâts" value=${a.degats} onInput=${(e) => majAttaque(idx, "degats", Math.max(0, +e.target.value || 0))} />
                        <input class="attaque-pp" type="number" min="0" title="PP actuels" value=${a.pp} onInput=${(e) => majAttaque(idx, "pp", clamp(+e.target.value, 0, a.ppMax || 99))} />
                        /
                        <input class="attaque-pp" type="number" min="0" title="PP max" value=${a.ppMax} onInput=${(e) => majAttaque(idx, "ppMax", Math.max(0, +e.target.value || 0))} />
                      `
                    : html`
                        <span class="attaque-nom-ro">${a.nom || "—"}</span>
                        <${BadgeType} type=${a.type} />
                        <span class="attaque-degats-ro">${a.degats} dgts</span>
                        <span class="pp-pastilles" title="${a.pp}/${a.ppMax} PP">
                          PP
                          ${Array.from({ length: Math.min(a.ppMax, 10) }, (_, i) =>
                            html`<span class="pastille ${i < a.pp ? "pleine" : "vide"}"></span>`
                          )}
                          <span class="pp-chiffres">${a.pp}/${a.ppMax}</span>
                        </span>
                      `}
                  ${editable &&
                  html`<button class="btn-mini" onClick=${() => majAttaque(idx, "pp", Math.max(0, a.pp - 1))} title="Utiliser (−1 PP)">−1 PP</button>`}
                </div>
              `
            )}
          </div>

          ${editable && html`<button class="btn-danger btn-mini btn-relacher" onClick=${relacher}>🌿 Relâcher ce Pokémon</button>`}
        </div>
      `}
    </div>
  `;
}

// ---------- Inventaire ----------

export function Inventaire({ items, editable, onChange }) {
  const maj = (id, champ, valeur) => onChange(items.map((it) => (it.id === id ? { ...it, [champ]: valeur } : it)));
  const supprimer = (id, nom) => {
    if (confirm(`Supprimer "${nom || "cet objet"}" du sac ?`)) {
      onChange(items.filter((it) => it.id !== id));
    }
  };
  const ajouter = () => onChange([...items, emptyInventaireItem()]);

  const parCategorie = CATEGORIES_OBJET.map((cat) => ({ cat, liste: items.filter((it) => it.categorie === cat) })).filter(
    (g) => g.liste.length > 0
  );

  return html`
    <div class="inventaire">
      ${items.length === 0 && html`<p class="texte-vide">Le sac est vide.</p>`}
      ${parCategorie.map(
        (groupe) => html`
          <div class="inventaire-groupe">
            <h4>${groupe.cat}</h4>
            ${groupe.liste.map(
              (it) => html`
                <div class="inventaire-ligne">
                  ${editable
                    ? html`
                        <${ChampTexte} class="inv-nom" value=${it.nom} onCommit=${(v) => maj(it.id, "nom", v)} placeholder="Nom de l'objet" />
                        <div class="stepper">
                          <button class="btn-mini" onClick=${() => maj(it.id, "quantite", Math.max(0, it.quantite - 1))} title="−1">−</button>
                          <input class="inv-qte" type="number" min="0" value=${it.quantite} onInput=${(e) => maj(it.id, "quantite", Math.max(0, +e.target.value || 0))} />
                          <button class="btn-mini" onClick=${() => maj(it.id, "quantite", it.quantite + 1)} title="+1">+</button>
                        </div>
                        <select value=${it.categorie} onChange=${(e) => maj(it.id, "categorie", e.target.value)}>
                          ${CATEGORIES_OBJET.map((c) => html`<option value=${c}>${c}</option>`)}
                        </select>
                        <button class="btn-mini btn-danger" onClick=${() => supprimer(it.id, it.nom)} title="Supprimer">✕</button>
                      `
                    : html`
                        <span class="inv-nom-ro">${it.nom}</span>
                        <div class="stepper lecture">
                          <button class="btn-mini" onClick=${() => maj(it.id, "quantite", Math.max(0, it.quantite - 1))} title="Utiliser 1">−</button>
                          <span class="inv-qte-ro">×${it.quantite}</span>
                          <button class="btn-mini" onClick=${() => maj(it.id, "quantite", it.quantite + 1)} title="+1">+</button>
                        </div>
                      `}
                </div>
              `
            )}
          </div>
        `
      )}
      ${editable && html`<button class="btn-lien" onClick=${ajouter}>+ Ajouter un objet</button>`}
    </div>
  `;
}

// ---------- Pokédex ----------

export function Pokedex({ entries, editable, onChange }) {
  const maj = (id, champ, valeur) => onChange(entries.map((e) => (e.id === id ? { ...e, [champ]: valeur } : e)));
  const supprimer = (id, espece) => {
    if (confirm(`Supprimer l'entrée "${espece || "sans nom"}" du Pokédex ?`)) {
      onChange(entries.filter((e) => e.id !== id));
    }
  };
  const ajouter = () => onChange([...entries, emptyPokedexEntry()]);

  return html`
    <div class="pokedex">
      ${entries.length === 0 && html`<p class="texte-vide">Aucune entrée pour l'instant.</p>`}
      <div class="pokedex-grille">
        ${entries.map(
          (e) => html`
            <div class="pokedex-carte ${e.statutDex === "CAPTURE" ? "capture" : "vu"}">
              <div class="sprite-conteneur petit">
                ${e.sprite ? html`<img src=${e.sprite} class="sprite" />` : html`<div class="sprite sprite-vide"><div class="mini-pokeball"></div></div>`}
              </div>
              ${editable
                ? html`
                    <${ChampTexte} class="pokedex-nom" placeholder="Espèce" value=${e.espece} onCommit=${(v) => maj(e.id, "espece", v)} />
                    <select value=${e.statutDex} onChange=${(ev) => maj(e.id, "statutDex", ev.target.value)}>
                      <option value="VU">👁 Vu</option>
                      <option value="CAPTURE">✅ Capturé</option>
                    </select>
                    <select value=${e.typePrimaire} onChange=${(ev) => maj(e.id, "typePrimaire", ev.target.value)}>
                      ${TYPE_LIST.map((t) => html`<option value=${t}>${t}</option>`)}
                    </select>
                    <${ChampTexte} multiline=${true} placeholder="Description" value=${e.description} onCommit=${(v) => maj(e.id, "description", v)} />
                    <button class="btn-mini btn-danger" onClick=${() => supprimer(e.id)}>✕</button>
                  `
                : html`
                    <div class="pokedex-nom-ro">${e.espece}</div>
                    <${BadgeType} type=${e.typePrimaire} />
                    <span class="pokedex-statut">${e.statutDex === "CAPTURE" ? "✅ Capturé" : "👁 Vu"}</span>
                    <p class="pokedex-desc">${e.description}</p>
                  `}
            </div>
          `
        )}
      </div>
      ${editable && html`<button class="btn-lien" onClick=${ajouter}>+ Ajouter une entrée</button>`}
    </div>
  `;
}

// ---------- Dés — le MJ décide, le joueur lance ----------

function lancerDes(nombreDes, typeDe, modificateur) {
  const faces = parseInt(typeDe.replace("d", ""), 10);
  const resultats = [];
  for (let i = 0; i < nombreDes; i++) resultats.push(1 + Math.floor(Math.random() * faces));
  const total = resultats.reduce((a, b) => a + b, 0) + (modificateur || 0);
  return { resultats, total };
}

export function PanneauDes({ gm, moi, party }) {
  const [journal, setJournal] = useState([]);
  const [demandeEnAttente, setDemandeEnAttente] = useState(null);
  const [cible, setCible] = useState("");
  const [nombreDes, setNombreDes] = useState(1);
  const [typeDe, setTypeDe] = useState("d20");
  const [modificateur, setModificateur] = useState(0);
  const [label, setLabel] = useState("");

  useEffect(() => {
    return onMessageDes((data) => {
      setJournal((j) => [data, ...j].slice(0, 40));
      if (data.type === "demande" && data.cibleId === moi.id) setDemandeEnAttente(data);
      if (data.type === "resultat" && data.cibleId === moi.id) setDemandeEnAttente(null);
    });
  }, [moi.id]);

  const envoyerDemande = () => {
    if (!cible) return;
    const nomCible = cible === moi.id ? moi.name : party.find((p) => p.id === cible)?.name || "Joueur";
    envoyerMessageDes({ type: "demande", cibleId: cible, cibleNom: nomCible, label: label || "Jet de dés", nombreDes, typeDe, modificateur, auteur: moi.name });
  };

  const repondre = () => {
    const { resultats, total } = lancerDes(demandeEnAttente.nombreDes, demandeEnAttente.typeDe, demandeEnAttente.modificateur);
    envoyerMessageDes({ ...demandeEnAttente, type: "resultat", resultats, total, joueur: moi.name });
    setDemandeEnAttente(null);
  };

  return html`
    <div class="panneau-des">
      ${demandeEnAttente &&
      html`
        <div class="carte-demande-de">
          <div>🎲 Le MJ demande : <strong>${demandeEnAttente.label}</strong></div>
          <div>${demandeEnAttente.nombreDes}${demandeEnAttente.typeDe} ${demandeEnAttente.modificateur ? `+ ${demandeEnAttente.modificateur}` : ""}</div>
          <button class="btn btn-envoyer" onClick=${repondre}>Lancer !</button>
        </div>
      `}

      ${gm &&
      html`
        <div class="carte-gm-des">
          <h4>Demander un jet</h4>
          <div class="grille-champs">
            <label>
              Joueur
              <select value=${cible} onChange=${(e) => setCible(e.target.value)}>
                <option value="">—</option>
                <option value=${moi.id}>${moi.name} (moi)</option>
                ${party.map((p) => html`<option value=${p.id}>${p.name}</option>`)}
              </select>
            </label>
            <label>Nb de dés <input type="number" min="1" value=${nombreDes} onInput=${(e) => setNombreDes(Math.max(1, versNombre(e.target.value, 1)))} /></label>
            <label>
              Type de dé
              <select value=${typeDe} onChange=${(e) => setTypeDe(e.target.value)}>
                ${DES_DISPONIBLES.map((d) => html`<option value=${d}>${d}</option>`)}
              </select>
            </label>
            <label>Modificateur <input type="number" value=${modificateur} onInput=${(e) => setModificateur(versNombre(e.target.value, 0))} /></label>
            <label class="pleine-largeur">Intitulé <input placeholder="Jet d'Attaque, Esquive…" value=${label} onInput=${(e) => setLabel(e.target.value)} /></label>
          </div>
          <button class="btn" onClick=${envoyerDemande}>Envoyer la demande</button>
        </div>
      `}

      <div class="journal-des">
        <h4>Journal des jets</h4>
        ${journal.length === 0 && html`<p class="texte-vide">Aucun jet pour le moment.</p>`}
        ${journal.map(
          (m) => html`
            <div class="ligne-journal ${m.type}">
              ${m.type === "demande"
                ? html`<span>🎲 ${m.auteur} → <strong>${m.cibleNom}</strong> : ${m.label} (${m.nombreDes}${m.typeDe}${m.modificateur ? `+${m.modificateur}` : ""})</span>`
                : html`<span>✅ <strong>${m.joueur || m.cibleNom}</strong> — ${m.label} : [${m.resultats.join(", ")}]${m.modificateur ? ` +${m.modificateur}` : ""} = <strong>${m.total}</strong></span>`}
            </div>
          `
        )}
      </div>
    </div>
  `;
}
