/*!
 * OpticWise Forms — Drop-in HTML embed loader
 * ---------------------------------------------------------------------------
 * Mounts any form authored in the OpticWise Form Builder
 * (https://ownet.opticwise.com/forms) into any HTML page with two lines:
 *
 *   <div data-opticwise-form="my-slug"></div>
 *   <script src="https://ownet.opticwise.com/forms/embed.js" defer></script>
 *
 * Optional data-* attributes on the placeholder div:
 *   data-theme="light" | "dark"          (default: light)
 *   data-align="center" | "left"         (default: center)
 *   data-eyebrow="WORK WITH US"          (small uppercase line above heading)
 *   data-heading="Get in touch"          (override the form name)
 *   data-description="Short subtext..."  (override the form description)
 *   data-show-header="true" | "false"    (default: true — hide all header text)
 *
 * Zero dependencies. Self-contained. Safe to drop into any page — all CSS
 * is scoped under .ow-form-embed so it can't bleed into the host site.
 * Works on every modern browser (no IE11).
 */
(function () {
  "use strict";

  // ---------- Resolve platform URL from <script src> ----------
  // The script tag itself tells us the OpticWise host, so the consumer never
  // has to configure anything beyond dropping the two lines into their page.
  var PLATFORM_URL = (function () {
    try {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || "";
        if (src.indexOf("/forms/embed.js") !== -1) {
          var u = new URL(src);
          return u.origin;
        }
      }
    } catch (e) {
      /* ignore — fall through to default */
    }
    return "https://ownet.opticwise.com";
  })();

  // ---------- One-time CSS injection (scoped under .ow-form-embed) ----------
  function injectStyles() {
    if (document.getElementById("ow-form-embed-styles")) return;
    var style = document.createElement("style");
    style.id = "ow-form-embed-styles";
    style.textContent =
      ".ow-form-embed{font-family:inherit;color:#1f2937;box-sizing:border-box;width:100%;max-width:640px;margin:0 auto;padding:24px;}" +
      ".ow-form-embed *,.ow-form-embed *::before,.ow-form-embed *::after{box-sizing:border-box;}" +
      ".ow-form-embed.ow-fe-left{margin-left:0;margin-right:auto;}" +
      ".ow-form-embed-header{margin-bottom:24px;}" +
      ".ow-form-embed.ow-fe-center .ow-form-embed-header{text-align:center;}" +
      ".ow-form-embed-eyebrow{display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;color:#2B6CB0;}" +
      ".ow-form-embed-heading{font-size:28px;font-weight:700;line-height:1.2;margin:0 0 8px;color:#0a1628;}" +
      ".ow-form-embed-description{font-size:15px;line-height:1.6;color:#4b5563;margin:0;}" +
      ".ow-form-embed-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.04);}" +
      ".ow-form-embed-row{margin-bottom:14px;text-align:left;}" +
      ".ow-form-embed-row:last-of-type{margin-bottom:18px;}" +
      ".ow-form-embed-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;}" +
      ".ow-form-embed-required{color:#dc2626;margin-left:3px;}" +
      ".ow-form-embed-help{font-size:12px;color:#6b7280;margin:6px 0 0;}" +
      ".ow-form-embed-input,.ow-form-embed-select,.ow-form-embed-textarea{width:100%;padding:10px 14px;font-size:15px;font-family:inherit;line-height:1.4;color:#1f2937;background:#fff;border:1px solid #d1d5db;border-radius:8px;transition:border-color 120ms,box-shadow 120ms;outline:none;}" +
      ".ow-form-embed-input:focus,.ow-form-embed-select:focus,.ow-form-embed-textarea:focus{border-color:#2B6CB0;box-shadow:0 0 0 3px rgba(43,108,176,.15);}" +
      ".ow-form-embed-textarea{min-height:110px;resize:vertical;}" +
      ".ow-form-embed-checkbox-group,.ow-form-embed-radio-group{display:flex;flex-direction:column;gap:8px;}" +
      ".ow-form-embed-check-row{display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;}" +
      ".ow-form-embed-check-row input{height:16px;width:16px;margin:0;}" +
      ".ow-form-embed-honeypot{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}" +
      ".ow-form-embed-button{width:100%;padding:12px 20px;font-size:15px;font-weight:600;font-family:inherit;color:#fff;background:#2B6CB0;border:0;border-radius:8px;cursor:pointer;transition:background 120ms;}" +
      ".ow-form-embed-button:hover:not(:disabled){background:#1E4E8C;}" +
      ".ow-form-embed-button:disabled{opacity:.6;cursor:not-allowed;}" +
      ".ow-form-embed-footer{font-size:12px;line-height:1.5;color:#6b7280;margin:16px 0 4px;}" +
      ".ow-form-embed-footer a{color:#2B6CB0;text-decoration:underline;}" +
      ".ow-form-embed-footer a:hover{color:#1E4E8C;}" +
      ".ow-form-embed-footer p{margin:0 0 4px;}" +
      ".ow-form-embed-error{font-size:14px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:10px 14px;border-radius:8px;margin-bottom:14px;}" +
      ".ow-form-embed-success{font-size:15px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;padding:18px 20px;border-radius:8px;text-align:left;}" +
      ".ow-form-embed-loading{font-size:14px;color:#6b7280;padding:8px 0;}" +
      // ----- Dark theme overrides -----
      ".ow-form-embed.ow-fe-dark{color:#fff;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-eyebrow{color:#93c5fd;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-heading{color:#fff;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-description{color:rgba(255,255,255,.75);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);box-shadow:none;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-label{color:rgba(255,255,255,.85);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-help{color:rgba(255,255,255,.6);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-input,.ow-form-embed.ow-fe-dark .ow-form-embed-select,.ow-form-embed.ow-fe-dark .ow-form-embed-textarea{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#fff;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-input::placeholder,.ow-form-embed.ow-fe-dark .ow-form-embed-textarea::placeholder{color:rgba(255,255,255,.5);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-input:focus,.ow-form-embed.ow-fe-dark .ow-form-embed-select:focus,.ow-form-embed.ow-fe-dark .ow-form-embed-textarea:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.2);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-check-row{color:rgba(255,255,255,.85);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-button{background:#fff;color:#0a1628;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-button:hover:not(:disabled){background:rgba(255,255,255,.92);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-footer{color:rgba(255,255,255,.55);}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-footer a{color:#93c5fd;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-error{background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.4);color:#fca5a5;}" +
      ".ow-form-embed.ow-fe-dark .ow-form-embed-success{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.4);color:#a7f3d0;}";
    document.head.appendChild(style);
  }

  // ---------- DOM helpers ----------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.indexOf("on") === 0 && typeof v === "function")
          node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v === true ? "" : String(v));
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) continue;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // ---------- Per-mount logic ----------
  function mount(container) {
    if (container.getAttribute("data-opticwise-mounted") === "1") return;
    container.setAttribute("data-opticwise-mounted", "1");

    var slug = (container.getAttribute("data-opticwise-form") || "").trim();
    var theme = (container.getAttribute("data-theme") || "light").toLowerCase();
    var align = (container.getAttribute("data-align") || "center").toLowerCase();
    var eyebrow = container.getAttribute("data-eyebrow");
    var heading = container.getAttribute("data-heading");
    var description = container.getAttribute("data-description");
    var showHeader = container.getAttribute("data-show-header") !== "false";

    container.classList.add("ow-form-embed");
    container.classList.add(theme === "dark" ? "ow-fe-dark" : "ow-fe-light");
    container.classList.add(align === "left" ? "ow-fe-left" : "ow-fe-center");

    if (!slug) {
      renderError(container, "Missing data-opticwise-form attribute.");
      return;
    }

    renderLoading(container);

    fetch(PLATFORM_URL + "/api/public/forms/" + encodeURIComponent(slug), {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error((data && data.error) || 'Form "' + slug + '" not found.');
          return data.form;
        });
      })
      .then(function (form) {
        renderForm(container, form, {
          eyebrow: eyebrow,
          heading: heading,
          description: description,
          showHeader: showHeader,
        });
      })
      .catch(function (err) {
        renderError(container, (err && err.message) || "Failed to load form.");
      });
  }

  function renderLoading(container) {
    clear(container);
    container.appendChild(el("div", { class: "ow-form-embed-loading" }, ["Loading form…"]));
  }

  function renderError(container, msg) {
    clear(container);
    container.appendChild(el("div", { class: "ow-form-embed-error" }, [msg]));
  }

  function renderForm(container, form, opts) {
    clear(container);

    // ---------- Header (eyebrow / heading / description) ----------
    if (opts.showHeader) {
      var headerKids = [];
      if (opts.eyebrow) {
        headerKids.push(el("span", { class: "ow-form-embed-eyebrow" }, [opts.eyebrow]));
      }
      var hText = opts.heading || form.name;
      if (hText) {
        headerKids.push(el("h2", { class: "ow-form-embed-heading" }, [hText]));
      }
      var dText = opts.description || form.description;
      if (dText) {
        headerKids.push(el("p", { class: "ow-form-embed-description" }, [dText]));
      }
      if (headerKids.length) {
        container.appendChild(el("div", { class: "ow-form-embed-header" }, headerKids));
      }
    }

    // ---------- Card with form ----------
    var card = el("div", { class: "ow-form-embed-card" });
    container.appendChild(card);

    var formNode = el("form", { novalidate: "novalidate" });
    card.appendChild(formNode);

    // Track field state
    var values = {};
    for (var i = 0; i < form.fields.length; i++) {
      var f = form.fields[i];
      values[f.fieldKey] = f.fieldType === "checkbox" ? [] : "";
    }
    values[form.honeypotFieldName] = "";

    function renderField(field) {
      var labelEl = el("label", { class: "ow-form-embed-label" }, [
        document.createTextNode(field.label),
        field.required ? el("span", { class: "ow-form-embed-required" }, ["*"]) : null,
      ]);
      var helpEl = field.helpText
        ? el("p", { class: "ow-form-embed-help" }, [field.helpText])
        : null;

      var inputEl;
      switch (field.fieldType) {
        case "textarea":
          inputEl = el("textarea", {
            class: "ow-form-embed-textarea",
            placeholder: field.placeholder || "",
            required: field.required ? "required" : null,
            oninput: function (e) {
              values[field.fieldKey] = e.target.value;
            },
          });
          break;

        case "select":
          var opts = el("select", {
            class: "ow-form-embed-select",
            required: field.required ? "required" : null,
            onchange: function (e) {
              values[field.fieldKey] = e.target.value;
            },
          });
          opts.appendChild(el("option", { value: "" }, [field.placeholder || "Select…"]));
          (field.options || []).forEach(function (o) {
            opts.appendChild(el("option", { value: o.value }, [o.label]));
          });
          inputEl = opts;
          break;

        case "radio":
          var radioGroup = el("div", { class: "ow-form-embed-radio-group" });
          (field.options || []).forEach(function (o) {
            var input = el("input", {
              type: "radio",
              name: field.fieldKey,
              value: o.value,
              required: field.required ? "required" : null,
              onchange: function (e) {
                if (e.target.checked) values[field.fieldKey] = o.value;
              },
            });
            radioGroup.appendChild(
              el("label", { class: "ow-form-embed-check-row" }, [input, document.createTextNode(o.label)])
            );
          });
          inputEl = radioGroup;
          break;

        case "checkbox":
          var checkGroup = el("div", { class: "ow-form-embed-checkbox-group" });
          (field.options || []).forEach(function (o) {
            var input = el("input", {
              type: "checkbox",
              value: o.value,
              onchange: function (e) {
                var arr = values[field.fieldKey];
                if (e.target.checked) {
                  if (arr.indexOf(o.value) === -1) arr.push(o.value);
                } else {
                  var idx = arr.indexOf(o.value);
                  if (idx !== -1) arr.splice(idx, 1);
                }
              },
            });
            checkGroup.appendChild(
              el("label", { class: "ow-form-embed-check-row" }, [input, document.createTextNode(o.label)])
            );
          });
          inputEl = checkGroup;
          break;

        default:
          var inputType =
            field.fieldType === "email"
              ? "email"
              : field.fieldType === "tel"
                ? "tel"
                : field.fieldType === "number"
                  ? "number"
                  : field.fieldType === "url"
                    ? "url"
                    : field.fieldType === "date"
                      ? "date"
                      : "text";
          inputEl = el("input", {
            class: "ow-form-embed-input",
            type: inputType,
            placeholder: field.placeholder || "",
            required: field.required ? "required" : null,
            oninput: function (e) {
              values[field.fieldKey] = e.target.value;
            },
          });
      }

      var rowKids = [labelEl, inputEl];
      if (helpEl) rowKids.push(helpEl);
      formNode.appendChild(el("div", { class: "ow-form-embed-row" }, rowKids));
    }

    form.fields.forEach(renderField);

    // ---------- Honeypot (visually hidden) ----------
    var honeypotInput = el("input", {
      type: "text",
      name: form.honeypotFieldName,
      tabindex: "-1",
      autocomplete: "off",
      "aria-hidden": "true",
      oninput: function (e) {
        values[form.honeypotFieldName] = e.target.value;
      },
    });
    formNode.appendChild(
      el("div", { class: "ow-form-embed-honeypot", "aria-hidden": "true" }, [
        el("label", {}, ["Leave this field blank"]),
        honeypotInput,
      ])
    );

    // ---------- Error placeholder + submit button ----------
    var errorBox = el("div", { class: "ow-form-embed-error", style: "display:none" });
    formNode.appendChild(errorBox);

    var submitBtn = el(
      "button",
      { type: "submit", class: "ow-form-embed-button" },
      [form.submitButtonLabel || "Submit"]
    );
    formNode.appendChild(submitBtn);

    // ---------- Submit handler ----------
    formNode.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBox.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      // Capture referrer / page URL / UTM at submit time so the CRM gets
      // accurate attribution per submission.
      var meta = {
        referrer: document.referrer || undefined,
        pageUrl: window.location.href,
      };
      try {
        var p = new URLSearchParams(window.location.search);
        meta.utmSource = p.get("utm_source") || undefined;
        meta.utmMedium = p.get("utm_medium") || undefined;
        meta.utmCampaign = p.get("utm_campaign") || undefined;
        meta.utmTerm = p.get("utm_term") || undefined;
        meta.utmContent = p.get("utm_content") || undefined;
      } catch (_) {
        /* ignore */
      }

      var payload = {};
      for (var k in values) {
        if (Object.prototype.hasOwnProperty.call(values, k)) payload[k] = values[k];
      }
      payload._meta = meta;

      fetch(PLATFORM_URL + "/api/public/forms/" + encodeURIComponent(form.slug) + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error((data && data.error) || "Submission failed.");
            return data;
          });
        })
        .then(function (data) {
          // Replace the form with the success message in place.
          clear(card);
          card.appendChild(
            el("div", { class: "ow-form-embed-success" }, [
              data.message || form.successMessage || "Thanks!",
            ])
          );
          // Fire a CustomEvent so host pages can hook analytics if desired.
          try {
            container.dispatchEvent(
              new CustomEvent("opticwise:form:submitted", {
                bubbles: true,
                detail: { slug: form.slug, submissionId: data.submissionId },
              })
            );
          } catch (_) {
            /* ignore */
          }
        })
        .catch(function (err) {
          errorBox.textContent = (err && err.message) || "Submission failed.";
          errorBox.style.display = "";
          submitBtn.disabled = false;
          submitBtn.textContent = form.submitButtonLabel || "Submit";
        });
    });
  }

  // ---------- Auto-mount on DOM ready ----------
  function mountAll() {
    injectStyles();
    var nodes = document.querySelectorAll("[data-opticwise-form]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }

  // Expose a tiny API for advanced users (e.g. dynamically-injected forms).
  window.OpticWiseForms = {
    mount: function (node) {
      injectStyles();
      mount(node);
    },
    mountAll: mountAll,
    platformUrl: PLATFORM_URL,
  };
})();
