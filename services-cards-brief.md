# Brief — Cartes services cliquables

Document de spec pour intégrer 4 cartes-modales sur la section `#services` du site `debernardi.li`.

---

## Contexte

Le site existe déjà (HTML/CSS/JS vanilla, GSAP, Lenis). Section concernée : `#services` dans `index.html`. Une modale générique existe déjà dans le code pour les tags interactifs (`#toolModalOverlay` / `.tool-modal`) — voir le système `data-modal` utilisé sur les tags `Agents IA` et `INTJ`. **Réutiliser ce système** plutôt que d'en créer un nouveau.

Site bilingue FR/EN avec attributs `data-fr` / `data-en`. Tout contenu ajouté doit avoir les deux langues.

---

## Comportement attendu

1. Chacune des 4 cartes `.service-card` devient cliquable (clavier + souris, accessibilité conforme — `role="button"`, `tabindex="0"`, `aria-haspopup="dialog"`).
2. Le clic ouvre la modale existante avec le contenu de la carte concernée.
3. La modale contient en bas un **CTA visible** : *"Prendre un RDV de 20 min en ligne"* → lien Google Agenda (URL à fournir plus tard, mettre `href="#"` en placeholder avec un commentaire `<!-- TODO: lien Calendly/Google Calendar -->`).
4. Indicateur visuel sur la carte que c'est cliquable (curseur, micro-animation hover, ou petite flèche/icône — au choix, rester sobre).

---

## Contenu des 4 cartes (FR)

Structure identique pour chaque carte : Promesse → Quand m'appeler → Ce que je livre → Format → Phrase de désamorçage tarif.

La phrase de désamorçage tarif doit être visuellement distincte (italique, plus petite, couleur atténuée — au choix mais cohérent entre les 4 cartes).

---

### 1. Audit opérationnel

**Promesse** — En 3 semaines, vous saurez exactement ce qui vous coûte du temps, de l'argent, et pourquoi.

**Quand m'appeler**
- Vous sentez que ça frotte mais vous ne savez pas où
- Votre équipe court après les urgences au lieu d'avancer
- Vous voulez recruter ou structurer et vous ne savez pas par quoi commencer
- Vos chiffres ne reflètent pas ce que vous percevez du terrain

**Ce que je livre**
- Cartographie des process critiques — la vraie, pas celle du PowerPoint RH
- Liste priorisée des blocages, avec impact estimé (CHF, heures, risque)
- Plan d'action 90 jours : quoi faire, dans quel ordre, par qui
- Un debrief oral d'1h avec les décideurs, sans jargon

**Format** — 2 à 4 semaines · interviews, observation terrain, lecture data · forfait défini en amont

*Pas un audit à CHF 30 000 qui finit dans un tiroir.*

---

### 2. Structuration

**Promesse** — Vos opérations tournent sans dépendre de vous ni d'une personne-clé.

**Quand m'appeler**
- Tout repose sur 1 ou 2 personnes (vous compris)
- Chaque nouveau collaborateur met 3 mois à être opérationnel
- Vous refaites les mêmes erreurs à chaque cycle ou projet
- Vous préparez une levée, une certification, ou une cession

**Ce que je livre**
- SOPs des process critiques, écrits pour être *suivis*, pas archivés
- Cartographie RACI : qui décide, qui exécute, qui est informé
- Modèle de gouvernance opérationnelle (rituels, KPIs, cadence)
- Documentation onboarding réutilisable

**Format** — 4 à 12 semaines selon le périmètre · sur site et asynchrone · forfait ou temps partagé

*Pas un mandat à CHF 80 000 chez un cabinet pour livrer un classeur de SOPs que personne n'ouvrira.*

---

### 3. Intégration IA & Automatisation

**Promesse** — Ce qui peut être automatisé l'est. Ce qui doit rester humain est protégé.

**Quand m'appeler**
- Vous saisissez la même donnée dans 3 outils différents
- Vous payez du temps qualifié à faire du copier-coller
- Vous voulez "faire de l'IA" mais ne savez pas par quel bout prendre
- Vos outils existent mais ne se parlent pas

**Ce que je livre**
- Cartographie des flux automatisables et estimation du ROI réel
- Workflows opérationnels (n8n / Make), déployés et documentés
- Agents IA configurés sur vos cas d'usage : support, qualification, reporting…
- Connexions CRM / ERP / outils internes
- Transfert de compétences pour que ça vive sans moi

**Format** — Sprint de 2 à 6 semaines par cas d'usage · forfait par workflow

*Du sur-mesure, pas un outil générique rigide à CHF 300/mois plus CHF 2 000 de formation inutile.*

---

### 4. Présence digitale

**Promesse** — Un site et des outils en ligne qui font le travail à votre place : capter, qualifier, convertir.

**Quand m'appeler**
- Votre site est joli mais ne convertit pas
- Vous n'avez pas de site, ou un site qui fait honte à votre offre
- Vous voulez un outil web sur mesure (calculateur, formulaire, espace client) sans payer une agence
- Votre image en ligne ne reflète plus ce que vous êtes devenu

**Ce que je livre**
- Site web rapide, propre, multilingue (comme celui-ci)
- Outils en ligne sur mesure : formulaires intelligents, calculateurs, mini-apps
- Stratégie de présence : SEO de base, positionnement, contenus prioritaires
- Intégration avec vos outils (CRM, agenda, paiement)

**Format** — 2 à 8 semaines selon ambition · forfait projet

*Pas CHF 5 000 pour une vitrine WordPress que vous ne pourrez plus toucher seul.*

---

## CTA modale (identique sur les 4)

Texte : **"Prendre un RDV de 20 min en ligne"** (FR) / **"Book a 20-min online meeting"** (EN)

Style : bouton primaire visible, en bas de modale, séparé du contenu par un peu d'espace ou un divider léger.

URL : placeholder `href="#"` avec commentaire HTML `<!-- TODO: lien Google Calendar à fournir -->`.

---

## Notes pour le développement

- **Réutiliser** la modale existante (`#toolModalOverlay`) — adapter si besoin pour accueillir un contenu plus long et un CTA en pied. Ne pas créer une seconde modale.
- **Adopter la convention `data-modal`** déjà en place sur les tags interactifs : ajouter `data-modal="audit" / "structuration" / "automatisation" / "digital"` sur chaque `.service-card`.
- **Contenu modale** : à stocker côté JS (objet `serviceModals` dans `js/main.js`) plutôt qu'en dur dans le HTML, pour rester cohérent avec le pattern actuel des modales.
- **Bilingue** : suivre rigoureusement le pattern `data-fr` / `data-en` du reste du site. Traductions EN à produire (rester aussi direct et anti-jargon que la VF — ne pas adoucir la phrase de désamorçage tarif).
- **Accessibilité** : focus trap dans la modale, `Escape` pour fermer, focus restitué à la carte d'origine après fermeture (le système existant le fait déjà — vérifier).
- **Mobile** : la modale doit être lisible et scrollable sur petit écran. CTA collé en bas (sticky) si la modale dépasse la hauteur du viewport.
- **Animation** : rester dans le ton du site (transitions douces, pas de pop agressif). Réutiliser les transitions de `tool-modal` existante.

---

## Hors scope (à traiter plus tard)

- Lien réel du Google Calendar (le user fournira)
- Tracking analytics sur les ouvertures de modales / clics CTA
- A/B test sur les phrases de désamorçage
