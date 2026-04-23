# Optimisation perf debernardi.li — instructions pour session Sonnet

Le site rame sur vieux Windows. Applique les fixes ci-dessous dans l'ordre. Ne change rien d'autre. Les rendus visuels doivent rester identiques sur bon matériel.

## 1. Compresser la photo hero

`assets/photo.png` fait 2.2 MB (PNG 1024×1536). C'est le plus gros coupable.

```bash
cd assets
# Si cwebp pas installé : brew install webp
cwebp -q 80 photo.png -o photo.webp
# Fallback JPEG
sips -s format jpeg -s formatOptions 82 photo.png --out photo.jpg
# Vérifier tailles (attendu : webp ~120KB, jpg ~180KB)
ls -lh photo.*
```

Remplacer dans `index.html` le bloc `<img src="assets/photo.png" ...>` :

```html
<picture>
  <source srcset="assets/photo.webp" type="image/webp">
  <source srcset="assets/photo.jpg" type="image/jpeg">
  <img src="assets/photo.jpg" alt="Tristan Debernardi — COO Genève"
       class="hero-photo" id="heroPhoto"
       fetchpriority="high" decoding="async" width="1024" height="1536">
</picture>
```

## 2. Détection perf + classe `.low-perf`

Ajouter **tout en haut** de `js/main.js`, avant l'init de Lenis :

```js
/* ── 0. PERF DETECTION ────────────────────────────────────── */
(function detectPerf() {
  const heuristic =
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    (navigator.deviceMemory ?? 8) <= 4;

  if (heuristic) {
    document.documentElement.classList.add('low-perf');
  }

  // FPS probe 1s — attrape les iGPU pourris avec beaucoup de cores
  let frames = 0;
  const t0 = performance.now();
  requestAnimationFrame(function tick(t) {
    frames++;
    if (t - t0 < 1000) requestAnimationFrame(tick);
    else if (frames < 45) document.documentElement.classList.add('low-perf');
  });
})();

const LOW_PERF = document.documentElement.classList.contains('low-perf');
```

## 3. Conditionnaliser Lenis, parallax, curseur custom

Dans `js/main.js` :

**Remplacer** le bloc `/* ── 1. LENIS SMOOTH SCROLL ── */` par :

```js
let lenis = null;
gsap.registerPlugin(ScrollTrigger);

if (!LOW_PERF) {
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true, smoothTouch: false, autoRaf: false });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', () => ScrollTrigger.update());
  // NB: supprimer le window.addEventListener('scroll', ...) redondant
}
```

Partout ailleurs où `lenis.stop()` / `lenis.start()` / `lenis.scrollTo(...)` est appelé, wrapper par `if (lenis) { ... }` (burger mobile, modales, ancres smooth scroll).

Pour l'ancre fallback sans Lenis :

```js
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
```

**Curseur custom** : wrapper l'IIFE `initCursor` par `if (!LOW_PERF) initCursor()`.

**Parallax photo** : wrapper le bloc `gsap.to('#heroPhoto', ...)` par `if (!LOW_PERF) { ... }`.

## 4. CSS — désactiver les effets coûteux en low-perf

Ajouter à la fin de `css/style.css` :

```css
/* ── LOW-PERF MODE ────────────────────────────────────────── */
.low-perf body { cursor: auto; }
.low-perf button, .low-perf .btn, .low-perf a,
.low-perf .lang-toggle, .low-perf .nav-burger,
.low-perf .chatbot-toggle, .low-perf .chatbot-close-btn,
.low-perf .chatbot-send, .low-perf .chatbot-input,
.low-perf .tool-modal-close, .low-perf .tool-modal-cta-btn { cursor: pointer; }
.low-perf .chatbot-input { cursor: text; }

.low-perf .cursor-dot,
.low-perf .cursor-ring { display: none !important; }

.low-perf #header.scrolled {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background-color: rgba(11, 15, 42, 0.96);
}

.low-perf .tool-modal-overlay {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(11, 15, 42, 0.92);
}

.low-perf .nav-links.mobile-open {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(11, 15, 42, 0.98);
}

.low-perf .hero-photo { will-change: auto; }
.low-perf .scroll-line-anim { animation: none; opacity: 0.4; }
.low-perf .status-dot { animation: none; }
.low-perf .chat-msg { animation: none; }
```

## 5. Alléger Google Fonts

Dans `index.html`, remplacer la ligne `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond...">` par :

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">
```

(Retiré : italiques Cormorant + poids 300/600 jamais utilisés.)

## 6. Divers petits gains

Dans `css/style.css` :

- Remplacer `transition: all 0.25s var(--ease-out);` (sélecteur `.btn`) par `transition: background 0.25s var(--ease-out), border-color 0.25s var(--ease-out), color 0.25s var(--ease-out), transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);`
- Retirer `will-change: transform` de `.hero-photo` (le parallax est maintenant conditionnel — sans parallax, pas besoin de layer permanent)

## 7. Vérification avant commit

```bash
# Servir localement
cd /Users/tristan/debernardi.li
python3 -m http.server 8000
# Ouvrir http://localhost:8000, tester :
# - DevTools > Performance : scroll doit être lisse, pas de long tasks
# - DevTools > Rendering > "Emulate CPU: 6x slowdown" pour simuler vieux laptop
# - Ajouter manuellement <html class="low-perf"> pour tester le mode dégradé
```

Critères de validation :
- site identique visuellement sur Mac M-series
- pas de curseur custom ni blur en mode `.low-perf`
- photo < 200 KB téléchargés

## 8. Commit & push

```bash
cd /Users/tristan/debernardi.li
git add -A
git status  # vérifier qu'aucun fichier indésirable
git commit -m "perf: optimisations pour matériel bas de gamme

- Compression photo hero (2.2MB PNG → WebP/JPEG ~150KB)
- Détection low-perf (heuristique + FPS probe) → classe .low-perf
- Désactivation Lenis/parallax/curseur custom sur matériel faible
- Suppression backdrop-filter en mode dégradé
- Slim Google Fonts (poids 400/500 uniquement pour Cormorant)
- Fix listener scroll doublé sur ScrollTrigger"
git push origin main
```

Si le push déclenche un déploiement automatique (Vercel/Netlify), attendre le build puis tester https://debernardi.li sur un laptop Windows.
