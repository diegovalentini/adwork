(function () {
  const COOKIE_KEY = "adwork_cookies_accepted";

  function getLang() {
    return localStorage.getItem("adwork_lang") || "ca";
  }

  const texts = {
    ca: {
      message: "Utilitzem cookies tècniques per mantenir la teva sessió i preferències. Són necessàries per al funcionament del servei i no s'utilitzen amb finalitats publicitàries.",
      accept: "Acceptar",
      more: "Més informació",
    },
    es: {
      message: "Usamos cookies técnicas para mantener tu sesión y preferencias. Son necesarias para el funcionamiento del servicio y no se utilizan con fines publicitarios.",
      accept: "Aceptar",
      more: "Más información",
    },
  };

  function inject() {
    if (localStorage.getItem(COOKIE_KEY)) return;

    const lang = getLang();
    const t = texts[lang] || texts.ca;

    const banner = document.createElement("div");
    banner.id = "cookieBanner";
    banner.innerHTML = `
      <div class="cb-inner">
        <div class="cb-icon">🍪</div>
        <p class="cb-text">${t.message}</p>
        <div class="cb-actions">
          <a class="cb-link" href="privacy.html">${t.more}</a>
          <button class="cb-btn" id="cookieAcceptBtn">${t.accept}</button>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #cookieBanner {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(120px);
        width: min(520px, calc(100vw - 32px));
        background: linear-gradient(180deg, rgba(24,28,27,0.97), rgba(16,20,19,0.97));
        border: 1px solid rgba(29,158,104,0.25);
        border-radius: 18px;
        padding: 16px 18px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04);
        backdrop-filter: blur(16px);
        z-index: 99999;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        opacity: 0;
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                    opacity 0.45s ease;
      }

      #cookieBanner.cb-visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      #cookieBanner.cb-hiding {
        transform: translateX(-50%) translateY(120px);
        opacity: 0;
      }

      .cb-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .cb-icon {
        font-size: 22px;
        flex-shrink: 0;
        line-height: 1;
      }

      .cb-text {
        flex: 1;
        min-width: 200px;
        margin: 0;
        font-size: 13px;
        line-height: 1.55;
        color: rgba(221,232,228,0.80);
      }

      .cb-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .cb-link {
        font-size: 12px;
        color: rgba(43,227,154,0.80);
        text-decoration: none;
        white-space: nowrap;
        transition: color 0.15s ease;
      }

      .cb-link:hover {
        color: #2BE39A;
      }

      .cb-btn {
        height: 34px;
        padding: 0 16px;
        border-radius: 10px;
        border: 1px solid rgba(29,158,104,0.35);
        background: linear-gradient(135deg, #1FA56D 0%, #188E5E 100%);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
        box-shadow: 0 4px 14px rgba(29,158,104,0.25);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .cb-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(29,158,104,0.32);
      }

      @media (max-width: 480px) {
        #cookieBanner {
          bottom: 16px;
          border-radius: 14px;
          padding: 14px 14px;
        }
        .cb-inner {
          gap: 10px;
        }
        .cb-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add("cb-visible");
      });
    });

    document.getElementById("cookieAcceptBtn").addEventListener("click", () => {
      banner.classList.remove("cb-visible");
      banner.classList.add("cb-hiding");
      localStorage.setItem(COOKIE_KEY, "1");
      setTimeout(() => banner.remove(), 500);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();