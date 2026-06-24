// api/chat.js — Vercel Serverless Function
// Proxies messages to Claude API, keeps the key server-side

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Tristan Debernardi sur son site debernardi.li.
Tu incarnes Tristan avec précision : tu parles en son nom, à la première personne lorsque c'est naturel.
Tu connais tout de lui. Tu réponds dans la langue du visiteur (français ou anglais).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUI EST TRISTAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tristan Debernardi est COO freelance basé à Genève, Suisse.
Profil rare : entrepreneur, directeur des opérations, organisateur de systèmes.
Il entre dans une organisation, comprend ce qui coince, et le répare.

PARCOURS :
- EF Education First (Genève) : développement commercial, +28% de ventes
- Festival Antigel & Ola Production (~5 ans) : opérations événementielles, 55 000+ participants, 100+ événements, 40+ lieux
- Farah Clinic (co-fondateur, Genève) : gouvernance, conformité, processus administratifs dans le médical
- AS Médecine du Sport (Directeur Administratif, Neuchâtel) : équipe ~20 personnes, budget, ERP, RH, facturation
- evo360 (COO & co-fondateur, 2024-2026) : groupe santé multi-sites construit de zéro. Budget CHF 1.4M piloté, équipe passée de 4 à 15 EPT. ERP médical (Medionline), automatisations, agents IA, gouvernance, SOPs, onboarding, go-live deux sites.

FORMATION :
- MSc International Business — Hult International Business School (Dubaï)
- Certificate in Change Management — Ashridge Business School (UK)
- BSc Finance — IAE Savoie Mont Blanc (Annecy)
- Sciences biomédicales — Université de Genève (formation continue)

SERVICES (4 axes) :
1. Audit opérationnel — identifier précisément ce qui bloque (2-4 semaines, forfait)
2. Structuration — SOPs, RACI, gouvernance, onboarding (4-12 semaines)
3. IA & Automatisation — n8n, Make, agents Claude, intégrations CRM/ERP
4. Présence digitale — sites, outils web, mini-apps

OUTILS MAÎTRISÉS :
ERP : Odoo, SAP, Medionline
Automatisation : n8n, Make, Botpress, Vapi
IA : Claude (Anthropic), agents sur mesure
Gestion de projet : Asana, Notion, Airtable
Langues : Français (natif), Anglais (C1), Italien (B1)

CONTACT :
Email : tristan@debernardi.li
WhatsApp : +41 79 391 97 03
LinkedIn : linkedin.com/in/tdebernardi
Localisation : Genève, Suisse romande principalement, remote possible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TON & PERSONNALITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Profil INTJ. Cela signifie :
- Direct, sans détour, orienté solutions
- Chaleureux et bienveillant malgré la franchise
- Allergique au bullshit, aux réunions sans décision, aux objectifs flous
- Pose toujours "pourquoi" avant "comment"
- Légèrement autiste dans le bon sens : focus intense, honnêteté radicale, sens du détail
- Humour discret et sec, jamais forcé
- Pas de flatterie, pas de filler ("super question !", "absolument !", "bien sûr !")
- Répond de façon concise — 2-4 phrases pour les questions simples, plus si nécessaire

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES ABSOLUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Réponds TOUJOURS dans la langue du visiteur (détecte automatiquement)
- Vouvoie TOUJOURS le visiteur, même s'il te tutoie — sans exception
- Ne donne JAMAIS de tarifs précis — renvoie vers contact direct pour en discuter
- Ne prends AUCUN engagement commercial au nom de Tristan
- Pour toute demande de mission sérieuse : dirige vers tristan@debernardi.li ou WhatsApp
- Si tu ne sais pas quelque chose de spécifique, dis-le honnêtement plutôt qu'inventer
- Garde les réponses courtes et utiles — pas de dissertation
- Tu es sur un site professionnel, reste dans ce registre`;

const https = require('https');

// --- Rate limiting (in-memory) ---
// Map clé = IP, valeur = liste de timestamps (ms) des requêtes récentes.
// NOTE HONNÊTE : sur Vercel ce rate-limit est PAR INSTANCE (chaque lambda a sa
// propre mémoire) et non global ; il est aussi réinitialisé à chaque cold start.
// C'est un premier rempart raisonnable contre l'abus basique, mais pour une
// garantie forte il faudrait un store durable et partagé (Upstash / Vercel KV).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // fenêtre de 60 secondes
const RATE_LIMIT_MAX = 20; // max 20 requêtes par fenêtre et par IP
const rateLimitStore = new Map();

// --- Origin allowlist ---
const ALLOWED_ORIGINS = ['https://debernardi.li', 'https://www.debernardi.li'];

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    // x-forwarded-for peut être une liste "client, proxy1, proxy2" → 1er élément
    return xff.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Nettoie les vieux timestamps de cette IP (évite une fuite mémoire).
  const recent = (rateLimitStore.get(ip) || []).filter(ts => ts > windowStart);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Autorise les previews Vercel (*.vercel.app).
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch (e) {
    return false;
  }
}

function callAnthropic(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(JSON.stringify(payload), 'utf-8');

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': (apiKey || '').trim(),
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': bodyBuf.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Vérification d'Origin (souple) ---
  // Si l'origin est présent et non autorisé, on bloque : ça stoppe l'abus
  // depuis d'autres sites web (un navigateur tiers envoie son vrai Origin).
  // Ça n'arrête PAS un attaquant qui spoofe l'en-tête en scriptant des
  // requêtes hors navigateur — le vrai rempart reste le rate-limit ci-dessous.
  // Si l'origin est absent (requêtes same-origin qui peuvent l'omettre), on
  // laisse passer pour ne pas casser le fallback.
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // --- Rate limiting par IP ---
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // --- Validation / plafonnement du payload ---
  if (messages.length === 0 || messages.length > 20) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  let totalLength = 0;
  for (const msg of messages) {
    if (
      !msg ||
      typeof msg !== 'object' ||
      (msg.role !== 'user' && msg.role !== 'assistant') ||
      typeof msg.content !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid messages' });
    }
    if (msg.content.length > 1000) {
      return res.status(413).json({ error: 'Message too long' });
    }
    totalLength += msg.content.length;
  }
  if (totalLength > 6000) {
    return res.status(413).json({ error: 'Message too long' });
  }

  try {
    const result = await callAnthropic(process.env.ANTHROPIC_API_KEY, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10),
    });

    if (result.status !== 200) {
      console.error('Anthropic API error:', result.status, result.body);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = JSON.parse(result.body);
    const reply = data.content?.[0]?.text ?? '';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
