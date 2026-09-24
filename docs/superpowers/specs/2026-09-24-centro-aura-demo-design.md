# Centro Aura — Demo web · Especificación de diseño

**Fecha:** 2026-09-24
**Cliente:** Centro Aura (Paula Ramírez, peluquera titulada)
**Objetivo:** demo web minimalista y ordenada que la clienta pueda ver, aprobar y, más adelante, publicar con sus fotos y datos reales.

---

## 1. Datos de negocio

| Dato | Valor |
|---|---|
| Nombre | Centro Aura — Spa Capilar · Tricología |
| Titular | Paula Ramírez, peluquera titulada |
| Dirección | C/ Dr. Domingo Gallego, 3, 41730 Las Cabezas de San Juan (Sevilla) |
| Teléfono / WhatsApp | +34 610 16 77 64 (`wa.me/34610167764`) |
| Instagram | [@centro__aura](https://www.instagram.com/centro__aura/) |
| Frase de marca | "la energía del interior y la que envuelve al cuerpo físico" |

**Datos orientativos** (pendientes de confirmar por Paula; viven solo en `js/data.js`):

- **Horario:** L–V 9:30–14:00 y 17:00–20:30 · S 9:30–14:00 · D cerrado.
- **Precios:** ver secciones 5.2 y 5.3.

## 2. Referencia visual

Web "Diamia Spa & Lounge" enviada por la clienta. Se toma de ella:

1. Hero a pantalla completa con foto luminosa, nombre en serif grande y fina centrado, menú transparente y botón píldora "Reservar".
2. Bloques de presentación centrados: loto pequeño → etiqueta en versalitas → título serif → párrafo corto.
3. Tres tarjetas de servicio con foto, título superpuesto y botón píldora.
4. Bloque "Hola, soy…" con retrato redondo sobre fondo de color suave.
5. Sección de tarjeta regalo con loto, título y botón.

Estética de marca tomada del Instagram: local blanco y luminoso, madera clara, lino, flores secas, logo "AURA" en serif clásica con una línea fina debajo, emoji 🪷.

## 3. Sistema visual

### 3.1 Color

| Token | Hex | Uso |
|---|---|---|
| `--c-bg` | `#FFFDF7` | Fondo principal |
| `--c-bg-alt` | `#F6F0E4` | Secciones alternas, bloque "Hola, soy Paula" |
| `--c-line` | `#E9DDC8` | Bordes, separadores, fondo de tarjetas y retrato, relleno hover de botones |
| `--c-muted` | `#B2A38F` | Solo decorativo: iconos, números de pasos, tapón de los botes. **Nunca** en texto |
| `--c-accent` | `#D2C244` | Solo decorativo: loto, línea bajo el logo, subrayados hover. **Nunca** en texto |
| `--c-text` | `#4A4238` | Texto de lectura (derivado; 8,7:1 sobre `--c-bg-alt`) |
| `--c-text-soft` | `#6B6153` | Etiquetas en versalitas y texto secundario (derivado; ≥ 4,5:1 sobre `--c-bg` y `--c-bg-alt`) |
| `--c-border` | `#8C7F6D` | Bordes de campos de formulario (derivado; ≥ 3:1) |
| `--c-error` | `#9B3D2E` | Mensajes de error del formulario (derivado; ≥ 4,5:1) |

Regla: `#B2A38F` no alcanza 3:1 sobre el fondo crema (2,4:1), así que no se usa en texto de ningún tamaño.

### 3.2 Tipografía (Google Fonts, `display=swap`)

- **Cormorant Garamond** (400, 500, 400 itálica): logo, títulos y cifras de precio.
- **Jost** (300, 400, 500): texto corrido, navegación, botones y etiquetas (versalitas, `letter-spacing: .2em`).
- Escala fluida con `clamp()`: el título del hero va de ~56px (móvil) a ~120px (escritorio).

### 3.3 Componentes y detalles

- **Loto:** SVG en línea fina (`assets/icons/loto.svg`), en color `--c-accent`, encima de cada título de sección.
- **Botón píldora:** borde de 1px, fondo transparente, texto en versalitas; en hover se rellena con `--c-line`. Hay variante clara para usarlo sobre fotos.
- **Tarjeta de servicio:** foto con velo oscuro suave, título serif blanco y botón píldora claro.
- **Espaciado:** secciones con `padding-block` de ~96–160px en escritorio y ~64px en móvil. Ancho de lectura máximo de 62ch.
- **Movimiento:** aparición suave (opacidad y 12px de desplazamiento) con `IntersectionObserver`, desactivada con `prefers-reduced-motion`.

## 4. Arquitectura

Web estática en HTML, CSS y JS sin frameworks (respeta el esqueleto existente). Sin paso de build: funciona abriendo el archivo y se despliega tal cual.

```
index.html
pages/servicios.html
pages/tienda.html
pages/contacto.html
css/styles.css          tokens → base → layout → componentes → páginas → utilidades
js/data.js              fuente única de datos de negocio (window.AURA_DATA)
js/lib.js               funciones puras sin DOM (window.AuraLib); testeables en Node
js/main.js              comportamiento: menú, cabecera, pestañas, animaciones, rellenado de datos, WhatsApp
assets/img/             fotos (stock ahora; reales más adelante, mismos nombres)
assets/icons/           loto.svg, favicon.svg
tools/                  serve.mjs (servidor local), fetch-images.mjs + images.json (descarga de fotos)
tests/                  tests con node:test (npm test)
docs/superpowers/       especificación y plan
```

### 4.1 Flujo de datos

- **Contenido** (textos, estructura, nombres de servicio y descripciones) escrito en el HTML. Así es indexable y se ve aunque falle el JS.
- **Datos variables** (precios, duraciones, horario, teléfono) en `js/data.js`. `main.js` los vuelca en los elementos marcados:
  - `data-price="<id>"` → precio formateado (`desde 35 €`).
  - `data-duration="<id>"` → duración.
  - `data-hours` → lista de horario.
  - `data-phone` → teléfono visible y `href="tel:"`.
- **WhatsApp:** cualquier elemento con `data-wa="<texto>"` recibe
  `href="https://wa.me/34610167764?text=" + encodeURIComponent("Hola Paula, me gustaría reservar: <texto>")`.
  En productos el mensaje es "Hola Paula, me interesa: <texto>".
- **Respaldo:**
  - Si un `id` no existe en `data.js`, el precio muestra "Consultar".
  - Cada botón de WhatsApp lleva en el HTML un `href` genérico a `wa.me/34610167764`, para que siga funcionando sin JS.

### 4.2 Elementos comunes (se repiten en las 4 páginas)

- **Cabecera:** logo "AURA" + "SPA CAPILAR · TRICOLOGÍA", navegación (Inicio · Servicios · Tienda · Contacto) y botón píldora "Reservar" (WhatsApp).
  - En la portada es transparente sobre el hero y pasa a fondo `--c-bg` con sombra suave tras 40px de scroll.
  - En las páginas interiores tiene siempre fondo sólido.
  - En móvil (< 900px) se convierte en hamburguesa con menú a pantalla completa, bloqueo del scroll, cierre con Esc y `aria-expanded`.
- **Pie:** logo, dirección, teléfono, horario, Instagram, "Cómo llegar" (Google Maps) y los enlaces "Aviso legal" y "Privacidad" (con `href="#"`; es una demo). Incluye "© 2026 Centro Aura".
- **WhatsApp flotante:** solo en móvil, abajo a la derecha, con `aria-label`.

## 5. Páginas

### 5.1 Inicio — `index.html`

1. **Hero** (`100svh`): foto del salón y el velo crema. `h1` "AURA", subtítulo "SPA CAPILAR · TRICOLOGÍA", botón "Reservar cita" y la flecha que lleva a la presentación.
2. **Presentación:** loto, etiqueta "PELUQUERÍA · SALUD CAPILAR" y título "Centro Aura". Párrafo sobre el cuidado del cabello desde la raíz y la frase de marca en itálica.
3. **Tres destacados:** Spa Capilar · Consulta Tricológica · Terapias Capilares. Cada tarjeta enlaza a `pages/servicios.html#<id>`.
4. **Hola, soy Paula** (fondo `--c-bg-alt`): retrato redondo, etiqueta "PELUQUERA TITULADA · FUNDADORA", 2–3 párrafos y el enlace a Instagram.
5. **Jaldún:** etiqueta "COSMÉTICA NATURAL", título "Salud capilar Jaldún", los 3 champús en miniatura y el botón "Ver tienda".
6. **Tarjeta regalo:** loto, título "Regala Aura", texto corto y el botón "Pedir tarjeta regalo" (WhatsApp).
7. **Visítanos:** `iframe` de Google Maps (`https://www.google.com/maps?q=<dirección>&output=embed`, `loading="lazy"`, `title`), junto a la dirección, el horario y el botón "Cómo llegar".

### 5.2 Servicios — `pages/servicios.html`

- Cabecera de página: loto, título "Servicios" y una línea introductoria.
- Pestañas de categoría (`role="tablist"`, navegables con flechas): **Salud capilar · Tratamientos · Peluquería**. Sin JS, se muestran las tres secciones apiladas.
- Cada servicio: nombre, descripción (2–3 líneas), duración, precio y botón "Reservar". Cada uno lleva `id` para enlazar desde la portada. Al entrar con `#<id>` en la URL, se activa la pestaña de su categoría y se hace scroll hasta el servicio.

| id | Categoría | Servicio | Duración | Precio orientativo |
|---|---|---|---|---|
| `consulta-tricologica` | Salud capilar | Consulta tricológica (con microcámara) | 45 min | 30 € |
| `spa-capilar` | Salud capilar | Spa capilar | 60 min | desde 35 € |
| `terapias-capilares` | Salud capilar | Terapias capilares | 60 min | desde 40 € |
| `barros` | Salud capilar | Barros naturales | 45 min | desde 30 € |
| `alisados` | Tratamientos | Alisados | 2–3 h | desde 90 € |
| `hidratacion` | Tratamientos | Hidratación y reparación | 45 min | desde 25 € |
| `corte` | Peluquería | Corte y peinado | 45 min | desde 18 € |
| `peinados` | Peluquería | Peinados y recogidos | 60 min | desde 25 € |

- **Bloque "¿Cómo es una consulta tricológica?"** en 3 pasos numerados: Diagnóstico con microcámara → Plan personalizado → Seguimiento.
- CTA final: "¿Dudas sobre qué necesita tu cabello?" y el botón "Escríbeme".

### 5.3 Tienda — `pages/tienda.html`

- Nota visible: "Recogida en el salón. Te confirmamos disponibilidad por WhatsApp."
- **Productos Jaldún** (fichas con foto, nombre, indicación, precio y el botón "Lo quiero"):

| id | Producto | Indicación | Precio orientativo |
|---|---|---|---|
| `jaldun-equilibrante` | Champú Equilibrante | Caspa y grasa; equilibra el cuero cabelludo | 22 € |
| `jaldun-vitalzen` | Champú Vitalzen Fortificante | Caída; estimula la microcirculación | 24 € |
| `jaldun-multiefecto` | Champú Multiefecto Regulador | Cuero cabelludo sensible o desequilibrado | 22 € |

- **Bonos:**

| id | Bono | Precio | Ahorro mostrado |
|---|---|---|---|
| `bono-spa-5` | 5 sesiones de Spa Capilar | 150 € | ahorras 25 € |
| `bono-tricologico` | Consulta tricológica + 4 terapias capilares | 170 € | ahorras 20 € |

- **Tarjetas regalo:** 25 € · 50 € · 75 € · "El servicio que elijas". Cada una con su botón "Regalar" (WhatsApp).

### 5.4 Contacto — `pages/contacto.html`

- Tarjetas de contacto: Teléfono (`tel:`), WhatsApp, Instagram y Dirección (con "Cómo llegar").
- Horario completo desde `data.js`.
- Mapa incrustado.
- **Formulario "Pregúntanos":** nombre (obligatorio), servicio de interés (`select` con los servicios de 5.2 + "Otro") y mensaje (obligatorio). Usa la validación nativa (`required`) y los mensajes de error junto al campo. Al enviar no hay servidor: se abre WhatsApp con el mensaje compuesto `Hola Paula, soy <nombre>. Me interesa: <servicio>. <mensaje>`.

## 6. Imágenes

Fotos de stock de Unsplash (licencia libre) con estética crema y lino, descargadas a `assets/img/` en WebP con nombres estables, para cambiarlas por las reales sin tocar código:

`hero-salon`, `destacado-spa`, `destacado-tricologia`, `destacado-terapias`, `tarjeta-regalo`, `textura-lino` (fondo de las cabeceras interiores) y una foto por categoría de servicio: `servicio-salud`, `servicio-tratamientos`, `servicio-peluqueria`.

**Retrato de Paula:** sin foto de stock, por decisión del usuario. Es un círculo en dorado suave de la paleta hasta tener su foto real (`paula-retrato.webp`, 640×640), y el HTML deja un comentario con la etiqueta `<img>` lista para pegar.

Los productos Jaldún y las tarjetas regalo no usan foto de stock. Se dibujan con CSS (un bote o una tarjeta en tonos de la paleta, con el nombre en serif), que queda bien y es honesto para una demo. La lista de fotos, con su ID de Unsplash y su tamaño, vive en `tools/images.json`. Los créditos van en `assets/img/CREDITOS.md`. Todas las imágenes llevan `alt`, `width` y `height`. Todas salvo el hero llevan `loading="lazy"`.

## 7. Accesibilidad, rendimiento y SEO

- **Estructura:** HTML semántico (`header`, `nav`, `main`, `section` con encabezado, `footer`), un `h1` por página y un enlace "Saltar al contenido".
- **Contraste:** AA en todo el texto; el foco es visible (`:focus-visible`, contorno de 2px en `--c-text`).
- **Teclado:** el menú, las pestañas y el formulario se manejan por completo con teclado.
- **Rendimiento:** 2 familias tipográficas con `preconnect`; hero con `fetchpriority="high"`; sin librerías JS externas.
- **SEO local:**
  - `<title>` y `meta description` únicos por página (p. ej. "Spa capilar y tricología en Las Cabezas de San Juan | Centro Aura").
  - `lang="es"` y `canonical` relativo.
  - Open Graph (título, descripción, imagen del hero).
  - JSON-LD `HairSalon` en la portada con dirección, teléfono, horario, `geo` aproximado e Instagram en `sameAs`.

## 8. Verificación

Antes de dar la demo por terminada:

1. Captura de cada página a 375px, 768px y 1440px en el navegador integrado; sin scroll horizontal.
2. Consola sin errores en las 4 páginas.
3. Cada `data-wa` genera la URL de WhatsApp esperada (se comprueba en la consola con JS).
4. Menú móvil: se abre y se cierra, funciona Esc, el foco queda atrapado y `aria-expanded` es correcto.
5. Pestañas de Servicios con ratón y teclado; el enlace `servicios.html#spa-capilar` abre la pestaña correcta.
6. El formulario de Contacto bloquea el envío con campos vacíos y compone bien el mensaje.
7. Con el JS desactivado, el contenido sigue visible y los botones de WhatsApp siguen funcionando (con el enlace genérico). En móvil sin JS el menú hamburguesa no abre, pero el pie repite todos los enlaces de navegación.
8. Tests automáticos (`npm test`, con `node:test` y sin dependencias): funciones puras, integridad de `data.js`, estructura de cada página, recursos locales existentes, dimensiones reales de las imágenes iguales a sus atributos `width` y `height`, y horario del JSON-LD igual al de `data.js`.

## 9. Fuera de alcance

Pago online, carrito, reservas con calendario, panel de administración, blog, multidioma y banner de cookies (la demo no usa cookies propias; el mapa de Google se carga en un `iframe`, lo que se revisará al pasar a producción).

## 10. Pendiente de la clienta (no bloquea la demo)

- Fotos reales: local, retrato de Paula, trabajos y productos.
- Precios y horario definitivos (solo se edita `js/data.js`).
- Textos legales reales y dominio.
