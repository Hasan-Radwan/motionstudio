/*
 * Google Analytics 4 loader for Rotion App — shared by every page (the SPA shell
 * at / , /ar , /app and the static legal/admin pages), so the Measurement ID
 * lives in exactly ONE place.
 *
 * SET YOUR ID BELOW. Until it's a real "G-XXXXXXXXXX" id this script is a no-op
 * (nothing loads, no cookies, no tracking), so it's safe to ship un-configured.
 *
 * You can also override it per-deploy without editing this file by adding, before
 * this script in the page <head>:  <meta name="ga-id" content="G-XXXXXXXXXX" />
 */
(function () {
  var GA_ID = 'G-XXXXXXXXXX'; // ← replace with your GA4 Measurement ID

  // Optional per-page override via <meta name="ga-id" content="...">.
  try {
    var m = document.querySelector('meta[name="ga-id"]');
    if (m && m.content) GA_ID = m.content.trim();
  } catch (e) {
    /* ignore */
  }

  // Not configured (or a Do-Not-Track browser) → do nothing.
  if (!/^G-[A-Z0-9]{4,}$/i.test(GA_ID)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  // anonymize_ip trims the visitor IP; send_page_view fires the initial page_view.
  gtag('config', GA_ID, { anonymize_ip: true });

  // Helper for the studio SPA: call on soft (pushState) route changes so /app and
  // the landing views each register as a page_view even without a full reload.
  window.trackPageView = function (path) {
    gtag('event', 'page_view', {
      page_path: path || location.pathname,
      page_location: location.href,
      page_title: document.title,
    });
  };
})();
