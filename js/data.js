/* Centro Aura — datos de negocio.
   Los precios, duraciones, el horario y el teléfono que se muestran en la web
   se leen de aquí. Precios y horario ORIENTATIVOS: pendientes de confirmar por Paula.
   Si cambias el horario, actualiza también el bloque JSON-LD de index.html
   (npm test avisa si no coinciden).
   Si cambias el teléfono, sustituye también "34610167764" en los enlaces de
   respaldo del HTML (wa.me / tel:) y en el JSON-LD de index.html: este
   archivo no controla esos enlaces fijos. */
(function (root) {
  'use strict';

  const AURA_DATA = {
    business: {
      name: 'Centro Aura',
      owner: 'Paula',
      phoneDisplay: '+34 610 16 77 64',
      phoneDigits: '34610167764',
      address: 'C/ Dr. Domingo Gallego, 3, 41730 Las Cabezas de San Juan (Sevilla)',
      instagram: 'https://www.instagram.com/centro__aura/'
    },

    hours: [
      { days: 'Lunes – Viernes', schemaDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], slots: ['9:30 – 14:00', '17:00 – 20:30'] },
      { days: 'Sábado', schemaDays: ['Saturday'], slots: ['9:30 – 14:00'] },
      { days: 'Domingo', schemaDays: ['Sunday'], slots: [] }
    ],

    categories: [
      { id: 'salud', label: 'Salud capilar' },
      { id: 'tratamientos', label: 'Tratamientos' },
      { id: 'peluqueria', label: 'Peluquería' }
    ],

    items: {
      // Servicios
      'consulta-tricologica': { type: 'servicio', category: 'salud', name: 'Consulta tricológica', duration: '45 min', price: 30, from: false },
      'spa-capilar':          { type: 'servicio', category: 'salud', name: 'Spa capilar', duration: '60 min', price: 35, from: true },
      'terapias-capilares':   { type: 'servicio', category: 'salud', name: 'Terapias capilares', duration: '60 min', price: 40, from: true },
      'barros':               { type: 'servicio', category: 'salud', name: 'Barros naturales', duration: '45 min', price: 30, from: true },
      'alisados':             { type: 'servicio', category: 'tratamientos', name: 'Alisados', duration: '2–3 h', price: 90, from: true },
      'hidratacion':          { type: 'servicio', category: 'tratamientos', name: 'Hidratación y reparación', duration: '45 min', price: 25, from: true },
      'corte':                { type: 'servicio', category: 'peluqueria', name: 'Corte y peinado', duration: '45 min', price: 18, from: true },
      'peinados':             { type: 'servicio', category: 'peluqueria', name: 'Peinados y recogidos', duration: '60 min', price: 25, from: true },

      // Productos Jaldún
      'jaldun-equilibrante': { type: 'producto', name: 'Champú Equilibrante Jaldún', price: 22 },
      'jaldun-vitalzen':     { type: 'producto', name: 'Champú Vitalzen Fortificante Jaldún', price: 24 },
      'jaldun-multiefecto':  { type: 'producto', name: 'Champú Multiefecto Regulador Jaldún', price: 22 },

      // Bonos
      'bono-spa-5':       { type: 'bono', name: 'Bono 5 sesiones de Spa Capilar', price: 150, saving: 25 },
      'bono-tricologico': { type: 'bono', name: 'Bono tratamiento tricológico', price: 170, saving: 20 },

      // Tarjetas regalo
      'regalo-25': { type: 'regalo', name: 'Tarjeta regalo de 25 €', price: 25 },
      'regalo-50': { type: 'regalo', name: 'Tarjeta regalo de 50 €', price: 50 },
      'regalo-75': { type: 'regalo', name: 'Tarjeta regalo de 75 €', price: 75 }
    }
  };

  root.AURA_DATA = AURA_DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = AURA_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
