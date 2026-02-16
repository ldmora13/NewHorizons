# Sistema de Internacionalización (i18n) para Proyectos Estáticos

Este sistema de internacionalización está diseñado específicamente para proyectos estáticos de Astro. Funciona completamente en el cliente sin necesidad de procesamiento del servidor.

## Características

✅ **100% Estático** - No requiere servidor, funciona completamente en el cliente  
✅ **Detección automática** del idioma del navegador  
✅ **Selector manual** de idioma con banderas (🇺🇸 🇪🇸 🇫🇷)  
✅ **Persistencia** en localStorage  
✅ **Fallback automático** al inglés cuando faltan traducciones  
✅ **Carga dinámica** de traducciones desde archivos JSON  
✅ **Observador DOM** para aplicar traducciones a elementos nuevos  
✅ **Formateo** de moneda y fecha según locale  

## Estructura de Archivos

```
public/i18n/
├── locales/
│   ├── en.json    # Traducciones en inglés
│   ├── es.json    # Traducciones en español
│   └── fr.json    # Traducciones en francés
└── client.js      # Cliente JavaScript para navegador

src/components/
└── LanguageSelector.astro  # Componente selector de idioma
```

## Uso Básico

### 1. Incluir el Script en el Layout

En `src/layouts/MainLayout.astro`, agregar antes del cierre de `</body>`:

```html
<script src="/i18n/client.js"></script>
```

### 2. Usar Atributos data-i18n

Agregue el atributo `data-i18n` a cualquier elemento que necesite traducción:

```html
<h1 data-i18n="hero.title">Get a Consultation</h1>
<p data-i18n="hero.description">Ready to take the next step...</p>
```

### 3. Selector de Idioma

El componente `LanguageSelector` ya está integrado en el `Header`. Se muestra automáticamente.

## Ejemplos de Uso

### Texto Simple

```html
<span data-i18n="common.home">Home</span>
```

### Contenido HTML

```html
<div data-i18n-html="about.description">Description text</div>
```

### Atributos

```html
<input 
  type="text" 
  placeholder="Full Name"
  data-i18n-attr='{"placeholder": "checkout.fullName"}'
/>
```

### Título y Meta Description

```html
<head>
  <meta name="i18n-title" content="meta.defaultTitle" />
  <meta name="i18n-description" content="meta.defaultDescription" />
</head>
```

## Uso en JavaScript

```javascript
// Obtener traducción
const translation = window.i18n.getTranslation('hero.title');

// Cambiar idioma
await window.i18n.changeLanguage('es');

// Formatear moneda
const price = window.i18n.formatCurrency(1000, 'es'); // "$1,000.00"

// Formatear fecha
const date = window.i18n.formatDate(new Date(), 'fr'); // "16 février 2026"

// Escuchar cambios de idioma
window.i18n.onLanguageChange((lang) => {
  console.log('Language changed to:', lang);
});
```

## Detección de Idioma

El sistema detecta el idioma en el siguiente orden:

1. **Parámetro URL** - `?lang=es`
2. **localStorage** - Clave `i18nextLng`
3. **Navegador** - `navigator.language`
4. **Por defecto** - Inglés (`en`)

## Agregar Nuevas Traducciones

1. Agregue la clave en `public/i18n/locales/en.json`
2. Agregue la misma clave en `public/i18n/locales/es.json`
3. Agregue la misma clave en `public/i18n/locales/fr.json`
4. Use `data-i18n="tu.clave.aqui"` en el HTML

### Ejemplo

**en.json:**
```json
{
  "newSection": {
    "title": "New Section Title"
  }
}
```

**es.json:**
```json
{
  "newSection": {
    "title": "Título de Nueva Sección"
  }
}
```

**fr.json:**
```json
{
  "newSection": {
    "title": "Titre de Nouvelle Section"
  }
}
```

**HTML:**
```html
<h2 data-i18n="newSection.title">New Section Title</h2>
```

## API del Cliente

### Métodos Principales

- `i18n.getTranslation(key, lang?)` - Obtiene una traducción
- `i18n.changeLanguage(lang)` - Cambia el idioma actual
- `i18n.getCurrentLanguage()` - Obtiene el idioma actual
- `i18n.formatCurrency(amount, lang?)` - Formatea moneda
- `i18n.formatDate(date, lang?)` - Formatea fecha
- `i18n.onLanguageChange(callback)` - Suscribe a cambios de idioma

### Propiedades

- `i18n.currentLang` - Idioma actual
- `i18n.translations` - Objeto con todas las traducciones cargadas

## Compatibilidad

- ✅ Astro (modo estático)
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Sin dependencias externas (solo JavaScript vanilla)

## Notas Importantes

1. **Archivos JSON deben estar en `/public/i18n/locales/`** para que sean accesibles estáticamente
2. **El script debe cargarse antes** de que se ejecute código que dependa de traducciones
3. **Los elementos con `data-i18n`** se actualizan automáticamente al cambiar el idioma
4. **El observador DOM** aplica traducciones a elementos agregados dinámicamente

## Solución de Problemas

### Las traducciones no se aplican

1. Verifique que el script `/i18n/client.js` esté cargado
2. Verifique que los archivos JSON existan en `public/i18n/locales/`
3. Abra la consola del navegador para ver errores
4. Verifique que las claves en `data-i18n` coincidan con las del JSON

### El idioma no persiste

- Verifique que `localStorage` esté habilitado en el navegador
- Verifique que no haya bloqueadores de cookies/localStorage

### Traducciones faltantes

- El sistema automáticamente usa inglés como fallback
- Verifique que todas las claves existan en los 3 archivos JSON
