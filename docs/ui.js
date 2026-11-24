/* Presentation only. Keep all storage, editor, and sync behavior in their original modules. */
(() => {
  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.getElementById('menuButton');
  const nav = document.getElementById('nav');
  const view = document.getElementById('view');
  const mobile = matchMedia('(max-width: 720px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Each symbol shares a 24-unit grid and the same rounded stroke.
  Object.assign(paths, {
    home: 'M3 10.2 12 3l9 7.2 M5 9v10a2 2 0 0 0 2 2h3v-7h4v7h3a2 2 0 0 0 2-2V9',
    bulb: 'M9 17c0-2.4-3.5-3.7-3.5-7.6a6.5 6.5 0 0 1 13 0c0 3.9-3.5 5.2-3.5 7.6z M9.5 20h5 M11 22h2',
    calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M7.5 3v4 M16.5 3v4 M3 10h18 M7 14h2 M13 14h2',
    chart: 'M3 3v16a2 2 0 0 0 2 2h16 M8 16v-5 M13 16V5 M18 16V9',
    user: 'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M4 21v-2c0-3 3.6-5 8-5s8 2 8 5v2',
    users: 'M6 8a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0 M2.5 20v-1.4c0-2.7 3-4.5 7-4.5s7 1.8 7 4.5V20 M16 4.8a3.3 3.3 0 0 1 0 6.4 M18.5 14.8c2 .9 3 2.1 3 4V20',
    bell: 'M5 16.8h14c-1.2-1.3-1.8-2.8-1.8-6.5a5.2 5.2 0 0 0-10.4 0c0 3.7-.6 5.2-1.8 6.5z M10 20a2.3 2.3 0 0 0 4 0 M12 3V2',
    desk: 'M7.3 18.2h10.2a4.5 4.5 0 0 0 .6-9A6.1 6.1 0 0 0 6.4 8a5.2 5.2 0 0 0 .9 10.2z M9.5 12.6l1.8 1.8 3.7-3.8',
    mic: 'M8.6 5.5a3.4 3.4 0 1 1 6.8 0v5.4a3.4 3.4 0 1 1-6.8 0z M5.4 10.6a6.6 6.6 0 0 0 13.2 0 M12 17.4v4 M8.8 21.4h6.4',
    award: 'M6.8 7.6a5.2 5.2 0 1 0 10.4 0 5.2 5.2 0 1 0-10.4 0 M8.5 12l-2 9 5.5-3 5.5 3-2-9',
    code: 'm7.5 7.5-4.8 4.5 4.8 4.5 M16.5 7.5l4.8 4.5-4.8 4.5 M14 4l-4 16',
    project: 'M3 7V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2 M3 8.5h17.3l-1.1 10a2 2 0 0 1-2 1.7H5.3a2 2 0 0 1-2-1.8z',
    story: 'M12 6.2C9.4 4.5 5.8 4.4 2.5 5.2v13.2c3.3-.8 6.9-.5 9.5 1.4 2.6-1.9 6.2-2.2 9.5-1.4V5.2c-3.3-.8-6.9-.7-9.5 1z M12 6.2v13',
    chat: 'M6 3.8h12a3 3 0 0 1 3 3v7.6a3 3 0 0 1-3 3h-7.1L5 21v-3.8a3 3 0 0 1-2-2.8V6.8a3 3 0 0 1 3-3z M7.6 8.8h8.8 M7.6 12.4H13',
    pen: 'M4.2 15.8 15.9 4.1a2.6 2.6 0 0 1 3.7 3.7L7.9 19.5l-4.7.9z M14.1 5.9l3.7 3.7 M13 20.4h7.7',
    copy: 'M10 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z M16 5V4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1h1',
    layers: 'm3 8 9-5 9 5-9 5z M3 12.3l9 5 9-5 M3 16.6l9 5 9-5'
  });
  render();

  function setMenu(open) {
    sidebar.classList.toggle('menuOpen', open);
    menuButton.setAttribute('aria-expanded', String(open));
  }
  menuButton.addEventListener('click', () => setMenu(!sidebar.classList.contains('menuOpen')));
  mobile.addEventListener('change', () => setMenu(false));
  document.addEventListener('pointerdown', event => {
    if (!sidebar.contains(event.target)) setMenu(false);
  });
  sidebar.addEventListener('focusout', event => {
    if (event.relatedTarget && !sidebar.contains(event.relatedTarget)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('menuOpen')) {
      setMenu(false);
      menuButton.focus();
    }
  });
  nav.addEventListener('click', event => {
    if (!event.target.closest('button')) return;
    setMenu(false);
    view.focus({preventScroll:true});
    if (!reducedMotion.matches && typeof view.animate === 'function') {
      view.animate([{opacity:.65}, {opacity:1}],
        {duration:170,easing:'ease-out'});
    }
  });
})();
