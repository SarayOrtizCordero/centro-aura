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

Todo está en **`js/data.js`**. Cambia el valor y guarda: las páginas lo leen de ahí.
Si cambias el horario, actualiza también el bloque `application/ld+json` de `index.html`. `npm test` avisa si no coinciden.

## Cambiar las fotos

Las fotos actuales son de stock (Unsplash) y provisionales. Para poner las reales:

1. Guarda la foto en `assets/img/` con **el mismo nombre** (por ejemplo, `paula-retrato.webp`) y en formato WebP.
2. Si la nueva foto tiene otro tamaño, actualiza sus atributos `width` y `height` en el HTML y su tamaño en `tools/images.json`. `npm test` comprueba que coinciden.

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

## Pendiente de la clienta

- Fotos reales del local, de Paula, de sus trabajos y de los productos.
- Precios y horario definitivos.
- Textos legales (aviso legal y privacidad) y dominio.
