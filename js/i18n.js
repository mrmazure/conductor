/**
 * i18n.js — Système de traduction pour Conductor v1.5
 * Langues supportées : fr, en, es
 * Détection automatique du navigateur, persistance via localStorage.
 */

(function () {
    const SUPPORTED = ['fr', 'en', 'es'];
    const DEFAULT_LANG = 'en';
    const STORAGE_KEY = 'rb_lang';

    /**
     * Détecte la langue préférée.
     * Priorité : localStorage > navigateur > défaut.
     */
    function detectLang() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED.includes(stored)) return stored;

        const nav = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
        return SUPPORTED.includes(nav) ? nav : DEFAULT_LANG;
    }

    let currentLang = detectLang();

    /**
     * Retourne la chaîne traduite pour une clé donnée.
     * Supporte les paramètres positionnels :
     *   %s → remplacé par params[0]
     *   %n → remplacé par params[0] (numérique)
     * Fallback : FR, puis la clé brute.
     */
    function t(key, ...params) {
        const locale = window.LOCALES[currentLang] || {};
        const fallback = window.LOCALES['fr'] || {};
        let str = locale[key] !== undefined ? locale[key] : (fallback[key] !== undefined ? fallback[key] : key);

        // Simple param substitution
        params.forEach(p => {
            str = str.replace('%s', p).replace('%n', p);
        });
        return str;
    }

    /**
     * Applique les traductions sur tous les éléments marqués.
     * - data-i18n="key"             → textContent
     * - data-i18n-html="key"        → innerHTML
     * - data-i18n-placeholder="key" → placeholder attribute
     * - data-i18n-title="key"       → title attribute
     */
    function applyTranslations() {
        document.documentElement.lang = currentLang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            el.innerHTML = t(el.dataset.i18nHtml);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.dataset.i18nTitle);
        });

        // Update the label inside the dropdown toggle button
        const langLabel = document.getElementById('langLabel');
        if (langLabel) langLabel.textContent = currentLang.toUpperCase();

        // Highlight the active language option
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === currentLang);
        });

        // Notify app to re-apply dynamic translations
        if (typeof window.onLangChange === 'function') {
            window.onLangChange();
        }
    }

    /**
     * Change la langue active, persiste le choix et met à jour l'interface.
     */
    function setLanguage(lang) {
        if (!SUPPORTED.includes(lang)) return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        applyTranslations();
    }

    /**
     * Cycle FR → EN → ES → FR (conservé dans l'API publique).
     */
    function cycleLang() {
        const idx = SUPPORTED.indexOf(currentLang);
        const next = SUPPORTED[(idx + 1) % SUPPORTED.length];
        setLanguage(next);
    }

    // Expose API globally
    window.i18n = { t, setLanguage, applyTranslations, cycleLang, get currentLang() { return currentLang; } };

    // Init on DOM ready
    function init() {
        applyTranslations();

        const btn  = document.getElementById('btnLang');
        const menu = document.getElementById('langMenu');

        if (btn && menu) {
            // Toggle dropdown on button click
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = !menu.classList.contains('hidden');
                menu.classList.toggle('hidden', isOpen);
                btn.setAttribute('aria-expanded', String(!isOpen));
            });

            // Select a language from the menu
            menu.querySelectorAll('.lang-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    setLanguage(opt.dataset.lang);
                    menu.classList.add('hidden');
                    btn.setAttribute('aria-expanded', 'false');
                });
            });

            // Close menu when clicking anywhere outside
            document.addEventListener('click', () => {
                menu.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
            });

            // Close menu on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    menu.classList.add('hidden');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });

            // Initial aria state
            btn.setAttribute('aria-haspopup', 'true');
            btn.setAttribute('aria-expanded', 'false');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
