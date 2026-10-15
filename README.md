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

- Un precio puede ser un **rango**: `price` es el mínimo y `priceMax` el máximo (se ve como `30–40 €`). Los rangos van con `approx: true` y la pestaña de Barros, alisados y antifrizz avisa de que son orientativos.
- Si un servicio no tiene `duration`, no se muestra duración.
- Si cambias un precio, cambia **también** el texto de respaldo que hay en `pages/servicios.html` (el que se ve sin JavaScript). `npm test` avisa si no coinciden.

- Si cambias el **teléfono**, sustituye también `34610167764` en los enlaces de respaldo del HTML (`wa.me`, `tel:`) y en el JSON-LD de `index.html`: esos enlaces no se generan desde `data.js`.
- Si cambias el **horario**, actualiza también el bloque `application/ld+json` de `index.html`. `npm test` avisa si no coinciden.

## Cambiar las fotos

Las fotos del salón y de los servicios son de stock (Unsplash) y provisionales. Las de los tres champús Jaldún (`champu-*.webp`) son fotos de producto. Para poner las reales:

1. Guarda la foto en `assets/img/` con **el mismo nombre** y en formato WebP.
2. Si la nueva foto tiene otro tamaño, actualiza sus atributos `width` y `height` en el HTML y su tamaño en `tools/images.json`. `npm test` comprueba que coinciden.

**No ejecutes `npm run images` después de poner fotos reales**: ese comando vuelve a descargar las fotos de stock de Unsplash y sobrescribe las que hayas puesto.

## Tipografías

Se sirven desde el propio sitio (`assets/fonts/` y `css/fonts.css`), así que no se contacta con Google al cargar la web. Si algún día cambias de familia o de pesos, edita la URL en `tools/fetch-fonts.mjs` y ejecuta `npm run fonts`.

## Mapa de Google

El mapa **no se carga hasta que el visitante pulsa «Ver el mapa»**, y mientras tanto queda un enlace a Google Maps. Así no se envía su IP a Google sin que lo pida, y no hace falta un banner de cookies.

## Páginas legales

`pages/aviso-legal.html` y `pages/privacidad.html` son un **borrador**. Los datos que faltan aparecen resaltados en amarillo (`<mark class="pendiente">`). Rellénalos, haz que los revise un profesional (gestoría o abogado) y quita el comentario `BORRADOR` de cada archivo.

## Portada

Tiene cuatro bloques: hero, servicios (3 destacados con duración y precio leídos de `data.js`), una banda de tienda (champús y tarjeta regalo) y la visita. Jaldún y las tarjetas regalo viven completos en la Tienda; la portada solo enlaza a ellos.

## Antes de publicar

```bash
npm run pendientes
```

Lista todo lo que sigue sin rellenar: datos legales y dominio. Se resuelve así:

1. Rellena los campos amarillos de las dos páginas legales.
2. El sitio usa ahora `https://centro-aura.vercel.app`. Cuando compres un dominio propio, cámbialo en canonical, `og:image`, JSON-LD, `sitemap.xml` y `robots.txt` con un solo comando (sustituye el dominio que haya en ese momento, así que se puede repetir):

   ```bash
   npm run domain -- https://www.tudominio.es
   ```

3. Confirma precios y horario definitivos (`js/data.js` y JSON-LD).
4. Publica solo la web. `npm run build` copia a `dist/` únicamente `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `pages/`, `css/`, `js/` y `assets/` (sin `tests/`, `tools/`, `docs/`, `README.md` ni `CREDITOS.md`). En Vercel lo hace `vercel.json` solo: ejecuta ese build y publica `dist/`. Si añades una carpeta nueva a la web, inclúyela en la lista `PUBLIC` de `tools/build.mjs`.
5. Configura el alojamiento para que sirva `404.html` en las URLs que no existan (Netlify, Vercel, GitHub Pages y Cloudflare Pages lo hacen solos).
   `404.html` se ve igual en cualquier URL (`/a/b/c`) y abierta desde el disco: sus rutas son relativas a la raíz gracias a un `<base>`. No las cambies a rutas con `/` inicial ni quites el `<base>`.

## Tests

```bash
npm test
```

Comprueban las funciones de `js/lib.js`, los datos de `js/data.js`, la estructura y los enlaces de cada página, el tamaño real de las fotos, el horario del JSON-LD, el sitemap, `robots.txt`, la 404 y que no se cargue nada de Google sin que el visitante lo pida.

## Estructura

| Carpeta o archivo | Qué contiene |
|---|---|
| `index.html`, `pages/` | Las 4 páginas principales y las 2 legales |
| `404.html`, `robots.txt`, `sitemap.xml` | Página de error y archivos para buscadores |
| `css/styles.css` | Todos los estilos, **mobile-first**: la base es el móvil y se amplía con `min-width` (600, 760, 900 px…). Nunca `max-width`: `npm test` lo comprueba |
| `css/fonts.css` | `@font-face` (generado por `npm run fonts`) |
| `js/data.js` | Datos de negocio |
| `js/lib.js` | Funciones sin DOM (precios, WhatsApp, horario) |
| `js/main.js` | Comportamiento: menú, pestañas, formulario, mapa, animaciones |
| `assets/` | Fotos, tipografías e iconos |
| `tools/` | Servidor local y scripts (fotos, fuentes, dominio, pendientes) |
| `docs/superpowers/` | Especificación y plan |

## Pendiente de la clienta

- Fotos reales del local y de sus trabajos.
- Precios y horario definitivos.
- Datos legales (titular, NIF, correo) y dominio.
