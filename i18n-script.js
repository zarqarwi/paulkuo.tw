// ===== i18n System for paulkuo.tw =====
// Two-layer architecture:
//   Layer 1: Pre-translated static JSON (fast, no API cost)
//   Layer 2: DeepL API fallback for missing keys (via Cloudflare Pages Function)

const translationCache = {};
let currentLang = 'zh-TW';

// Load pre-translated JSON for a language
async function loadTranslation(lang) {
  if (translationCache[lang]) return translationCache[lang];
  try {
    const res = await fetch(`/translations/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    translationCache[lang] = data;
    return data;
  } catch (e) {
    console.warn(`[i18n] Failed to load ${lang}.json:`, e);
    return null;
  }
}

// Batch translate via DeepL API proxy (fallback for missing keys)
async function translateViaAPI(texts, targetLang) {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target_lang: targetLang })
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return data.translations || [];
  } catch (e) {
    console.warn('[i18n] API fallback failed:', e);
    return [];
  }
}

// Main language switching function
async function setLang(lang) {
  currentLang = lang;

  // Update HTML lang attribute for font switching
  const langAttrMap = { 'zh-TW': 'zh-Hant', 'zh-CN': 'zh-Hans', 'en': 'en', 'ja': 'ja' };
  document.documentElement.lang = langAttrMap[lang] || lang;

  // Update active button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Save preference
  localStorage.setItem('paulkuo-lang', lang);

  // Source language — just restore originals
  if (lang === 'zh-TW') {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.original !== undefined) {
        el.innerHTML = el.dataset.original;
      }
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      if (el.dataset.originalPh !== undefined) {
        el.placeholder = el.dataset.originalPh;
      }
    });
    return;
  }

  // Load translation dictionary
  const dict = await loadTranslation(lang);
  const missingKeys = [];
  const missingEls = [];

  // Apply translations from JSON
  document.querySelectorAll('[data-i18n]').forEach(el => {
    // Store original on first switch
    if (el.dataset.original === undefined) {
      el.dataset.original = el.innerHTML;
    }

    const key = el.dataset.i18n;
    if (dict && dict[key]) {
      el.innerHTML = dict[key];
    } else {
      // Collect for API fallback
      missingKeys.push(el.dataset.original);
      missingEls.push(el);
    }
  });

  // Handle placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    if (el.dataset.originalPh === undefined) {
      el.dataset.originalPh = el.placeholder;
    }
    const key = el.dataset.i18nPh;
    if (dict && dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // API fallback for missing keys (batch, max 10 per request)
  if (missingKeys.length > 0 && lang !== 'zh-TW') {
    for (let i = 0; i < missingKeys.length; i += 10) {
      const batch = missingKeys.slice(i, i + 10);
      const batchEls = missingEls.slice(i, i + 10);
      const translations = await translateViaAPI(batch, lang);
      translations.forEach((text, idx) => {
        if (text && batchEls[idx]) {
          batchEls[idx].innerHTML = text;
          // Cache for future use
          if (dict) {
            dict[batchEls[idx].dataset.i18n] = text;
          }
        }
      });
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('paulkuo-lang');
  if (saved && saved !== 'zh-TW') {
    setLang(saved);
  }
});
