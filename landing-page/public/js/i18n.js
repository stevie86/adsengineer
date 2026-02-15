class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'en';
        this.translations = {};
        console.log('I18n: Initializing with language:', this.currentLang);
        this.init();
    }

    async init() {
        try {
            await Promise.all([
                this.loadTranslations('en'),
                this.loadTranslations('de')
            ]);
            console.log('I18n: All translations loaded.');
            this.updateLanguage(this.currentLang);
            this.bindEvents();
        } catch (error) {
            console.error('I18n: Initialization failed:', error);
        }
    }

    async loadTranslations(lang) {
        try {
            const url = `/locales/${lang}.json`;
            console.log(`I18n: Fetching ${lang} from ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.translations[lang] = await response.json();
            console.log(`I18n: Successfully loaded ${lang} translations.`);
        } catch (e) {
            console.error(`I18n: Failed to load ${lang} translations`, e);
        }
    }

    updateLanguage(lang) {
        console.log('I18n: Updating language to:', lang);
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        // Update active state of buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
                btn.classList.remove('text-gray-400');
                btn.classList.add('text-white');
            } else {
                btn.classList.remove('active');
                btn.classList.add('text-gray-400');
                btn.classList.remove('text-white');
            }
        });

        const localeInput = document.querySelector('input[name="locale"]');
        if (localeInput) {
            localeInput.value = lang;
        }

        this.translatePage();

        // Update Cal.com floating button if it exists
        if (window.Cal) {
            const buttonText = lang === 'de' ? 'Warteliste beitreten' : 'Join Waitlist';
            window.Cal("floatingButton", {
              calLink: "stefan-pirker-nmurov/30min",
              buttonText: buttonText,
              buttonColor: "#9333ea",
              buttonTextColor: "#ffffff",
              buttonPosition: "bottom-left"
            });
        }
    }

    translatePage() {
        const t = this.translations[this.currentLang];
        if (!t) {
            console.warn(`I18n: No translations found for ${this.currentLang}`);
            return;
        }

        console.log('I18n: Translating page...');
        const getVal = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

        let count = 0;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const value = getVal(t, key);

            if (value) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = value;
                } else {
                    el.innerHTML = value;
                }
                count++;
            } else {
                console.warn(`I18n: Missing translation for key: ${key}`);
            }
        });
        console.log(`I18n: Translated ${count} elements.`);
    }

    bindEvents() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                console.log('I18n: Language button clicked:', lang);
                this.updateLanguage(lang);
            });
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.i18n = new I18n(); });
} else {
    window.i18n = new I18n();
}
