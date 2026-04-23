/* ============================================================
   main.js — debernardi.li
   GSAP + Lenis + Custom cursor + Language toggle + Chatbot demo
   ============================================================ */

'use strict';

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

/* ── 1. LENIS SMOOTH SCROLL ─────────────────────────────── */
let lenis = null;
gsap.registerPlugin(ScrollTrigger);

if (!LOW_PERF) {
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true, smoothTouch: false, autoRaf: false });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', () => ScrollTrigger.update());
}

/* ── 2. CUSTOM CURSOR ───────────────────────────────────── */
if (!LOW_PERF) (function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  // Only on pointer devices
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let mx = -100, my = -100;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    gsap.to(dot,  { x: mx, y: my, duration: 0.08, ease: 'none' });
    gsap.to(ring, { x: mx, y: my, duration: 0.28, ease: 'none' });
  });

  document.addEventListener('mouseleave', () => {
    gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
  });

  const hoverable = 'a, button, .service-card, .tool-tag, .footer-link';
  document.querySelectorAll(hoverable).forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('hover');
      ring.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('hover');
      ring.classList.remove('hover');
    });
  });
})();

/* ── 3. HEADER SCROLL BEHAVIOUR ─────────────────────────── */
const header = document.getElementById('header');

ScrollTrigger.create({
  start: 'top -80',
  onEnter: ()  => header.classList.add('scrolled'),
  onLeaveBack: () => header.classList.remove('scrolled'),
});

/* ── 4. HERO INTRO ANIMATION ────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const tl = gsap.timeline({ delay: 0.15 });

  tl.to('.hero-eyebrow', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
  })
  .to('.hero-name-line', {
    opacity: 1, y: 0, duration: 1,
    ease: 'power3.out', stagger: 0.12,
  }, '-=0.35')
  .to('.hero-tagline', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
  }, '-=0.5')
  .to('.hero-ctas', {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
  }, '-=0.45')
  .to('.hero-scroll-hint', {
    opacity: 1, duration: 0.5,
  }, '-=0.2');
});

/* ── 5. HERO PHOTO PARALLAX ─────────────────────────────── */
if (!LOW_PERF) {
  gsap.to('#heroPhoto', {
    yPercent: -18,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ── 6. SCROLL REVEAL ANIMATIONS ────────────────────────── */
// Signal to CSS that JS is active, enabling the hidden→visible transitions.
// This pattern ensures content is ALWAYS visible even without JS.
document.documentElement.classList.add('js-ready');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

/* ── 7. MOBILE NAV ──────────────────────────────────────── */
const burger   = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('mobile-open');
  burger.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', isOpen);
  if (lenis) { isOpen ? lenis.stop() : lenis.start(); }
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('mobile-open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
    if (lenis) lenis.start();
  });
});

/* ── 8. NAV ACTIVE STATE ────────────────────────────────── */
const sections = document.querySelectorAll('section[id], footer[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => navObserver.observe(s));

/* ── 9. LANGUAGE TOGGLE ──────────────────────────────────── */
let currentLang = 'fr';

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  document.querySelectorAll('[data-fr][data-en]').forEach(el => {
    const val = el.getAttribute(`data-${lang}`);
    if (!val) return;
    // Use innerHTML for strings containing HTML tags
    if (val.includes('<')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });

  // Update input placeholders
  document.querySelectorAll('[data-placeholder-fr]').forEach(el => {
    el.placeholder = el.getAttribute(`data-placeholder-${lang}`) || '';
  });

  // Toggle button text
  document.getElementById('langToggle').textContent = lang === 'fr' ? 'EN' : 'FR';

  // Reset chatbot greeting in new language
  syncChatbotGreeting(lang);
}

document.getElementById('langToggle').addEventListener('click', () => {
  setLanguage(currentLang === 'fr' ? 'en' : 'fr');
});

/* ── 10. CHATBOT (DEMO MODE) ─────────────────────────────── */

// Response bank — keyword-scored matching
const chatData = {
  fr: [
    {
      kw: ['bonjour', 'salut', 'bonsoir', 'hello', 'hi', 'hey', 'coucou'],
      r: "Bonjour ! Je suis l'assistant de Tristan. Posez-moi une question sur son parcours, ses services ou comment le contacter — je connais tout sur lui.",
    },
    {
      kw: ['evo360', 'ev360', 'groupe santé', 'multi-site', 'multisite'],
      r: "evo360, c'est le projet phare de Tristan (2024-2026). Il a co-construit un groupe multi-sites santé from scratch : 4 personnes au départ, 15 à l'arrivée, P&L à CHF 1.4M. Il a piloté la transformation digitale complète — ERP Medionline, CRM, automatisation, infrastructure IT. C'est exactement ce qu'il peut faire pour vous.",
    },
    {
      kw: ['farah', 'clinic', 'clinique'],
      r: "Farah Clinic, c'est une structure que Tristan a co-fondée. Il y gère la gouvernance et la conformité réglementaire — dans le secteur médical, il n'y a pas de place pour l'à-peu-près.",
    },
    {
      kw: ['antigel', 'festival', 'événement'],
      r: "Festival Antigel — le plus grand festival de Genève. Tristan en a géré les opérations pendant 5 éditions : 50 000+ participants, 100+ événements sur 40+ sites. Coordonner ça sans couac, c'est de l'ops à haut niveau.",
    },
    {
      kw: ['ef education', 'education first', 'ef '],
      r: "Chez EF Education First, Tristan a généré +28% de croissance commerciale en moins d'un an. Une belle démonstration de sa capacité à produire des résultats rapidement dans un nouveau contexte.",
    },
    {
      kw: ['service', 'offre', 'freelance', 'propose', 'interviens', 'missions', 'aide', 'besoin'],
      r: "Tristan intervient sur 4 axes :\n\n1. Audit opérationnel — identifier précisément ce qui bloque\n2. Structuration — SOP, workflows, gouvernance\n3. IA & automatisation — n8n, Make, agents Claude, intégrations CRM/ERP\n4. Présence digitale — sites web, outils en ligne\n\nEn résumé : il entre dans votre organisation et il la fait tourner mieux.",
    },
    {
      kw: ['contact', 'joindre', 'appeler', 'email', 'mail', 'whatsapp', 'linkedin', 'téléphone', 'écrire'],
      r: "Pour contacter Tristan :\n\n📧 tristan@debernardi.li\n💬 WhatsApp : +41 79 391 97 03\n💼 LinkedIn : linkedin.com/in/tdebernardi\n\nIl répond vite.",
    },
    {
      kw: ['cv', 'formation', 'études', 'diplôme', 'université', 'hult', 'école', 'académique'],
      r: "Tristan a un parcours académique atypique : Certificate en Change Management à Ashridge (UK), MSc International Business à Hult (Dubaï), BSc Finance à l'IAE Savoie Mont Blanc (Annecy). Ce mix explique sa polyvalence.",
    },
    {
      kw: ['ia', 'intelligence artificielle', 'automatisation', 'n8n', 'make', 'claude', 'bot', 'agent', 'chatbot', 'vapi', 'botpress'],
      r: "L'IA et l'automatisation, c'est l'un des axes forts de Tristan. Il maîtrise n8n, Make, Claude (Anthropic), Botpress, Vapi. Il intègre ces outils dans des process réels — ce chatbot en est une démonstration directe.",
    },
    {
      kw: ['genève', 'suisse', 'localisation', 'basé', 'lieu', 'déplacement', 'remote'],
      r: "Tristan est basé à Genève. Il intervient principalement en Suisse romande mais peut travailler à distance ou se déplacer selon les projets.",
    },
    {
      kw: ['tarif', 'prix', 'coût', 'combien', 'tjm', 'journée', 'honoraires', 'facturation'],
      r: "Pour les tarifs, Tristan préfère en discuter directement selon la mission — durée, périmètre, modalités. Contactez-le à tristan@debernardi.li pour une conversation.",
    },
    {
      kw: ['intj', 'personnalité', 'mbti', 'profil', 'type'],
      r: "INTJ — L'Architecte. Stratégique, direct, orienté solutions, allergique aux inefficacités. C'est exactement le profil dont vous avez besoin quand quelque chose coince dans votre organisation.",
    },
    {
      kw: ['langue', 'anglais', 'français', 'italien', 'bilingue', 'international'],
      r: "Tristan est bilingue français/anglais (C1) et parle l'italien (B1). Il peut intervenir dans des environnements internationaux sans difficulté.",
    },
    {
      kw: ['disponible', 'disponibilité', 'quand', 'agenda', 'planning', 'commencer'],
      r: "Pour la disponibilité, le mieux est de contacter Tristan directement : tristan@debernardi.li ou WhatsApp +41 79 391 97 03. Il répondra rapidement.",
    },
    {
      kw: ['odoo', 'sap', 'erp', 'medionline', 'crm', 'asana', 'notion', 'airtable'],
      r: "Tristan travaille avec Odoo, SAP, Medionline côté ERP, et configure des CRM selon les besoins. Pour la gestion de projet, il maîtrise Asana, Notion et Airtable. Il choisit les outils en fonction de la maturité de l'organisation, pas l'inverse.",
    },
  ],
  en: [
    {
      kw: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'bonjour'],
      r: "Hi! I'm Tristan's assistant. Ask me anything about his background, services, or how to get in touch — I know everything about him.",
    },
    {
      kw: ['evo360', 'healthcare group', 'multi-site'],
      r: "evo360 is Tristan's flagship project (2024-2026). He co-built a multi-site healthcare group from scratch: 4 people to 15, P&L of CHF 1.4M. He led the full digital transformation — Medionline ERP, CRM, automation, IT infrastructure. That's exactly what he can do for you.",
    },
    {
      kw: ['farah', 'clinic'],
      r: "Farah Clinic is a company Tristan co-founded. He handles governance and regulatory compliance — in the medical sector, there's no room for approximation.",
    },
    {
      kw: ['antigel', 'festival', 'event'],
      r: "Festival Antigel — Geneva's largest festival. Tristan managed operations for 5 full editions: 50,000+ attendees, 100+ events across 40+ venues. Running that without hiccups is serious operations management.",
    },
    {
      kw: ['ef education', 'education first'],
      r: "At EF Education First, Tristan delivered +28% commercial growth in under a year. A clear demonstration of his ability to produce results quickly in a new context.",
    },
    {
      kw: ['service', 'offer', 'freelance', 'do', 'help', 'mission', 'need'],
      r: "Tristan works across 4 areas:\n\n1. Operational audit — identifying precisely what's blocking\n2. Structuring — SOPs, workflows, governance\n3. AI & automation — n8n, Make, Claude agents, CRM/ERP integrations\n4. Digital presence — websites, online tools\n\nShort version: he steps into your organisation and makes it run better.",
    },
    {
      kw: ['contact', 'reach', 'call', 'email', 'whatsapp', 'linkedin', 'phone', 'write'],
      r: "To contact Tristan:\n\n📧 tristan@debernardi.li\n💬 WhatsApp: +41 79 391 97 03\n💼 LinkedIn: linkedin.com/in/tdebernardi\n\nHe gets back quickly.",
    },
    {
      kw: ['cv', 'resume', 'education', 'degree', 'hult', 'university', 'school', 'academic'],
      r: "Tristan has an unconventional academic background: Change Management Certificate from Ashridge (UK), MSc International Business at Hult (Dubai), BSc Finance at IAE Savoie Mont Blanc (Annecy). That mix explains his versatility.",
    },
    {
      kw: ['ai', 'automation', 'n8n', 'make', 'claude', 'bot', 'agent', 'chatbot', 'vapi', 'botpress'],
      r: "AI and automation is one of Tristan's strengths. He works with n8n, Make, Claude (Anthropic), Botpress, and Vapi. He integrates these tools into real processes — this chatbot is a live demonstration.",
    },
    {
      kw: ['geneva', 'switzerland', 'location', 'based', 'travel', 'remote'],
      r: "Tristan is based in Geneva. He mainly works in French-speaking Switzerland but can work remotely or travel depending on the project.",
    },
    {
      kw: ['rate', 'price', 'cost', 'fee', 'day rate', 'how much', 'invoice'],
      r: "For rates, Tristan prefers to discuss directly based on the mission — duration, scope, modality. Contact him at tristan@debernardi.li for that conversation.",
    },
    {
      kw: ['intj', 'personality', 'mbti', 'profile', 'type'],
      r: "INTJ — The Architect. Strategic, direct, solutions-focused, allergic to inefficiency. Exactly the profile you need when something is broken in your organisation.",
    },
    {
      kw: ['language', 'french', 'english', 'italian', 'bilingual', 'international'],
      r: "Tristan is bilingual in French/English (C1) and speaks Italian (B1). He can work in international environments without issues.",
    },
    {
      kw: ['available', 'availability', 'when', 'schedule', 'start'],
      r: "For availability, the best is to contact Tristan directly: tristan@debernardi.li or WhatsApp +41 79 391 97 03. He'll respond quickly.",
    },
    {
      kw: ['odoo', 'sap', 'erp', 'medionline', 'crm', 'asana', 'notion', 'airtable'],
      r: "Tristan works with Odoo, SAP, and Medionline on the ERP side, and configures CRMs as needed. For project management he uses Asana, Notion, and Airtable. He picks tools based on the organisation's maturity — not the other way around.",
    },
  ],
};

const fallback = {
  fr: "Bonne question. Pour une réponse précise sur ce point, contactez Tristan directement à tristan@debernardi.li ou sur WhatsApp. Il répondra vite.",
  en: "Good question. For a precise answer on that, contact Tristan directly at tristan@debernardi.li or via WhatsApp. He gets back quickly.",
};

function getResponse(input, lang) {
  const q = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const bank = chatData[lang] || chatData.fr;
  let best = null, bestScore = 0;

  for (const item of bank) {
    let score = 0;
    for (const kw of item.kw) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }

  return best && bestScore > 0 ? best.r : fallback[lang];
}

// Chatbot DOM refs
const widget       = document.getElementById('chatbotWidget');
const toggleBtn    = document.getElementById('chatbotToggle');
const panel        = document.getElementById('chatbotPanel');
const closeBtn     = document.getElementById('chatbotClose');
const messages     = document.getElementById('chatbotMessages');
const form         = document.getElementById('chatbotForm');
const input        = document.getElementById('chatbotInput');
const openChatBtn  = document.getElementById('openChat');

let chatOpen = false;

function openChat() {
  chatOpen = true;
  widget.classList.add('open');
  setTimeout(() => input.focus(), 350);
}

function closeChat() {
  chatOpen = false;
  widget.classList.remove('open');
}

toggleBtn.addEventListener('click', () => chatOpen ? closeChat() : openChat());
closeBtn.addEventListener('click', closeChat);
if (openChatBtn) openChatBtn.addEventListener('click', openChat);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatOpen) closeChat();
});

function addMessage(text, isUser = false) {
  const wrap = document.createElement('div');
  wrap.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
  const p = document.createElement('p');
  // Safely render newlines and plain text
  p.innerHTML = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br>');
  // Re-allow emoji (they're safe plain text)
  p.innerHTML = p.innerHTML.replace(/📧|💬|💼/g, m => m);
  wrap.appendChild(p);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg bot-msg';
  wrap.id = 'typingWrap';
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  wrap.appendChild(dots);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
  document.getElementById('typingWrap')?.remove();
}

// Conversation history for multi-turn context
const chatHistory = [];

async function handleSend() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage(text, true);
  showTyping();

  chatHistory.push({ role: 'user', content: text });

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory }),
    });

    if (!res.ok) throw new Error('API error');

    const data = await res.json();
    const reply = data.reply;

    chatHistory.push({ role: 'assistant', content: reply });
    hideTyping();
    addMessage(reply);

  } catch (err) {
    // Fallback to keyword matcher if API unavailable
    hideTyping();
    addMessage(getResponse(text, currentLang));
  }
}

form.addEventListener('submit', (e) => { e.preventDefault(); handleSend(); });

function syncChatbotGreeting(lang) {
  // Update first bot message text to match language
  const firstMsg = messages.querySelector('.bot-msg p');
  if (!firstMsg) return;
  const val = firstMsg.getAttribute(`data-${lang}`);
  if (val) firstMsg.textContent = val;
}

/* ── 11. TOOL MODAL ──────────────────────────────────────── */

/* Service modal content — stored in JS, follows data-fr/data-en convention */
const serviceModals = {
  fr: {
    audit: {
      label: 'Audit opérationnel',
      title: 'En 3 semaines, vous saurez exactement ce qui vous coûte du temps, de l\'argent, et pourquoi.',
      whenLabel: 'Quand m\'appeler',
      when: [
        'Vous sentez que ça frotte mais vous ne savez pas où',
        'Votre équipe court après les urgences au lieu d\'avancer',
        'Vous voulez recruter ou structurer et vous ne savez pas par quoi commencer',
        'Vos chiffres ne reflètent pas ce que vous percevez du terrain',
      ],
      deliversLabel: 'Ce que je livre',
      delivers: [
        'Cartographie des process critiques — la vraie, pas celle du PowerPoint RH',
        'Liste priorisée des blocages, avec impact estimé (CHF, heures, risque)',
        'Plan d\'action 90 jours : quoi faire, dans quel ordre, par qui',
        'Un debrief oral d\'1h avec les décideurs, sans jargon',
      ],
      format: '2 à 4 semaines · interviews, observation terrain, lecture data · forfait défini en amont',
      price: 'Pas un audit à CHF 30 000 qui finit dans un tiroir.',
      cta: 'Prendre un RDV de 20 min en ligne',
    },
    structuration: {
      label: 'Structuration',
      title: 'Vos opérations tournent sans dépendre de vous ni d\'une personne-clé.',
      whenLabel: 'Quand m\'appeler',
      when: [
        'Tout repose sur 1 ou 2 personnes (vous compris)',
        'Chaque nouveau collaborateur met 3 mois à être opérationnel',
        'Vous refaites les mêmes erreurs à chaque cycle ou projet',
        'Vous préparez une levée, une certification, ou une cession',
      ],
      deliversLabel: 'Ce que je livre',
      delivers: [
        'SOPs des process critiques, écrits pour être suivis, pas archivés',
        'Cartographie RACI : qui décide, qui exécute, qui est informé',
        'Modèle de gouvernance opérationnelle (rituels, KPIs, cadence)',
        'Documentation onboarding réutilisable',
      ],
      format: '4 à 12 semaines selon le périmètre · sur site et asynchrone · forfait ou temps partagé',
      price: 'Pas un mandat à CHF 80 000 chez un cabinet pour livrer un classeur de SOPs que personne n\'ouvrira.',
      cta: 'Prendre un RDV de 20 min en ligne',
    },
    automatisation: {
      label: 'Intégration IA & Automatisation',
      title: 'Ce qui peut être automatisé l\'est. Ce qui doit rester humain est protégé.',
      whenLabel: 'Quand m\'appeler',
      when: [
        'Vous saisissez la même donnée dans 3 outils différents',
        'Vous payez du temps qualifié à faire du copier-coller',
        'Vous voulez « faire de l\'IA » mais ne savez pas par quel bout prendre',
        'Vos outils existent mais ne se parlent pas',
      ],
      deliversLabel: 'Ce que je livre',
      delivers: [
        'Cartographie des flux automatisables et estimation du ROI réel',
        'Workflows opérationnels (n8n / Make), déployés et documentés',
        'Agents IA configurés sur vos cas d\'usage : support, qualification, reporting…',
        'Connexions CRM / ERP / outils internes',
        'Transfert de compétences pour que ça vive sans moi',
      ],
      format: 'Sprint de 2 à 6 semaines par cas d\'usage · forfait par workflow',
      price: 'Du sur-mesure, pas un outil générique rigide à CHF 300/mois plus CHF 2 000 de formation inutile.',
      cta: 'Prendre un RDV de 20 min en ligne',
    },
    digital: {
      label: 'Présence digitale',
      title: 'Un site et des outils en ligne qui font le travail à votre place : capter, qualifier, convertir.',
      whenLabel: 'Quand m\'appeler',
      when: [
        'Votre site est joli mais ne convertit pas',
        'Vous n\'avez pas de site, ou un site qui fait honte à votre offre',
        'Vous voulez un outil web sur mesure (calculateur, formulaire, espace client) sans payer une agence',
        'Votre image en ligne ne reflète plus ce que vous êtes devenu',
      ],
      deliversLabel: 'Ce que je livre',
      delivers: [
        'Site web rapide, propre, multilingue (comme celui-ci)',
        'Outils en ligne sur mesure : formulaires intelligents, calculateurs, mini-apps',
        'Stratégie de présence : SEO de base, positionnement, contenus prioritaires',
        'Intégration avec vos outils (CRM, agenda, paiement)',
      ],
      format: '2 à 8 semaines selon ambition · forfait projet',
      price: 'Pas CHF 5 000 pour une vitrine WordPress que vous ne pourrez plus toucher seul.',
      cta: 'Prendre un RDV de 20 min en ligne',
    },
  },
  en: {
    audit: {
      label: 'Operational Audit',
      title: 'In 3 weeks, you\'ll know exactly what\'s costing you time, money, and why.',
      whenLabel: 'When to call me',
      when: [
        'You sense friction but can\'t pinpoint where',
        'Your team is firefighting instead of moving forward',
        'You want to hire or scale but don\'t know where to start',
        'Your numbers don\'t match what you see on the ground',
      ],
      deliversLabel: 'What I deliver',
      delivers: [
        'Critical process mapping — the real one, not the HR PowerPoint version',
        'Prioritised list of blockers with estimated impact (CHF, hours, risk)',
        '90-day action plan: what to do, in what order, by whom',
        'A 1-hour verbal debrief with decision-makers, jargon-free',
      ],
      format: '2 to 4 weeks · interviews, field observation, data review · fixed fee agreed upfront',
      price: 'Not a CHF 30,000 audit that ends up in a drawer.',
      cta: 'Book a 20-min online meeting',
    },
    structuration: {
      label: 'Structuring',
      title: 'Your operations run without depending on you or any single person.',
      whenLabel: 'When to call me',
      when: [
        'Everything relies on 1 or 2 people (including you)',
        'Every new hire takes 3 months to become productive',
        'You repeat the same mistakes every cycle or project',
        'You\'re preparing a fundraise, a certification, or a sale',
      ],
      deliversLabel: 'What I deliver',
      delivers: [
        'SOPs for critical processes, written to be followed — not archived',
        'RACI mapping: who decides, who executes, who is informed',
        'Operational governance model (rituals, KPIs, cadence)',
        'Reusable onboarding documentation',
      ],
      format: '4 to 12 weeks depending on scope · on-site and async · fixed fee or fractional',
      price: 'Not a CHF 80,000 consultancy mandate to deliver a binder of SOPs nobody opens.',
      cta: 'Book a 20-min online meeting',
    },
    automatisation: {
      label: 'AI & Automation Integration',
      title: 'What can be automated is. What must stay human is protected.',
      whenLabel: 'When to call me',
      when: [
        'You\'re entering the same data into 3 different tools',
        'You\'re paying skilled people to copy and paste',
        'You want to "do AI" but don\'t know where to start',
        'Your tools exist but don\'t talk to each other',
      ],
      deliversLabel: 'What I deliver',
      delivers: [
        'Mapping of automatable flows and realistic ROI estimates',
        'Operational workflows (n8n / Make), deployed and documented',
        'AI agents configured for your use cases: support, qualification, reporting…',
        'CRM / ERP / internal tool integrations',
        'Knowledge transfer so it lives on without me',
      ],
      format: '2 to 6-week sprint per use case · fixed fee per workflow',
      price: 'Custom-built, not a rigid generic tool at CHF 300/month plus CHF 2,000 in pointless training.',
      cta: 'Book a 20-min online meeting',
    },
    digital: {
      label: 'Digital Presence',
      title: 'A website and online tools that do the work for you: capture, qualify, convert.',
      whenLabel: 'When to call me',
      when: [
        'Your site looks good but doesn\'t convert',
        'You don\'t have a site, or one that undersells your offer',
        'You want a custom web tool (calculator, form, client portal) without paying an agency',
        'Your online image no longer reflects who you\'ve become',
      ],
      deliversLabel: 'What I deliver',
      delivers: [
        'Fast, clean, multilingual website (like this one)',
        'Custom online tools: smart forms, calculators, mini-apps',
        'Presence strategy: basic SEO, positioning, priority content',
        'Integration with your tools (CRM, calendar, payment)',
      ],
      format: '2 to 8 weeks depending on scope · fixed project fee',
      price: 'Not CHF 5,000 for a WordPress showcase you can\'t touch on your own.',
      cta: 'Book a 20-min online meeting',
    },
  },
};

const toolModalData = {
  fr: {
    'agents-ia': {
      label: 'IA & Automatisation',
      title: 'Agents IA sur mesure',
      items: [
        'Tri et classification automatique de documents — contrats, factures, dossiers médicaux organisés sans intervention humaine',
        'Plateforme de réception et archivage automatisé — emails, formulaires et pièces jointes traités et rangés dès réception',
        'Scraping web avec actions concrètes — veille concurrentielle, extraction de données structurées, alertes en temps réel',
        'Agents de support et de qualification — réponses à la FAQ, tri de leads, prise de rendez-vous, réponses automatiques',
        'Workflows intelligents sur mesure — si votre organisation répète quelque chose, un agent peut s\'en charger'
      ]
    },
    'intj': {
      label: 'Profil Myers-Briggs',
      title: 'INTJ — L\'Architecte',
      items: [
        'Stratégique et orienté systèmes : conçoit des structures qui résolvent le bon problème, pas juste le plus visible',
        'Direct et factuel : allergique à la bureaucratie gratuite, aux réunions sans décision et aux objectifs flous',
        'Fonctionne mieux avec un problème clair et une latitude d\'action — pas de micro-management',
        'Pose toujours « pourquoi » avant « comment » : si le process ne sert pas l\'objectif, il change le process'
      ]
    }
  },
  en: {
    'agents-ia': {
      label: 'AI & Automation',
      title: 'Custom AI Agents',
      items: [
        'Automatic document sorting and classification — contracts, invoices, medical files organised without human intervention',
        'Automated reception and archiving platform — emails, forms, and attachments processed and filed on receipt',
        'Web scraping with concrete actions — competitive monitoring, structured data extraction, real-time alerts',
        'Support and qualification agents — FAQ responses, lead triage, appointment scheduling, automated replies',
        'Custom intelligent workflows — if your organisation repeats something, an agent can handle it'
      ]
    },
    'intj': {
      label: 'Myers-Briggs Profile',
      title: 'INTJ — The Architect',
      items: [
        'Strategic and systems-oriented: builds structures that solve the right problem, not just the obvious one',
        'Direct and factual: allergic to pointless bureaucracy, decision-free meetings, and vague goals',
        'Works best with a clear problem and room to act — no micromanagement',
        'Always asks \'why\' before \'how\': if the process doesn\'t serve the goal, change the process'
      ]
    }
  }
};

const toolModalOverlay = document.getElementById('toolModalOverlay');
const toolModalEl      = document.getElementById('toolModal');
const toolModalClose   = document.getElementById('toolModalClose');
const toolModalLabel   = document.getElementById('toolModalLabel');
const toolModalTitle   = document.getElementById('toolModalTitle');
const toolModalBody    = document.getElementById('toolModalBody');
const toolModalCta     = document.getElementById('toolModalCta');

let lastFocusedBeforeModal = null;

function openToolModal(id) {
  // Try service modal first, fall back to tool modal data
  const svcData  = serviceModals[currentLang]?.[id] || serviceModals.fr?.[id];
  const toolData = toolModalData[currentLang]?.[id]  || toolModalData.fr?.[id];
  const data = svcData || toolData;
  if (!data) return;

  lastFocusedBeforeModal = document.activeElement;

  toolModalLabel.textContent = data.label;
  toolModalTitle.textContent = data.title;

  if (svcData) {
    // Rich service modal content
    toolModalBody.innerHTML =
      `<div class="service-section">
        <p class="service-section-label">${data.whenLabel}</p>
        <ul>${data.when.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div class="service-section">
        <p class="service-section-label">${data.deliversLabel}</p>
        <ul>${data.delivers.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div class="service-format"><strong>Format</strong> — ${data.format}</div>
      <p class="service-price-note">${data.price}</p>`;

    toolModalEl.classList.add('tool-modal--service');

    toolModalCta.innerHTML =
      `<a href="https://calendar.app.google/sBr2whccz3eFwHLF6" target="_blank" rel="noopener noreferrer" class="tool-modal-cta-btn">
        ${data.cta}
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M2 7.5h11M8.5 3L13 7.5 8.5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>`;

    // Reset scroll position each open
    document.getElementById('toolModalScroll').scrollTop = 0;
  } else {
    // Regular tool modal (agents-ia, intj…)
    toolModalBody.innerHTML = '<ul>' + toolData.items.map(item => `<li>${item}</li>`).join('') + '</ul>';
    toolModalEl.classList.remove('tool-modal--service');
    toolModalCta.innerHTML = '';
  }

  toolModalOverlay.classList.add('open');
  if (lenis) lenis.stop();
  toolModalClose.focus();
}

function closeToolModal() {
  toolModalOverlay.classList.remove('open');
  if (lenis) lenis.start();
  // Restore focus to the element that triggered the modal
  if (lastFocusedBeforeModal) {
    lastFocusedBeforeModal.focus();
    lastFocusedBeforeModal = null;
  }
}

// Focus trap within the modal
toolModalOverlay.addEventListener('keydown', (e) => {
  if (!toolModalOverlay.classList.contains('open') || e.key !== 'Tab') return;
  const focusable = Array.from(
    toolModalEl.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.disabled);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
});

toolModalClose.addEventListener('click', closeToolModal);

toolModalOverlay.addEventListener('click', (e) => {
  if (e.target === toolModalOverlay) closeToolModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toolModalOverlay.classList.contains('open')) closeToolModal();
});

document.querySelectorAll('[data-modal]').forEach(el => {
  el.addEventListener('click', () => openToolModal(el.dataset.modal));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openToolModal(el.dataset.modal); }
  });
});

/* ── 13. SMOOTH SCROLL ANCHOR LINKS ─────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
