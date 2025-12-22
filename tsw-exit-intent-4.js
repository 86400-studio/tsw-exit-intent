(function () {
  'use strict';

  // Guard: only run in real browser pages, not workers/iframes
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.top !== window.self) return;

  // Mailchimp endpoint
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

  if (hasShown()) {
    return;
  }

  /* =======================
   *  FORM HANDLING
   * ======================= */

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
      msgErr.textContent = t || 'Something went wrong. Please try again.';
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
        if (root && root.parentNode) {
          root.parentNode.removeChild(root);
        }
      });
    }
  }

  /* =======================
   *  POPUP CREATION & DESIGN
   * ======================= */

  function createPopup() {
    if (document.getElementById('tsw-exit-overlay')) return;

    var s = document.getElementById('tsw-exit-styles');
    if (!s) {
      s = document.createElement('style');
      s.id = 'tsw-exit-styles';
      s.type = 'text/css';
      s.textContent =
        // Design tokens
        ":root{" +
        "--brand:#ED1C24;" +
        "--bg:#ffffff;" +
        "--fg:#111111;" +
        "--muted:#666666;" +
        "--border:#e8e8e8;" +
        "--ring:rgba(237,28,36,.35);" +
        "--radius:18px;" +
        "--space-1:6px;" +
        "--space-2:10px;" +
        "--space-3:16px;" +
        "--space-4:20px;" +
        "--space-5:26px;" +
        "--font:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';" +
        "--accent-yellow:#FFC700;" +
        "--overlay-bg:rgba(5,5,10,.65);" +
        "--card-gradient:linear-gradient(135deg,rgba(237,28,36,.16),rgba(255,255,255,0));" +
        "}" +
        "@media(prefers-color-scheme:dark){" +
        ":root{" +
        "--bg:#050509;" +
        "--fg:#f6f7f8;" +
        "--muted:#a1a1aa;" +
        "--border:#27272f;" +
        "--ring:rgba(237,28,36,.5);" +
        "--overlay-bg:rgba(0,0,0,.78);" +
        "--card-gradient:linear-gradient(135deg,rgba(237,28,36,.3),rgba(15,15,30,.85));" +
        "}" +
        "}" +
        // Animations
        "@keyframes tswFadeIn{" +
        "from{opacity:0;}to{opacity:1;}" +
        "}" +
        "@keyframes tswGlowPulse{" +
        "0%{box-shadow:0 0 0 0 rgba(237,28,36,.4);}" +
        "70%{box-shadow:0 0 0 10px rgba(237,28,36,0);}" +
        "100%{box-shadow:0 0 0 0 rgba(237,28,36,0);}" +
        "}" +
        // Overlay & modal
        "#tsw-exit-overlay{" +
        "position:fixed;" +
        "z-index:999999;" +
        "inset:0;" +
        "background:var(--overlay-bg);" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "backdrop-filter:blur(10px);" +
        "-webkit-backdrop-filter:blur(10px);" +
        "animation:tswFadeIn .22s ease-out;" +
        "overflow:hidden;" +
        "}" +
        "#tsw-exit-modal{" +
        "max-width:560px;" +
        "width:min(92vw,560px);" +
        "padding:0;" +
        "border-radius:24px;" +
        "box-sizing:border-box;" +
        "position:relative;" +
        "font-family:var(--font);" +
        "max-height:100vh;" +
        "overflow:hidden;" +
        "background:transparent;" +
        "}" +
        "#tsw-exit-close{" +
        "position:absolute;" +
        "top:10px;" +
        "right:12px;" +
        "border:none;" +
        "background:rgba(15,15,20,.45);" +
        "color:#fff;" +
        "font-size:20px;" +
        "cursor:pointer;" +
        "z-index:3;" +
        "width:32px;" +
        "height:32px;" +
        "border-radius:999px;" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "transition:background .15s ease,transform .12s ease;" +
        "}" +
        "#tsw-exit-close:hover{" +
        "background:rgba(15,15,20,.7);" +
        "transform:translateY(-1px);" +
        "}" +
        "#tsw-exit-close:focus{" +
        "outline:2px solid #fff;" +
        "outline-offset:2px;" +
        "}" +
        // Card shell with gradient border
        "#tsw-mc-card{" +
        "position:relative;" +
        "width:100%;" +
        "margin:0 auto;" +
        "padding:2px;" +
        "border-radius:22px;" +
        "background:var(--card-gradient);" +
        "box-shadow:0 18px 55px rgba(0,0,0,.45);" +
        "}" +
        "#tsw-mc-card-inner{" +
        "background:var(--bg);" +
        "color:var(--fg);" +
        "border-radius:20px;" +
        "padding:var(--space-5);" +
        "border:1px solid rgba(255,255,255,.06);" +
        "box-sizing:border-box;" +
        "font:14px/1.5 var(--font);" +
        "}" +
        // Heading
        "#tsw-mc-card h3{" +
        "margin:0 0 var(--space-3) 0;" +
        "font-size:22px;" +
        "line-height:1.25;" +
        "font-weight:750;" +
        "letter-spacing:.01em;" +
        "}" +
        // Layout
        "#tsw-mc-card .tsw-row{" +
        "display:grid;" +
        "grid-template-columns:1fr;" +
        "gap:var(--space-3);" +
        "}" +
        "#tsw-mc-card .tsw-row.names{" +
        "grid-template-columns:1fr;" +
        "}" +
        "@media(min-width:720px){" +
        "#tsw-mc-card .tsw-row.names{grid-template-columns:1.1fr .9fr;}" +
        "}" +
        "#tsw-mc-card .tsw-field{" +
        "display:flex;" +
        "flex-direction:column;" +
        "gap:6px;" +
        "}" +
        "#tsw-mc-card .tsw-label{" +
        "font-weight:600;" +
        "font-size:13px;" +
        "}" +
        // Inputs
        "#tsw-mc-card .tsw-input{" +
        "appearance:none;" +
        "width:100%;" +
        "border:1px solid var(--border);" +
        "background:rgba(255,255,255,.9);" +
        "color:#111;" +
        "border-radius:12px;" +
        "padding:11px 12px;" +
        "outline:none;" +
        "transition:border-color .16s ease,box-shadow .16s ease,transform .04s ease;" +
        "font-size:14px;" +
        "}" +
        "@media(prefers-color-scheme:dark){" +
        "#tsw-mc-card .tsw-input{" +
        "background:rgba(15,15,25,1);" +
        "color:var(--fg);" +
        "}" +
        "}" +
        "#tsw-mc-card .tsw-input:focus{" +
        "border-color:var(--brand);" +
        "box-shadow:0 0 0 1px var(--brand),0 0 0 5px var(--ring);" +
        "}" +
        "#tsw-mc-card .tsw-input::placeholder{" +
        "color:var(--muted);" +
        "}" +
        // Consent block
        "#tsw-mc-card .tsw-consent{" +
        "border:1px dashed var(--border);" +
        "border-radius:14px;" +
        "padding:var(--space-3);" +
        "margin-top:var(--space-2);" +
        "background:rgba(255,255,255,.65);" +
        "}" +
        "@media(prefers-color-scheme:dark){" +
        "#tsw-mc-card .tsw-consent{" +
        "background:rgba(10,10,20,.85);" +
        "}" +
        "}" +
        "#tsw-mc-card .tsw-consent legend{" +
        "font-weight:650;" +
        "padding:0 var(--space-1);" +
        "font-size:12px;" +
        "text-transform:uppercase;" +
        "letter-spacing:.08em;" +
        "color:var(--muted);" +
        "}" +
        "#tsw-mc-card .tsw-checkbox-wrap{" +
        "display:flex;" +
        "gap:10px;" +
        "align-items:flex-start;" +
        "margin-top:8px;" +
        "}" +
        "#tsw-mc-card .tsw-checkbox{" +
        "width:18px;" +
        "height:18px;" +
        "margin-top:1px;" +
        "border-radius:4px;" +
        "border:1px solid var(--border);" +
        "accent-color:var(--brand);" +
        "}" +
        "#tsw-mc-card .tsw-checkbox:focus{" +
        "outline:none;" +
        "box-shadow:0 0 0 4px var(--ring);" +
        "}" +
        // Actions / buttons
        "#tsw-mc-card .tsw-actions{" +
        "margin-top:var(--space-4);" +
        "display:flex;" +
        "flex-direction:column;" +
        "gap:var(--space-2);" +
        "}" +
        "@media(min-width:480px){" +
        "#tsw-mc-card .tsw-actions{flex-direction:row;}" +
        "}" +
        "#tsw-mc-card .tsw-btn{" +
        "flex:1 0 auto;" +
        "display:inline-flex;" +
        "justify-content:center;" +
        "align-items:center;" +
        "gap:8px;" +
        "border:none;" +
        "outline:none;" +
        "background:var(--brand);" +
        "color:#fff;" +
        "font-weight:700;" +
        "font-size:15px;" +
        "border-radius:999px;" +
        "padding:13px 18px;" +
        "cursor:pointer;" +
        "box-shadow:0 10px 28px rgba(237,28,36,.35);" +
        "transition:filter .16s ease,transform .06s ease,box-shadow .16s ease;" +
        "}" +
        "#tsw-mc-card .tsw-btn:hover{" +
        "filter:brightness(1.06);" +
        "transform:translateY(-1px);" +
        "box-shadow:0 14px 34px rgba(237,28,36,.45);" +
        "}" +
        "#tsw-mc-card .tsw-btn:active{" +
        "transform:translateY(0);" +
        "box-shadow:0 8px 20px rgba(237,28,36,.3);" +
        "}" +
        "#tsw-mc-card .tsw-btn:focus{" +
        "box-shadow:0 0 0 3px var(--ring),0 10px 28px rgba(237,28,36,.35);" +
        "}" +
        "#tsw-mc-card .tsw-btn-primary{" +
        "animation:tswGlowPulse 2.2s ease-out infinite;" +
        "}" +
        "#tsw-mc-card .tsw-btn-secondary{" +
        "background:transparent;" +
        "color:var(--muted);" +
        "box-shadow:none;" +
        "border:1px solid var(--border);" +
        "font-weight:600;" +
        "}" +
        "#tsw-mc-card .tsw-btn-secondary:hover{" +
        "filter:none;" +
        "box-shadow:0 4px 14px rgba(0,0,0,.12);" +
        "}" +
        "#tsw-mc-card .tsw-btn-secondary:focus{" +
        "box-shadow:0 0 0 3px var(--ring);" +
        "}" +
        // Messages
        "#tsw-mc-card .tsw-msg{" +
        "display:none;" +
        "margin-top:var(--space-3);" +
        "}" +
        "#tsw-mc-card .tsw-msg.show{display:block;}" +
        "#tsw-mc-card .tsw-success{" +
        "border:1px solid var(--border);" +
        "border-radius:14px;" +
        "padding:var(--space-3);" +
        "background:rgba(0,0,0,.02);" +
        "}" +
        "#tsw-mc-card .tsw-success .line-1{" +
        "margin-bottom:8px;" +
        "}" +
        "#tsw-mc-card .tsw-success .line-2{" +
        "font-weight:800;" +
        "display:inline-block;" +
        "background:var(--accent-yellow);" +
        "color:var(--fg);" +
        "padding:6px 10px;" +
        "border-radius:999px;" +
        "}" +
        "#tsw-mc-card .tsw-error{" +
        "border:1px solid rgba(237,28,36,.4);" +
        "border-radius:14px;" +
        "padding:var(--space-3);" +
        "background:rgba(237,28,36,.08);" +
        "color:#5a0b0e;" +
        "}" +
        // Misc
        "#tsw-mc-card .visually-hidden-abs{" +
        "position:absolute!important;" +
        "height:1px;" +
        "width:1px;" +
        "margin:-1px;" +
        "padding:0;" +
        "overflow:hidden;" +
        "clip:rect(0 0 0 0);" +
        "clip-path:inset(50%);" +
        "white-space:nowrap;" +
        "border:0;" +
        "}" +
        "#tsw-mc-card .tsw-trust{" +
        "margin-top:var(--space-2);" +
        "font-size:12px;" +
        "color:var(--muted);" +
        "text-align:center;" +
        "}" +
        "#mce-error-response,#mce-success-response{display:none!important;}" +
        "@media(max-width:480px){" +
        "#tsw-exit-modal{width:94vw;max-width:360px;}" +
        "#tsw-mc-card-inner{padding:var(--space-4);}" +
        "#tsw-mc-card h3{font-size:19px;}" +
        "#tsw-mc-card .tsw-row{gap:var(--space-2);}" +
        "#tsw-mc-card .tsw-field{gap:4px;}" +
        "#tsw-mc-card .tsw-input{padding:10px;font-size:13px;}" +
        "#tsw-mc-card .tsw-consent{padding:var(--space-2);margin-top:var(--space-2);}" +
        "#tsw-mc-card .tsw-actions{margin-top:var(--space-3);}" +
        "#tsw-mc-card .tsw-btn{padding:11px 14px;font-size:14px;}" +
        "#tsw-mc-card .tsw-success,#tsw-mc-card .tsw-error{padding:var(--space-2);font-size:12px;}" +
        "}";

      document.head.appendChild(s);
    }

    var overlay = document.createElement('div');
    overlay.id = 'tsw-exit-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var modal = document.createElement('div');
    modal.id = 'tsw-exit-modal';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'tsw-exit-close';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });

    modal.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    overlay.addEventListener('click', function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });

    modal.innerHTML =
      modal.innerHTML +
      '<div id="tsw-mc-card" role="form" aria-labelledby="tsw-form-title">' +
      '<div id="tsw-mc-card-inner">' +
      '<h3 id="tsw-form-title">Free Singapore Way summary</h3>' +
      '<form id="tsw-mc-form" action="' +
      MC_ACTION +
      '" method="post" novalidate>' +
      '<div class="tsw-row names">' +
      '<div class="tsw-field">' +
      '<label class="tsw-label" for="mce-FNAME">First Name <span class="tsw-asterisk">*</span></label>' +
      '<input class="tsw-input" type="text" id="mce-FNAME" name="FNAME" required autocomplete="given-name">' +
      '</div>' +
      '<div class="tsw-field">' +
      '<label class="tsw-label" for="mce-LNAME">Last Name</label>' +
      '<input class="tsw-input" type="text" id="mce-LNAME" name="LNAME" autocomplete="family-name">' +
      '</div>' +
      '</div>' +
      '<div class="tsw-row" style="margin-top:16px;">' +
      '<div class="tsw-field">' +
      '<label class="tsw-label" for="mce-EMAIL">Email Address <span class="tsw-asterisk">*</span></label>' +
      '<input class="tsw-input" type="email" id="mce-EMAIL" name="EMAIL" required autocomplete="email" inputmode="email">' +
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
      '<button type="submit" id="tsw-submit" class="tsw-btn tsw-btn-primary">Send</button>' +
      '<button type="button" id="tsw-decline" class="tsw-btn tsw-btn-secondary">No Thanks</button>' +
      '</div>' +
      '<p class="tsw-trust">No spam. Unsubscribe in one click.</p>' +
      '<iframe id="tsw-mc-fallback" name="tsw-mc-fallback" class="visually-hidden-abs"></iframe>' +
      '</form>' +
      '</div>' +
      '</div>';

    modal.insertBefore(closeBtn, modal.firstChild);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    initExitForm(overlay);
  }

  /* =======================
   *  TRIGGERS
   * ======================= */

  function showPopup() {
    if (hasShown()) return;
    markShown();
    createPopup();
  }

  // Desktop: mouse leaves viewport at the top
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
    var small =
      Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
    return uaM || small;
  }

  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua);
  }

  // Mobile: back-button only exit intent (no scroll / time fallback)
  function initMobile() {
    var url = window.location.href.split('#')[0];
    var flag = { tswExitGuard: true };
    var historyOk = true;

    try {
      if (isIOS()) {
        history.pushState(flag, document.title, url + '#tsw-exit');
      } else {
        history.pushState(flag, document.title, url + '#tsw-exit');
        history.pushState(flag, document.title, url);
      }
    } catch (e) {
      historyOk = false;
    }

    if (!historyOk) return;

    var backHandled = false;
    window.addEventListener('popstate', function onPop() {
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
    if (!hasShown()) {
      initDesktop();
      if (isMobile()) {
        initMobile();
      }
    }
  });
})();

