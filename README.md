# Centro Aura — demo web

Demo de la web de **Centro Aura** (Spa Capilar · Tricología), en C/ Dr. Domingo Gallego, 3, Las Cabezas de San Juan.

## Verla

- Abre `index.html` en el navegador, o
- arranca el servidor local y entra en http://localhost:4173:

```bash
npm run serve
```

No hace falta instalar nada (solo Node 18 o superior para el servidor y los tests).

## Cambiar precios, horario o teléfono

Los precios, duraciones y el horario están en **`js/data.js`**. Cambia el valor y guarda: las páginas lo leen de ahí.

- Si cambias el **teléfono**, sustituye también `34610167764` en los enlaces de respaldo del HTML (`wa.me`, `tel:`) y en el JSON-LD de `index.html`: esos enlaces no se generan desde `data.js`.
- Si cambias el **horario**, actualiza también el bloque `application/ld+json` de `index.html`. `npm test` avisa si no coinciden.

## Cambiar las fotos

Las fotos actuales son de stock (Unsplash) y provisionales, salvo el retrato de Paula: hoy es un `div` de color de relleno en `index.html` (hay un comentario HTML ahí mismo que lo explica). Para poner las reales:

1. Guarda la foto en `assets/img/` con **el mismo nombre** (por ejemplo, `paula-retrato.webp`) y en formato WebP.
   - Para el retrato de Paula: guarda `assets/img/paula-retrato.webp` (640×640) y sustituye el `div` de relleno por un `<img src="assets/img/paula-retrato.webp" width="640" height="640" loading="lazy" alt="…">` con un `alt` descriptivo.
2. Si la nueva foto tiene otro tamaño, actualiza sus atributos `width` y `height` en el HTML y su tamaño en `tools/images.json`. `npm test` comprueba que coinciden.

**No ejecutes `npm run images` después de poner fotos reales**: ese comando vuelve a descargar las fotos de stock de Unsplash y sobrescribe las que hayas puesto.

## Tests

```bash
npm test
```

Comprueban las funciones de `js/lib.js`, los datos de `js/data.js`, la estructura y los enlaces de cada página, el tamaño real de las fotos y el horario del JSON-LD.

## Estructura

| Carpeta o archivo | Qué contiene |
|---|---|
| `index.html`, `pages/` | Las 4 páginas |
| `css/styles.css` | Todos los estilos (tokens de color y tipografía arriba del todo) |
| `js/data.js` | Datos de negocio |
| `js/lib.js` | Funciones sin DOM (precios, WhatsApp, horario) |
| `js/main.js` | Comportamiento: menú, pestañas, formulario, animaciones |
| `assets/` | Fotos e iconos |
| `tools/` | Servidor local y descarga de fotos |
| `docs/superpowers/` | Especificación y plan |

## Antes de publicar

- Poner URLs absolutas en `og:image`, `canonical` y la `image` del JSON-LD cuando haya dominio.
- Alojar las fuentes en el propio servidor (Google Fonts remoto plantea problemas de RGPD en España).
- Cargar el mapa de Google solo tras un clic (o con aviso de cookies).
- Textos legales reales (aviso legal y privacidad, LSSI).
- Precios y horario definitivos.

## Pendiente de la clienta

- Fotos reales del local, de Paula, de sus trabajos y de los productos.
- Precios y horario definitivos.
- Textos legales (aviso legal y privacidad) y dominio.
