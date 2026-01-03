class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'en';
        this.translations = {};
        this.init();
    }

    async init() {
        await this.loadTranslations('en');
        await this.loadTranslations('de');
        this.updateLanguage(this.currentLang);
        this.bindEvents();
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            this.translations[lang] = await response.json();
        } catch (e) {
            console.error(`Failed to load ${lang} translations`, e);
        }
    }

    updateLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        // Update active state of buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        this.translatePage();
    }

    translatePage() {
        const t = this.translations[this.currentLang];
        if (!t) return;

        // Helper to get nested properties
        const getVal = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const value = getVal(t, key);

            if (value) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = value;
                } else {
                    el.innerHTML = value;
                }
            }
        });

        // Update feature lists specially if needed, but for now we rely on flat structure
        // Handling arrays (features list) requires specific indices in data-i18n
    }

    bindEvents() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                this.updateLanguage(lang);
            });
        });
    }
}

// Initialize
window.i18n = new I18n();
