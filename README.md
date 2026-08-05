# HUD Pokémon — Extensions Owlbear Rodeo (v2)

Owlbear Rodeo ne permet qu'**une seule bulle par manifest**. Pour avoir 3 bulles
distinctes (Fiche, Équipe, Sac & Dés) + les PV/distance sans bulle, ce projet
contient **4 manifests séparés** partageant le même code.

## ⚠️ Ce qui a changé depuis la v1 (corrections de bugs)

- Le SDK était importé en version **2.x** (`@owlbear-rodeo/sdk@2`), alors que
  l'API utilisée est celle de la **v3**. C'était la cause de l'écran vide.
  Corrigé partout → `@owlbear-rodeo/sdk@3.1.0`.
- Un seul gros popover a été éclaté en 3 popovers + 1 module de fond, avec
  gestion d'erreurs visible à l'écran (fini les écrans blancs silencieux).
- Nouveau design façon menus Pokémon **DS** (Diamant/Perle/Platine, N&B).

## 1. Récupérer les fichiers

Remplacez **tout le contenu** de votre dépôt GitHub par celui de ce dossier
(mêmes noms de fichiers, structure identique).

## 2. Vérifier GitHub Pages

Settings → Pages → Source : `Deploy from a branch`, branche `main`, dossier
`/ (root)`. Votre site doit être accessible à :

```
https://forqan95c.github.io/owlbear_pokemon_extension/
```

## 3. Installer les 4 modules dans Owlbear Rodeo

Dans votre profil Owlbear Rodeo → **Extensions** → **Add Extension**, ajoutez
**une par une** ces 4 URL (remplacez le domaine si besoin) :

| Module | URL du manifest | Bulle ? |
| --- | --- | --- |
| 🧑 Fiche Dresseur | `https://forqan95c.github.io/owlbear_pokemon_extension/manifest-fiche.json` | Oui |
| 🔴 Équipe | `https://forqan95c.github.io/owlbear_pokemon_extension/manifest-equipe.json` | Oui |
| 🎒 Sac & Dés | `https://forqan95c.github.io/owlbear_pokemon_extension/manifest-inventaire.json` | Oui |
| ⚙️ Général (PV + distance) | `https://forqan95c.github.io/owlbear_pokemon_extension/manifest-general.json` | Non (fonctionne en fond) |

Activez les 4 dans votre room (liste des extensions de la room). Vous
obtenez 3 bulles en haut à gauge à côté des icônes de joueurs, dans l'ordre
d'installation.

## 4. Utilisation

### 🧑 Bulle Fiche Dresseur
- Le MJ choisit la fiche à afficher en haut (menu déroulant) et peut en créer
  une nouvelle.
- Nom, niveau, rôle, PV du dresseur, portrait (URL d'image).
- **Pokédex** en dessous : espèce, sprite, type, statut Vu/Capturé, description.

### 🔴 Bulle Équipe
- Les 6 emplacements Pokémon. Cliquez sur une carte pour voir/éditer niveau,
  types, statut, **caractéristiques** (Attaque/Défense/Atq.Spé/Déf.Spé/Vitesse)
  et les 4 attaques (dégâts, PP).
- **⚡ Envoyer au combat** place le sprite sur la carte à côté du token du
  dresseur (repéré par son nom).
- **↩ Rappeler** retire le pion de la carte sans toucher à l'équipe.
- **🌿 Relâcher** (dans le détail de la carte) retire définitivement le
  Pokémon, avec confirmation.
- **🖼 Choisir le sprite** ouvre le sélecteur d'images natif d'Owlbear — vous
  devez avoir importé vos sprites (récupérés sur Poképédia/poke5e.app) dans
  votre bibliothèque via l'Asset Manager au préalable.

### 🎒 Bulle Sac & Dés
- Onglet **Sac** : potions, baies, balls, objets tenus, CT/CS, objets clés —
  catégories libres, quantités modifiables.
- Onglet **Dés** : le MJ choisit le joueur, le nombre de dés, le type (d4 à
  d100) et un modificateur, puis envoie la demande. Le joueur ne voit qu'un
  bouton **Lancer !**, impossible de choisir un autre dé. Le résultat
  s'affiche dans le journal, visible de tous.
- Onglet **⚙️** (MJ uniquement) : réglage des mètres par case de grille.

### PV sur la carte (sans bulle, pour tout le monde)
- Clic sur **n'importe quel token** de la couche Personnage/Monture (joueur,
  PNJ, Pokémon envoyé au combat) → icône ❤️ dans le menu contextuel → PV
  actuels/max. Une barre colorée (vert/jaune/rouge) apparaît sous le token et
  le suit dans ses déplacements.

### Distance entre deux entités (sans bulle)
- Barre d'outils de la scène → icône 📏 **Mesurer une distance** → cliquez
  deux tokens (ou deux points) : distance affichée en mètres en notification,
  avec un trait temporaire à l'écran. Réglable via l'onglet ⚙️ de la bulle Sac.

## 5. En cas de souci

- **Bulle blanche/vide** : ouvrez la console du navigateur (F12) dans le
  popover concerné — désormais toute erreur s'affiche aussi directement à
  l'écran au lieu de rester silencieuse.
- **404 sur un manifest** : vérifiez que le chemin ne commence PAS par `/`
  (chemins relatifs uniquement, à cause du sous-dossier `owlbear_pokemon_extension`).
- **Menu ❤️ ou outil 📏 absents** : vérifiez que le module **Général** est
  bien activé dans la room (c'est lui qui les enregistre).

## 6. Limites connues / prochaines étapes

- Les sprites/tiles ne sont pas fournis (droits Nintendo) : à récupérer
  vous-même puis importer dans l'Asset Manager d'Owlbear Rodeo.
- Le Pokédex est vierge au départ, à remplir avec vos joueurs.
- Les maps seront créées ensemble à l'étape suivante.
