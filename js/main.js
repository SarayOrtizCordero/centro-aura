/* Centro Aura — comportamiento de la web.
   Depende de js/data.js (window.AURA_DATA) y js/lib.js (window.AuraLib). */
(function () {
  'use strict';

  const data = window.AURA_DATA;
  const lib = window.AuraLib;
  if (!data || !lib) return;

  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /* Vuelca precios, duraciones, ahorros, teléfono y horario desde data.js */
  function fillData() {
    $$('[data-price]').forEach((el) => {
      el.textContent = lib.formatPrice(data.items[el.dataset.price]);
    });
    $$('[data-duration]').forEach((el) => {
      const item = data.items[el.dataset.duration];
      if (item && item.duration) el.textContent = item.duration;
    });
    $$('[data-saving]').forEach((el) => {
      el.textContent = lib.formatSaving(data.items[el.dataset.saving]);
    });
    $$('[data-phone]').forEach((el) => {
      el.textContent = data.business.phoneDisplay;
      if (el.tagName === 'A') el.href = 'tel:+' + data.business.phoneDigits;
    });
    $$('[data-hours]').forEach((dl) => {
      dl.replaceChildren(...lib.hoursToRows(data.hours).flatMap((row) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = row.days;
        dd.textContent = row.text;
        return [dt, dd];
      }));
    });
  }

  /* Enlaces de WhatsApp con el mensaje ya escrito */
  function wireWhatsApp() {
    $$('[data-wa]').forEach((el) => {
      const message = lib.waMessage(el.dataset.waKind || 'reserva', el.dataset.wa);
      el.href = lib.buildWaUrl(data.business.phoneDigits, message);
      el.target = '_blank';
      el.rel = 'noopener';
    });
  }

  /* Cabecera transparente sobre el hero que se vuelve sólida al hacer scroll */
  function initHeader() {
    const header = document.querySelector('.site-header--overlay');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* Menú móvil a pantalla completa: Esc para cerrar y foco atrapado */
  function initMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('site-menu');
    if (!toggle || !menu) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('menu-open', open);
      if (open) menu.querySelector('a').focus();
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a') && isOpen()) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = [toggle, ...$$('a', menu)];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => {
      if (event.matches && isOpen()) setOpen(false);
    });
  }

  /* Aparición suave al hacer scroll (desactivada si se pide reducir movimiento) */
  function initReveal() {
    const items = $$('.reveal');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!items.length || reduced || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((item) => observer.observe(item));
  }

  /* Pestañas de Servicios: sin JS se ven las tres categorías apiladas */
  function initTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = $$('[role="tab"]', tablist);
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

    const select = (tab, moveFocus) => {
      tabs.forEach((t, i) => {
        const active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
      });
      if (moveFocus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const last = tabs.length - 1;
        const target = {
          ArrowRight: tabs[i === last ? 0 : i + 1],
          ArrowLeft: tabs[i === 0 ? last : i - 1],
          Home: tabs[0],
          End: tabs[last]
        }[event.key];
        if (!target) return;
        event.preventDefault();
        select(target, true);
      });
    });

    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const category = lib.categoryOf(data.items, id);
      const tab = tabs.find((t) => t.dataset.category === category);
      select(tab || tabs[0], false);
      if (tab) document.getElementById(id).scrollIntoView({ block: 'start' });
    };

    tablist.hidden = false;
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  fillData();
  wireWhatsApp();
  initHeader();
  initMenu();
  initTabs();
  initReveal();
})();
