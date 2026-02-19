/**
 * Sistema de Internacionalización (i18n) para Proyectos Estáticos
 * Funciona completamente en el cliente sin necesidad de servidor
 */

(function () {
  'use strict';

  const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt'];
  const DEFAULT_LANGUAGE = 'es';
  const STORAGE_KEY = 'i18nextLng';

  const LANGUAGE_NAMES = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    pt: 'Português'
  };

  const LANGUAGE_FLAGS = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    pt: '🇵🇹'
  };

  class I18nStatic {
    constructor() {
      this.currentLang = this.detectLanguage();
      this.translations = {};
      this.initialized = false;
      this.observers = [];
      this.isApplying = false; // Prevenir bucles infinitos
      this.observer = null;
    }

    /**
     * Detecta el idioma desde URL, localStorage o navegador
     */
    detectLanguage() {
      try {
        // 1. Verificar parámetro en URL (?lang=es)
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
          return urlLang;
        }

        // 2. Verificar localStorage
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
            return stored;
          }
        }

        // 3. Detectar del navegador
        if (typeof navigator !== 'undefined' && navigator.language) {
          const browserLang = navigator.language.split('-')[0];
          if (SUPPORTED_LANGUAGES.includes(browserLang)) {
            return browserLang;
          }
        }
      } catch (e) {
        console.warn('Error detecting language:', e);
      }

      // 4. Idioma por defecto
      return DEFAULT_LANGUAGE;
    }

    /**
     * Carga las traducciones desde el archivo JSON
     */
    async loadTranslations(lang) {
      if (this.translations[lang]) {
        return this.translations[lang];
      }

      try {
        const response = await fetch(`/i18n/locales/${lang}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${lang}`);
        }
        this.translations[lang] = await response.json();
        return this.translations[lang];
      } catch (error) {
        console.warn(`Error loading translations for ${lang}, falling back to ${DEFAULT_LANGUAGE}:`, error);
        // Cargar inglés como fallback
        if (lang !== DEFAULT_LANGUAGE && !this.translations[DEFAULT_LANGUAGE]) {
          return this.loadTranslations(DEFAULT_LANGUAGE);
        }
        return this.translations[DEFAULT_LANGUAGE] || {};
      }
    }

    /**
     * Obtiene una traducción por clave
     */
    getTranslation(key, lang = null) {
      if (!key) return '';

      const targetLang = lang || this.currentLang;
      const translations = this.translations[targetLang] || this.translations[DEFAULT_LANGUAGE] || {};

      const keys = key.split('.');
      let value = translations;

      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }

      if (value === undefined && targetLang !== DEFAULT_LANGUAGE) {
        // Fallback al inglés
        const enTranslations = this.translations[DEFAULT_LANGUAGE] || {};
        value = enTranslations;
        for (const k of keys) {
          if (value && typeof value === 'object') {
            value = value[k];
          } else {
            value = undefined;
            break;
          }
        }
      }

      return typeof value === 'string' ? value : key;
    }

    /**
     * Cambia el idioma actual
     */
    async changeLanguage(lang) {
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        console.warn(`Unsupported language: ${lang}`);
        return;
      }

      this.currentLang = lang;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, lang);
        }
      } catch (e) {
        console.warn('Error saving language to localStorage:', e);
      }

      if (document.documentElement) {
        document.documentElement.lang = lang;
      }

      await this.loadTranslations(lang);
      this.applyTranslations();

      // Dispatch a custom event so Alpine and other components can react
      try {
        window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
      } catch (e) { }

      // Notify observers (legacy)
      this.notifyObservers(lang);
    }

    /**
     * Aplica las traducciones a todos los elementos con data-i18n
     */
    applyTranslations() {
      // Prevenir bucles infinitos
      if (this.isApplying) return;
      this.isApplying = true;

      try {
        // Desconectar observador temporalmente para evitar bucles
        if (this.observer) {
          this.observer.disconnect();
        }

        // Actualizar elementos con data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach((element) => {
          const key = element.getAttribute('data-i18n');
          if (key) {
            const translation = this.getTranslation(key);
            if (translation && translation !== key) {
              this.updateElement(element, translation);
            }
          }
        });

        // Actualizar elementos con data-i18n-html (para contenido HTML)
        const htmlElements = document.querySelectorAll('[data-i18n-html]');
        htmlElements.forEach((element) => {
          const key = element.getAttribute('data-i18n-html');
          if (key) {
            const translation = this.getTranslation(key);
            if (translation && translation !== key) {
              element.innerHTML = translation;
            }
          }
        });

        // Actualizar atributos con data-i18n-attr
        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach((element) => {
          const attrData = element.getAttribute('data-i18n-attr');
          if (attrData) {
            try {
              const attrs = JSON.parse(attrData);
              Object.keys(attrs).forEach((attr) => {
                const key = attrs[attr];
                const translation = this.getTranslation(key);
                if (translation && translation !== key) {
                  element.setAttribute(attr, translation);
                }
              });
            } catch (e) {
              console.error('Error parsing data-i18n-attr:', e);
            }
          }
        });

        // Actualizar título y meta description si están marcados
        const titleMeta = document.querySelector('meta[name="i18n-title"]');
        if (titleMeta) {
          const titleKey = titleMeta.getAttribute('content');
          if (titleKey) {
            const translation = this.getTranslation(titleKey);
            if (translation && translation !== titleKey) {
              document.title = translation;
            }
          }
        }

        const descMeta = document.querySelector('meta[name="i18n-description"]');
        if (descMeta) {
          const descKey = descMeta.getAttribute('content');
          if (descKey) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
              const translation = this.getTranslation(descKey);
              if (translation && translation !== descKey) {
                metaDesc.setAttribute('content', translation);
              }
            }
          }
        }

        // Reconectar observador
        if (this.observer && document.body) {
          this.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      } catch (error) {
        console.error('Error applying translations:', error);
      } finally {
        this.isApplying = false;
      }
    }

    /**
     * Actualiza un elemento con la traducción
     */
    updateElement(element, translation) {
      try {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          if (element.type === 'submit' || element.type === 'button') {
            element.value = translation;
          } else {
            element.placeholder = translation;
          }
        } else if (element instanceof HTMLOptionElement) {
          element.textContent = translation;
        } else {
          // CRITICAL: Only update textContent if the element has NO child elements.
          // Setting textContent would destroy any SVG icons or nested spans.
          const hasChildElements = element.children.length > 0;
          if (hasChildElements) {
            // Try to find a direct text node to update instead
            for (const child of element.childNodes) {
              if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                child.textContent = translation;
                return;
              }
            }
            // No text node found — create one at the beginning
            const textNode = document.createTextNode(translation);
            element.insertBefore(textNode, element.firstChild);
          } else {
            if (element.textContent !== translation) {
              element.textContent = translation;
            }
          }
        }
      } catch (e) {
        console.warn('Error updating element:', e);
      }
    }

    /**
     * Inicializa el sistema i18n
     */
    async init() {
      if (this.initialized) return;

      try {
        this.currentLang = this.detectLanguage();
        if (document.documentElement) {
          document.documentElement.lang = this.currentLang;
        }

        await this.loadTranslations(this.currentLang);

        // Apply translations immediately — do NOT wait 100ms
        // If DOM isn't ready yet, wait for it
        const applyWhenReady = () => {
          this.applyTranslations();
          // Observe DOM for dynamically added elements
          setTimeout(() => { this.observeDOM(); }, 300);
          this.initialized = true;
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', applyWhenReady, { once: true });
        } else {
          applyWhenReady();
        }
      } catch (error) {
        console.error('Error initializing i18n:', error);
        this.initialized = true;
      }
    }

    /**
     * Observa cambios en el DOM para aplicar traducciones automáticamente
     */
    observeDOM() {
      if (!document.body || this.observer) return;

      try {
        this.observer = new MutationObserver((mutations) => {
          // Solo procesar si no estamos aplicando traducciones
          if (this.isApplying) return;

          // Verificar si hay elementos nuevos con data-i18n
          let hasNewI18nElements = false;
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                if (node.hasAttribute('data-i18n') ||
                  node.hasAttribute('data-i18n-html') ||
                  node.hasAttribute('data-i18n-attr') ||
                  node.querySelector('[data-i18n], [data-i18n-html], [data-i18n-attr]')) {
                  hasNewI18nElements = true;
                }
              }
            });
          });

          // Solo aplicar traducciones si hay elementos nuevos con i18n
          if (hasNewI18nElements) {
            // Usar requestAnimationFrame para evitar bloqueos
            requestAnimationFrame(() => {
              this.applyTranslations();
            });
          }
        });

        this.observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      } catch (error) {
        console.warn('Error setting up DOM observer:', error);
      }
    }

    /**
     * Notifica a los observadores sobre el cambio de idioma
     */
    notifyObservers(lang) {
      try {
        this.observers.forEach(callback => {
          try {
            callback(lang);
          } catch (e) {
            console.warn('Error in language change observer:', e);
          }
        });
      } catch (e) {
        console.warn('Error notifying observers:', e);
      }
    }

    /**
     * Suscribe un callback para cambios de idioma
     */
    onLanguageChange(callback) {
      if (typeof callback === 'function') {
        this.observers.push(callback);
      }
    }

    /**
     * Formatea moneda según el locale
     */
    formatCurrency(amount, lang = null) {
      try {
        const targetLang = lang || this.currentLang;
        const locales = {
          en: 'en-US',
          es: 'es-ES',
          fr: 'fr-FR',
          pt: 'pt-BR'
        };

        return new Intl.NumberFormat(locales[targetLang] || 'en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      } catch (e) {
        return '$' + amount.toFixed(2);
      }
    }

    /**
     * Formatea fecha según el locale
     */
    formatDate(date, lang = null) {
      try {
        const targetLang = lang || this.currentLang;
        const locales = {
          en: 'en-US',
          es: 'es-ES',
          fr: 'fr-FR',
          pt: 'pt-BR'
        };

        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(locales[targetLang] || 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(dateObj);
      } catch (e) {
        return date.toString();
      }
    }

    /**
     * Maneja pluralización
     */
    pluralize(count, singular, plural, lang = null) {
      const targetLang = lang || this.currentLang;
      if (targetLang === 'fr') {
        return count <= 1 ? singular : plural;
      } else if (targetLang === 'pt') {
        return count <= 1 ? singular : plural;
      }
      return count === 1 ? singular : plural;
    }

    getCurrentLanguage() {
      return this.currentLang;
    }

    getSupportedLanguages() {
      return [...SUPPORTED_LANGUAGES];
    }

    getLanguageName(lang) {
      return LANGUAGE_NAMES[lang] || lang;
    }

    getLanguageFlag(lang) {
      return LANGUAGE_FLAGS[lang] || '🌐';
    }
  }

  // Crear instancia global de forma segura
  let i18n;

  function initializeI18n() {
    try {
      i18n = new I18nStatic();

      // Expose globally before init so LanguageSelector can reference it
      window.i18n = i18n;
      window.I18nStatic = I18nStatic;

      // Initialize immediately
      i18n.init().catch(err => {
        console.error('Error initializing i18n:', err);
      });
    } catch (error) {
      console.error('Error creating i18n instance:', error);
      // Minimal fallback to avoid crashes
      window.i18n = {
        getTranslation: (key) => key,
        changeLanguage: async () => { },
        getCurrentLanguage: () => 'en',
        onLanguageChange: () => { }
      };
    }
  }

  // Inicializar de forma segura
  if (typeof window !== 'undefined') {
    initializeI18n();
  }

  // Exportar para módulos ES6 si es necesario
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nStatic;
  }
})();
