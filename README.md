# HUD Pokémon — Extensions Owlbear Rodeo (v2)

Documentation officielle Owlbear : [docs.owlbear.rodeo](https://docs.owlbear.rodeo)

Owlbear Rodeo ne permet qu'**une seule bulle par manifest**. Pour avoir 3 bulles
distinctes (Fiche, Équipe, Sac & Dés) + les PV/distance sans bulle, ce projet
contient **4 manifests séparés** partageant le même code.

## Ce que vous obtenez

| Bulle (ordre d'installation) | Contenu |
| --- | --- |
| 🧑 **Fiche Dresseur** | Nom, niveau, rôle, PV, portrait + **Pokédex** |
| 🔴 **Équipe** | 6 Pokémon : invoquer / rappeler / relâcher, stats, attaques, statuts |
| 🎒 **Sac & Dés** | Potions, baies, objets + **dés contrôlés par le MJ** |
| ⚙️ **Général** (invisible) | Barre de PV sur tout token + outil 📏 distance en mètres |

Design inspiré des menus Pokémon **DS** (Diamant/Perle/Platine, N&B).

## Installation dans Owlbear Rodeo

Profil → **Extensions** → **Add Extension** → collez **une URL de manifest par module**, **dans cet ordre** :

1. Fiche Dresseur  
2. Équipe  
3. Sac & Dés  
4. Général  

Puis activez les 4 dans votre room.

### Netlify (recommandé)

| Module | URL du manifest |
| --- | --- |
| 🧑 Fiche | `https://cool-genie-255ffc.netlify.app/manifest-fiche.json` |
| 🔴 Équipe | `https://cool-genie-255ffc.netlify.app/manifest-equipe.json` |
| 🎒 Sac & Dés | `https://cool-genie-255ffc.netlify.app/manifest-inventaire.json` |
| ⚙️ Général | `https://cool-genie-255ffc.netlify.app/manifest-general.json` |

### GitHub Pages (alternative)

Les manifests à la racine utilisent des chemins `/` (adaptés à Netlify).
Pour GitHub Pages (sous-dossier), utilisez ceux du dossier `manifests-github/` :

| Module | URL du manifest |
| --- | --- |
| 🧑 Fiche | `https://forqan95c.github.io/owlbear_pokemon_extension/manifests-github/manifest-fiche.json` |
| 🔴 Équipe | `https://forqan95c.github.io/owlbear_pokemon_extension/manifests-github/manifest-equipe.json` |
| 🎒 Sac & Dés | `https://forqan95c.github.io/owlbear_pokemon_extension/manifests-github/manifest-inventaire.json` |
| ⚙️ Général | `https://forqan95c.github.io/owlbear_pokemon_extension/manifests-github/manifest-general.json` |

> **Important :** après une mise à jour, supprimez puis réinstallez les extensions
> dans Owlbear (ou changez la version dans le manifest) pour forcer le rechargement.

## Utilisation

### 🧑 Fiche Dresseur
- Le MJ choisit la fiche à afficher (menu déroulant) et peut en créer une nouvelle.
- Pokédex : espèce, sprite, type, statut Vu/Capturé, description.

### 🔴 Équipe
- 6 emplacements. Cliquez sur une carte pour voir/éditer niveau, types, statut,
  caractéristiques et 4 attaques.
- **⚡ Envoyer au combat** place le sprite à côté du token du dresseur.
- **↩ Rappeler** retire le pion sans toucher à l'équipe.
- **🌿 Relâcher** retire définitivement le Pokémon (avec confirmation).
- **🖼 Choisir le sprite** via la bibliothèque d'assets Owlbear.

### 🎒 Sac & Dés
- **Sac** : potions, baies, balls, objets — catégories libres, quantités modifiables.
- **Dés** : le MJ choisit le joueur, le nombre de dés, le type (d4–d100) et le
  modificateur. Le joueur ne voit qu'un bouton **Lancer !**.
- **⚙️** (MJ) : réglage des mètres par case de grille.

### PV sur la carte (sans bulle)
- Clic droit sur un token (Personnage/Monture) → ❤️ **Points de Vie** → barre
  colorée sous le token.

### Distance (sans bulle)
- Barre d'outils → 📏 **Mesurer une distance** → cliquez 2 cibles → distance en mètres.

## Déploiement

### Netlify
Connectez le dépôt GitHub. Le fichier `netlify.toml` publie la racine du projet.
Chaque push sur `main` redéploie automatiquement.

### GitHub Pages
Settings → Pages → branche `main`, dossier `/ (root)`.

## En cas de souci

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `ERR_NAME_NOT_RESOLVED` … `.appinventaire.html` | Chemin relatif mal résolu par Owlbear | Utilisez les manifests Netlify (`/inventaire.html`) ou ceux de `manifests-github/` |
| Bulle blanche/vide | Erreur JS | Console F12 dans le popover — l'erreur s'affiche aussi à l'écran |
| Menu ❤️ ou 📏 absent | Module Général non activé | Installez et activez `manifest-general.json` |
| Sprites manquants | Non fournis (droits Nintendo) | Importez vos sprites via l'Asset Manager Owlbear |

## Prochaines étapes

- Sprites/tiles à importer vous-même (Poképédia, poke5e.app).
- Pokédex vierge au départ, à remplir en jeu.
- Création des maps ensemble.
