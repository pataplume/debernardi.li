/* ============================================================
   main.js — debernardi.li
   GSAP + Lenis + Custom cursor + Language toggle + Chatbot demo
   ============================================================ */

'use strict';

/* ── 1. LENIS SMOOTH SCROLL ─────────────────────────────── */
const lenis = new Lenis({
  lerp: 0.085,
  smoothWheel: true,
  smoothTouch: false,
  autoRaf: false, // We drive the RAF via GSAP ticker below
});

gsap.registerPlugin(ScrollTrigger);

// Single RAF loop via GSAP ticker — prevents double-calling Lenis
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Keep ScrollTrigger in sync for parallax
lenis.on('scroll', () => ScrollTrigger.update());
window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true });

/* ── 2. CUSTOM CURSOR ───────────────────────────────────── */
(function initCursor() {
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
  // Pause Lenis when nav is open
  isOpen ? lenis.stop() : lenis.start();
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('mobile-open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
    lenis.start();
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
      r: "Pour contacter Tristan :\n\n📧 tristan@condere.ch\n💬 WhatsApp : +41 79 391 97 03\n💼 LinkedIn : linkedin.com/in/tdebernardi\n\nIl répond vite.",
    },
    {
      kw: ['cv', 'formation', 'études', 'diplôme', 'université', 'hult', 'école', 'académique'],
      r: "Tristan a un parcours académique atypique : MSc à Hult (Dubaï), semestre à Adelphi (New York), BSc Finance (Annecy), 1ère année de médecine à Genève, et un Certificate en Change Management à Ashridge (UK). Ce mix explique sa polyvalence.",
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
      r: "Pour les tarifs, Tristan préfère en discuter directement selon la mission — durée, périmètre, modalités. Contactez-le à tristan@condere.ch pour une conversation.",
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
      r: "Pour la disponibilité, le mieux est de contacter Tristan directement : tristan@condere.ch ou WhatsApp +41 79 391 97 03. Il répondra rapidement.",
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
      r: "To contact Tristan:\n\n📧 tristan@condere.ch\n💬 WhatsApp: +41 79 391 97 03\n💼 LinkedIn: linkedin.com/in/tdebernardi\n\nHe gets back quickly.",
    },
    {
      kw: ['cv', 'resume', 'education', 'degree', 'hult', 'university', 'school', 'academic'],
      r: "Tristan has an unconventional academic background: MSc at Hult (Dubai), semester at Adelphi (New York), BSc Finance (Annecy), first year of medicine in Geneva, and a Change Management Certificate from Ashridge (UK). That mix explains his versatility.",
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
      r: "For rates, Tristan prefers to discuss directly based on the mission — duration, scope, modality. Contact him at tristan@condere.ch for that conversation.",
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
      r: "For availability, the best is to contact Tristan directly: tristan@condere.ch or WhatsApp +41 79 391 97 03. He'll respond quickly.",
    },
    {
      kw: ['odoo', 'sap', 'erp', 'medionline', 'crm', 'asana', 'notion', 'airtable'],
      r: "Tristan works with Odoo, SAP, and Medionline on the ERP side, and configures CRMs as needed. For project management he uses Asana, Notion, and Airtable. He picks tools based on the organisation's maturity — not the other way around.",
    },
  ],
};

const fallback = {
  fr: "Bonne question. Pour une réponse précise sur ce point, contactez Tristan directement à tristan@condere.ch ou sur WhatsApp. Il répondra vite.",
  en: "Good question. For a precise answer on that, contact Tristan directly at tristan@condere.ch or via WhatsApp. He gets back quickly.",
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

async function handleSend() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage(text, true);
  showTyping();

  // Simulated thinking delay: 800–1800ms
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));

  hideTyping();
  addMessage(getResponse(text, currentLang));
}

form.addEventListener('submit', (e) => { e.preventDefault(); handleSend(); });

function syncChatbotGreeting(lang) {
  // Update first bot message text to match language
  const firstMsg = messages.querySelector('.bot-msg p');
  if (!firstMsg) return;
  const val = firstMsg.getAttribute(`data-${lang}`);
  if (val) firstMsg.textContent = val;
}

/* ── 11. SMOOTH SCROLL ANCHOR LINKS ─────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -60, duration: 1.4 });
  });
});
