(function () {
  'use strict';

  // Guard: only run in real browser pages, not workers/iframes
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.top !== window.self) return;

  // Mailchimp endpoint (note the & not &amp;)
  var MC_ACTION = 'https://thefalafeltheory.us22.list-manage.com/subscribe/post?u=44c6260e44554e7b992e09185&id=083452c971&f_id=0055c2e1f0';
  var EXIT_SESSION_KEY = 'tswExitIntentShown';

  function markShown() {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(EXIT_SESSION_KEY, 'true');
      }
    } catch (e) {}
  }

  function hasShown() {
    try {
      return (
        window.sessionStorage &&
        window.sessionStorage.getItem(EXIT_SESSION_KEY) === 'true'
      );
    } catch (e) {
      return false;
    }
  }

  // Page scroll lock while modal open
  function lockBody() {
    try {
      var b = document.body;
      if (!b) return;
      if (!b.dataset.tswExitOverflowSaved) {
        b.dataset.tswExitOverflowSaved = b.style.overflow || '';
      }
      b.style.overflow = 'hidden';
    } catch (e) {}
  }

  function unlockBody() {
    try {
      var b = document.body;
      if (!b) return;
      if (b.dataset.tswExitOverflowSaved !== undefined) {
        b.style.overflow = b.dataset.tswExitOverflowSaved;
        delete b.dataset.tswExitOverflowSaved;
      }
    } catch (e) {}
  }

  if (hasShown()) {
    return;
  }

  function initExitForm(root) {
    var form = root.querySelector('#tsw-mc-form');
    if (!form) return;

    var btn = form.querySelector('#tsw-submit');
    var decline = form.querySelector('#tsw-decline');
    var msgOK = form.querySelector('#tsw-success');
    var msgErr = form.querySelector('#tsw-error');
    var iframe = form.querySelector('#tsw-mc-fallback');

    if (!btn || !msgOK || !msgErr || !iframe) return;

    function ok() {
      msgErr.classList.remove('show');
      msgOK.classList.add('show');
      btn.disabled = true;
    }

    function err(t) {
      msgOK.classList.remove('show');
      msgErr.textContent =
        t || 'Something went wrong. Please try again.';
      msgErr.classList.add('show');
      btn.disabled = false;
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    function toJsonpUrl() {
      var act = new URL(form.action);
      return {
        base: act.origin + act.pathname.replace('/post', '/post-json'),
        params: new URLSearchParams(act.search)
      };
    }

    function fdParams() {
      var fd = new FormData(form);
      var p = new URLSearchParams();
      fd.forEach(function (v, k) {
        p.append(k, v);
      });
      return p;
    }

    function submitIframe() {
      var orig = form.getAttribute('target');
      form.setAttribute('target', 'tsw-mc-fallback');

      var t = setTimeout(ok, 1500);

      function onLoad() {
        clearTimeout(t);
        ok();
        iframe.removeEventListener('load', onLoad);
      }

      iframe.addEventListener('load', onLoad);
      form.submit();

      if (orig) {
        form.setAttribute('target', orig);
      } else {
        form.removeAttribute('target');
      }
    }

    function submitJsonp() {
      var u;
      try {
        u = toJsonpUrl();
      } catch (e) {
        err();
        return;
      }

      var base = u.base;
      var params = u.params;
      var extra = fdParams();
      extra.forEach(function (v, k) {
        params.set(k, v);
      });

      var cb = 'mc_cb_' + Date.now();
      params.set('c', cb);

      var safetyShown = false;
      var safety = setTimeout(function () {
        safetyShown = true;
        ok();
      }, 5500);

      window[cb] = function (resp) {
        clearTimeout(safety);
        if (safetyShown) return;

        if (resp && resp.result === 'success') {
          ok();
        } else {
          var m =
            resp && resp.msg
              ? String(resp.msg).replace(/<[^>]+>/g, '')
              : null;
          err(m || 'Subscription failed. Please try again.');
        }

        try {
          delete window[cb];
        } catch (e) {
          window[cb] = void 0;
        }

        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      var script = document.createElement('script');
      script.src = base + '?' + params.toString();
      script.onerror = function () {
        clearTimeout(safety);
        submitIframe();
      };
      document.body.appendChild(script);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msgOK.classList.remove('show');
      msgErr.classList.remove('show');

      var first = form.querySelector('#mce-FNAME').value.trim();
      var email = form.querySelector('#mce-EMAIL').value.trim();
      var consent = form.querySelector('#tsw-consent').checked;

      if (!first) {
        err('Please enter your first name.');
        return;
      }
      if (!email || !emailRe.test(email)) {
        err('Please enter a valid email address.');
        return;
      }
      if (!consent) {
        err('Please tick the consent checkbox to proceed.');
        return;
      }

      btn.disabled = true;
      submitJsonp();
    });

    // "No Thanks, Exit Now" – close popup & never show again this session
    if (decline) {
      decline.addEventListener('click', function () {
        markShown();
        unlockBody();
        if (root && root.parentNode) {
          root.parentNode.removeChild(root);
        }
      });
    }
  }

  function createPopup() {
    if (document.getElementById('tsw-exit-overlay')) return;

    var s = document.getElementById('tsw-exit-styles');
    if (!s) {
      s = document.createElement('style');
      s.id = 'tsw-exit-styles';
      s.type = 'text/css';
      s.textContent =
        // Design tokens (inspired by Localization Kits page)
        ":root{" +
        "--tsw-brand:#ED1C24;" +
        "--tsw-bg:#ffffff;" +
        "--tsw-bg-soft:#fafafa;" +
        "--tsw-ink:#222222;" +
        "--tsw-ink-dim:#555555;" +
        "--tsw-ink-muted:#777777;" +
        "--tsw-ink-inv:#ffffff;" +
        "--tsw-border:rgba(0,0,0,.08);" +
        "--tsw-shadow-1:0 10px 26px rgba(0,0,0,.18);" +
        "--tsw-shadow-2:0 18px 40px rgba(0,0,0,.28);" +
        "--tsw-radius:16px;" +
        "--tsw-space-1:.25rem;" +
        "--tsw-space-2:.5rem;" +
        "--tsw-space-3:.75rem;" +
        "--tsw-space-4:1rem;" +
        "--tsw-space-5:1.5rem;" +
        "--tsw-space-6:2rem;" +
        "--tsw-ring:0 0 0 3px rgba(237,28,36,.3);" +
        "--tsw-font:'Adagio Slab', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;" +
        "}" +
        "@media(prefers-color-scheme:dark){" +
        ":root{" +
        "--tsw-bg:#101113;" +
        "--tsw-bg-soft:#0b0c0d;" +
        "--tsw-ink:#e9e9e9;" +
        "--tsw-ink-dim:#bdbdbd;" +
        "--tsw-ink-muted:#9a9a9a;" +
        "--tsw-border:rgba(255,255,255,.08);" +
        "--tsw-shadow-1:0 12px 28px rgba(0,0,0,.55);" +
        "--tsw-shadow-2:0 18px 48px rgba(0,0,0,.7);" +
        "}" +
        "}" +
        "@keyframes tswFadeIn{" +
        "from{opacity:0;}to{opacity:1;}" +
        "}" +
        "@keyframes tswSlideUp{" +
        "from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}" +
        "}" +
        // Overlay
        "#tsw-exit-overlay{" +
        "position:fixed;" +
        "inset:0;" +
        "z-index:999999;" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "padding:16px;" +
        "box-sizing:border-box;" +
        "background:rgba(10,10,15,.68);" +
        "backdrop-filter:blur(10px);" +
        "-webkit-backdrop-filter:blur(10px);" +
        "animation:tswFadeIn .18s ease-out;" +
        "overflow-y:auto;" +
        "overflow-x:hidden;" +
        "}" +
        "#tsw-exit-modal{" +
        "width:min(520px,100%);" +
        "max-width:520px;" +
        "box-sizing:border-box;" +
        "position:relative;" +
        "font-family:var(--tsw-font);" +
        "background:transparent;" +
        "animation:tswSlideUp .2s ease-out;" +
        "}" +
        "#tsw-exit-close{" +
        "position:absolute;" +
        "top:10px;" +
        "right:12px;" +
        "border:none;" +
        "background:transparent;" +
        "color:var(--tsw-ink);" +
        "font-size:18px;" +
        "cursor:pointer;" +
        "z-index:2;" +
        "width:32px;" +
        "height:32px;" +
        "border-radius:999px;" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "transition:background .14s ease, transform .1s ease;" +
        "}" +
        "#tsw-exit-close:hover{" +
        "background:rgba(0,0,0,.06);" +
        "transform:translateY(-1px);" +
        "}" +
        "#tsw-exit-close:focus{" +
        "outline:none;" +
        "box-shadow:var(--tsw-ring);" +
        "}" +
        // Card shell
        "#tsw-mc-card{" +
        "width:100%;" +
        "margin:0 auto;" +
        "padding:1px;" +
        "border-radius:22px;" +
        "background:linear-gradient(135deg,rgba(237,28,36,.15),rgba(255,255,255,0));" +
        "box-shadow:var(--tsw-shadow-2);" +
        "}" +
        "#tsw-mc-card-inner{" +
        "border-radius:21px;" +
        "background:var(--tsw-bg);" +
        "color:var(--tsw-ink);" +
        "padding:var(--tsw-space-5) var(--tsw-space-5) calc(var(--tsw-space-4)*1.2);" +
        "box-sizing:border-box;" +
        "border:1px solid var(--tsw-border);" +
        "}" +
        ".tsw-icon-badge{" +
        "width:40px;" +
        "height:40px;" +
        "border-radius:999px;" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "background:#ffffff;" +
        "border:1px solid rgba(0,0,0,.06);" +
        "box-shadow:0 8px 18px rgba(0,0,0,.12);" +
        "font-size:22px;" +
        "margin-bottom:var(--tsw-space-3);" +
        "}" +
        "#tsw-mc-card h3{" +
        "margin:0 0 var(--tsw-space-3) 0;" +
        "font-size:1.45rem;" +
        "line-height:1.25;" +
        "color:#ED1C24;" +
        "}" +
        "#tsw-mc-card .tsw-subtitle{" +
        "margin:0 0 var(--tsw-space-4) 0;" +
        "color:var(--tsw-ink-dim);" +
        "font-size:.95rem;" +
        "}" +
        // Layout for fields
        "#tsw-mc-card .tsw-row{" +
        "display:grid;" +
        "grid-template-columns:1fr;" +
        "gap:var(--tsw-space-3);" +
        "}" +
        "#tsw-mc-card .tsw-row.names{" +
        "grid-template-columns:1fr;" +
        "}" +
        "@media(min-width:720px){" +
        "#tsw-mc-card .tsw-row.names{grid-template-columns:1fr 1fr;}" +
        "}" +
        "#tsw-mc-card .tsw-field{" +
        "display:grid;" +
        "gap:0.35rem;" +
        "}" +
        "#tsw-mc-card .tsw-label{" +
        "font-weight:700;" +
        "font-size:.88rem;" +
        "color:var(--tsw-ink);" +
        "}" +
        ".tsw-asterisk{color:#ED1C24;}" +
        // Inputs
        "#tsw-mc-card .tsw-input{" +
        "appearance:none;" +
        "width:100%;" +
        "border-radius:12px;" +
        "border:1px solid var(--tsw-border);" +
        "background:var(--tsw-bg-soft);" +
        "color:var(--tsw-ink);" +
        "padding:.7rem .8rem;" +
        "font-size:.95rem;" +
        "outline:none;" +
        "box-shadow:var(--tsw-shadow-1);" +
        "transition:border-color .15s ease, box-shadow .15s ease, background .15s ease;" +
        "}" +
        "#tsw-mc-card .tsw-input:focus{" +
        "border-color:var(--tsw-brand);" +
        "box-shadow:var(--tsw-ring), var(--tsw-shadow-1);" +
        "background:#ffffff;" +
        "}" +
        "#tsw-mc-card .tsw-input::placeholder{" +
        "color:var(--tsw-ink-muted);" +
        "}" +
        // Consent
        "#tsw-mc-card .tsw-consent{" +
        "border-radius:14px;" +
        "border:1px dashed var(--tsw-border);" +
        "padding:var(--tsw-space-3);" +
        "margin-top:var(--tsw-space-3);" +
        "background:var(--tsw-bg-soft);" +
        "}" +
        "#tsw-mc-card .tsw-consent legend{" +
        "font-size:.78rem;" +
        "text-transform:uppercase;" +
        "letter-spacing:.08em;" +
        "font-weight:700;" +
        "color:var(--tsw-ink-muted);" +
        "padding:0 var(--tsw-space-1);" +
        "}" +
        "#tsw-mc-card .tsw-checkbox-wrap{" +
        "display:flex;" +
        "align-items:flex-start;" +
        "gap:.55rem;" +
        "margin-top:.5rem;" +
        "}" +
        "#tsw-mc-card .tsw-checkbox{" +
        "width:18px;" +
        "height:18px;" +
        "border-radius:4px;" +
        "border:1px solid var(--tsw-border);" +
        "accent-color:var(--tsw-brand);" +
        "}" +
        "#tsw-mc-card .tsw-checkbox:focus{" +
        "outline:none;" +
        "box-shadow:var(--tsw-ring);" +
        "}" +
        // Actions / buttons
        "#tsw-mc-card .tsw-actions{" +
        "margin-top:var(--tsw-space-5);" +
        "display:flex;" +
        "flex-direction:column;" +
        "gap:.6rem;" +
        "}" +
        "@media(min-width:520px){" +
        "#tsw-mc-card .tsw-actions{flex-direction:row;}" +
        "}" +
        "#tsw-mc-card .tsw-btn{" +
        "flex:1 0 auto;" +
        "border:none;" +
        "outline:none;" +
        "padding:.85rem 1rem;" +
        "border-radius:999px;" +
        "font-weight:700;" +
        "font-size:.98rem;" +
        "cursor:pointer;" +
        "transition:transform .12s ease, filter .12s ease, box-shadow .12s ease, background .12s ease;" +
        "display:inline-flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "gap:.4rem;" +
        "}" +
        "#tsw-mc-card .tsw-btn-primary{" +
        "background:var(--tsw-brand);" +
        "color:var(--tsw-ink-inv);" +
        "box-shadow:0 10px 24px rgba(237,28,36,.28);" +
        "}" +
        "#tsw-mc-card .tsw-btn-primary:hover{" +
        "filter:brightness(1.06);" +
        "box-shadow:0 14px 32px rgba(237,28,36,.34);" +
        "transform:translateY(-1px);" +
        "}" +
        "#tsw-mc-card .tsw-btn-primary:active{" +
        "transform:translateY(0);" +
        "box-shadow:0 8px 20px rgba(237,28,36,.25);" +
        "}" +
        "#tsw-mc-card .tsw-btn-secondary{" +
        "background:#ffffff;" +
        "color:var(--tsw-ink-dim);" +
        "border:1px solid var(--tsw-border);" +
        "box-shadow:0 4px 10px rgba(0,0,0,.06);" +
        "}" +
        "#tsw-mc-card .tsw-btn-secondary:hover{" +
        "background:#f7f7f7;" +
        "}" +
        "#tsw-mc-card .tsw-btn:focus{" +
        "box-shadow:var(--tsw-ring);" +
        "}" +
        // Messages
        "#tsw-mc-card .tsw-msg{" +
        "display:none;" +
        "margin-top:var(--tsw-space-3);" +
        "font-size:.9rem;" +
        "}" +
        "#tsw-mc-card .tsw-msg.show{display:block;}" +
        "#tsw-mc-card .tsw-success{" +
        "border-radius:var(--tsw-radius);" +
        "background:#fff7e0;" +
        "border:1px solid #ffe49e;" +
        "color:#7a5a00;" +
        "padding:.75rem .9rem;" +
        "}" +
        "#tsw-mc-card .tsw-success .line-2{" +
        "font-weight:700;" +
        "background:#ffef99;" +
        "padding:.12rem .35rem;" +
        "border-radius:6px;" +
        "display:inline-block;" +
        "margin-top:.35rem;" +
        "}" +
        "#tsw-mc-card .tsw-error{" +
        "border-radius:var(--tsw-radius);" +
        "background:#fff3f3;" +
        "border:1px solid #ffd0d4;" +
        "color:#b30017;" +
        "padding:.75rem .9rem;" +
        "}" +
        // Trust copy
        "#tsw-mc-card .tsw-trust{" +
        "margin-top:var(--tsw-space-3);" +
        "font-size:.8rem;" +
        "color:var(--tsw-ink-muted);" +
        "text-align:center;" +
        "}" +
        // Visually hidden absolute
        "#tsw-mc-card .visually-hidden-abs{" +
        "position:absolute!important;" +
        "width:1px!important;" +
        "height:1px!important;" +
        "margin:-1px!important;" +
        "border:0!important;" +
        "padding:0!important;" +
        "white-space:nowrap!important;" +
        "clip-path:inset(50%)!important;" +
        "clip:rect(0 0 0 0)!important;" +
        "overflow:hidden!important;" +
        "}" +
        "#mce-error-response,#mce-success-response{display:none!important;}" +
        // Mobile tweaks
        "@media(max-width:480px){" +
        "#tsw-exit-modal{width:100%;}" +
        "#tsw-mc-card-inner{padding:var(--tsw-space-4) var(--tsw-space-4) var(--tsw-space-4);}" +
        ".tsw-icon-badge{width:34px;height:34px;font-size:19px;margin-bottom:var(--tsw-space-2);}" +
        "#tsw-mc-card h3{font-size:1.25rem;}" +
        "#tsw-mc-card .tsw-actions{margin-top:var(--tsw-space-4);}" +
        "#tsw-mc-card .tsw-btn{padding:.8rem .9rem;font-size:.9rem;}" +
        "}";

      document.head.appendChild(s);
    }

    var overlay = document.createElement('div');
    overlay.id = 'tsw-exit-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var modal = document.createElement('div');
    modal.id = 'tsw-exit-modal';

    function closeOverlay() {
      unlockBody();
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      window.removeEventListener('keydown', onEsc);
    }

    function onEsc(e) {
      if (e.key === 'Escape') {
        closeOverlay();
      }
    }

    var closeBtn = document.createElement('button');
    closeBtn.id = 'tsw-exit-close';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function () {
      closeOverlay();
    });

    modal.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    overlay.addEventListener('click', function () {
      closeOverlay();
    });

    modal.innerHTML =
      modal.innerHTML +
      '<div id="tsw-mc-card" role="form" aria-labelledby="tsw-form-title">' +
      '<div id="tsw-mc-card-inner">' +
      '<div class="tsw-icon-badge" aria-hidden="true">🇸🇬</div>' +
      '<h3 id="tsw-form-title">Get your free Singapore Way</h3>' +
      '<p class="tsw-subtitle">Enter your details and we will email you a concise, beautifully formatted summary you can keep, share, and revisit anytime.</p>' +
      '<form id="tsw-mc-form" action="' +
      MC_ACTION +
      '" method="post" novalidate>' +
      '<div class="tsw-row names">' +
      '<div class="tsw-field">' +
      '<label class="tsw-label" for="mce-FNAME">First Name <span class="tsw-asterisk">*</span></label>' +
      '<input class="tsw-input" type="text" id="mce-FNAME" name="FNAME" required autocomplete="given-name" placeholder="e.g. Aisha">' +
      '</div>' +
      '<div class="tsw-field">' +
      '<label class="tsw-label" for="mce-LNAME">Last Name</label>' +
      '<input class="tsw-input" type="text" id="mce-LNAME" name="LNAME" autocomplete="family-name" placeholder="Optional">' +
      '</div>' +
      '</div>' +
      '<div class="tsw-row" style="margin-top:16px;">' +
      '<div class="tsw-field">' +
      '<label class="tsw-label" for="mce-EMAIL">Email Address <span class="tsw-asterisk">*</span></label>' +
      '<input class="tsw-input" type="email" id="mce-EMAIL" name="EMAIL" required autocomplete="email" inputmode="email" placeholder="you@example.com">' +
      '</div>' +
      '</div>' +
      '<input type="hidden" name="tags" value="233">' +
      '<label class="visually-hidden-abs" for="mce-HP">Leave this field empty</label>' +
      '<div aria-hidden="true" class="visually-hidden-abs">' +
      '<input class="visually-hidden-abs" type="text" id="mce-HP" name="b_44c6260e44554e7b992e09185_083452c971" tabindex="-1" autocomplete="off">' +
      '</div>' +
      '<fieldset class="tsw-consent" style="margin-top:16px;">' +
      '<legend>One last step</legend>' +
      '<div class="tsw-checkbox-wrap">' +
      '<input class="tsw-checkbox" type="checkbox" id="tsw-consent" name="CONSENT" required>' +
      '<label for="tsw-consent">I agree to receive emails from <strong>The Singapore Way</strong>.</label>' +
      '</div>' +
      '</fieldset>' +
      '<div id="tsw-success" class="tsw-msg tsw-success" role="status" aria-live="polite">' +
      '<div class="line-1">Your Free Book Summary is on the way! If you do not see it in your inbox, please check your spam or promotions.</div>' +
      '<div class="line-2">⏳ Please wait up to 5 minutes for your email to arrive before submitting again.</div>' +
      '</div>' +
      '<div id="tsw-error" class="tsw-msg tsw-error" role="alert"></div>' +
      '<div id="mce-responses" class="visually-hidden-abs" aria-hidden="true">' +
      '<div class="response" id="mce-error-response"></div>' +
      '<div class="response" id="mce-success-response"></div>' +
      '</div>' +
      '<div class="tsw-actions">' +
      '<button type="submit" id="tsw-submit" class="tsw-btn tsw-btn-primary">Send me the free summary</button>' +
      '<button type="button" id="tsw-decline" class="tsw-btn tsw-btn-secondary">No Thanks, Exit Now</button>' +
      '</div>' +
      '<p class="tsw-trust">No spam. Unsubscribe in one click.</p>' +
      '<iframe id="tsw-mc-fallback" name="tsw-mc-fallback" class="visually-hidden-abs"></iframe>' +
      '</form>' +
      '</div>' +
      '</div>';

    modal.insertBefore(closeBtn, modal.firstChild);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    window.addEventListener('keydown', onEsc);
    lockBody();

    initExitForm(overlay);
  }

  function showPopup() {
    if (hasShown()) return;
    markShown();
    createPopup();
  }

  function initDesktop() {
    var handler = function (e) {
      e = e || window.event;
      var from = e.relatedTarget || e.toElement;
      var y = typeof e.clientY === 'number' ? e.clientY : null;
      if (!from && y !== null && y <= 0) {
        document.removeEventListener('mouseout', handler);
        showPopup();
      }
    };
    document.addEventListener('mouseout', handler);
  }

  function isMobile() {
    var ua = navigator.userAgent || '';
    var uaM = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    var small = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
    return uaM || small;
  }

  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua);
  }

  function initMobile() {
    var backHandled = false;
    var url = window.location.href.split('#')[0];
    var flag = { tswExitGuard: true };

    try {
      if (isIOS()) {
        history.pushState(flag, document.title, url + '#tsw-exit');
      } else {
        history.pushState(flag, document.title, url + '#tsw-exit');
        history.pushState(flag, document.title, url);
      }
    } catch (e) {
      return;
    }

    window.addEventListener('popstate', function onPop(e) {
      if (hasShown()) {
        window.removeEventListener('popstate', onPop);
        return;
      }
      if (!backHandled) {
        backHandled = true;
        showPopup();
        if (!isIOS()) {
          try {
            history.pushState(flag, document.title, url);
          } catch (err) {
            window.removeEventListener('popstate', onPop);
          }
        }
      } else {
        window.removeEventListener('popstate', onPop);
      }
    });
  }

  function onReady(fn) {
    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(function () {
    initDesktop();
    if (isMobile()) {
      initMobile();
    }
  });
})();

