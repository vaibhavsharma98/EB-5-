window.__ok = true;
document.addEventListener("DOMContentLoaded", function () {
  var pageOpenedAt = Date.now();
  var main = document.querySelector("main") || document.querySelector("section");
  if (main) {
    if (!main.id) main.id = "main-content";
    var skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#" + main.id;
    skip.textContent = "Skip to content";
    document.body.insertBefore(skip, document.body.firstChild);
  }
  var topbar = document.getElementById("topbar");
  function onScroll() {
    if (topbar) topbar.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll);
  onScroll();

  /* expose the fixed topbar+header height so the hero can reserve exactly that much
     top space (the urgency bar wraps to a different height across breakpoints) */
  function setTopbarH() {
    if (topbar)
      document.documentElement.style.setProperty(
        "--topbar-h",
        topbar.offsetHeight + "px",
      );
  }
  setTopbarH();
  window.addEventListener("resize", setTopbarH);
  window.addEventListener("load", setTopbarH);

  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo && heroVideo.tagName === "VIDEO") {
    function slowHeroVideo() {
      heroVideo.playbackRate = 0.65;
    }
    heroVideo.addEventListener("loadedmetadata", slowHeroVideo);
    heroVideo.addEventListener("play", slowHeroVideo);
    slowHeroVideo();
  }

  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  if (burger && menu) {
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "menu");
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Menu");
      burger.textContent = open ? "✕" : "☰";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Menu");
        burger.textContent = "☰";
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        menu.classList.remove("open");
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Menu");
        burger.textContent = "☰";
        burger.focus();
      }
    });
  }

  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".menu a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href === here) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  /* sticky mobile CTA bar (not on the contact page itself) */
  if (here !== "contact.html") {
    var mcta = document.createElement("div");
    mcta.className = "mcta";
    mcta.innerHTML =
      '<a class="btn btn-gold" href="contact.html">Book Consultation <span class="arr">→</span></a>';
    document.body.appendChild(mcta);
  }

  var pbar = document.createElement("div");
  pbar.className = "progressbar";
  document.body.appendChild(pbar);
  function prog() {
    var h = document.documentElement;
    var m = h.scrollHeight - h.clientHeight;
    pbar.style.width = (m > 0 ? (h.scrollTop / m) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", prog, { passive: true });
  prog();

  document.querySelectorAll(".stagger").forEach(function (c) {
    c.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.transitionDelay = i * 85 + "ms";
    });
  });

  document.querySelectorAll("[data-difference]").forEach(function (explorer) {
    var tabs = Array.prototype.slice.call(
      explorer.querySelectorAll("[data-diff-tab]"),
    );
    var panels = Array.prototype.slice.call(
      explorer.querySelectorAll(".diff-panel"),
    );

    function selectDifference(tab, moveFocus) {
      var panelId = tab.getAttribute("data-diff-tab");
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(function (panel) {
        var selected = panel.id === panelId;
        panel.hidden = !selected;
        panel.classList.toggle("active", selected);
      });
      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        selectDifference(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        var direction = event.key === "ArrowDown" ? 1 : -1;
        var nextIndex = (tabs.indexOf(tab) + direction + tabs.length) % tabs.length;
        selectDifference(tabs[nextIndex], true);
      });
    });
    if (tabs[0]) selectDifference(tabs[0], false);
  });

  document
    .querySelectorAll("[data-journey-preview]")
    .forEach(function (preview) {
      var steps = Array.prototype.slice.call(
        preview.querySelectorAll("[data-journey-step]"),
      );
      var section = preview.closest(".journey-home");
      var count = section && section.querySelector(".jp-progress-count");
      var label = section && section.querySelector(".jp-progress-label");
      var progress = section && section.querySelector(".jp-progress-track i");

      function selectJourney(index, moveFocus) {
        steps.forEach(function (step, stepIndex) {
          var selected = stepIndex === index;
          step.classList.toggle("active", selected);
          step.setAttribute("aria-pressed", selected ? "true" : "false");
          step.tabIndex = selected ? 0 : -1;
        });
        if (count) count.textContent = "Step " + (index + 1) + " of " + steps.length;
        if (label) label.textContent = steps[index].querySelector("h4").textContent;
        if (progress) progress.style.width = ((index + 1) / steps.length) * 100 + "%";
        if (moveFocus) steps[index].focus();
      }

      steps.forEach(function (step, index) {
        step.addEventListener("click", function () {
          selectJourney(index, false);
        });
        step.addEventListener("keydown", function (event) {
          var nextIndex = index;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            nextIndex = (index + 1) % steps.length;
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            nextIndex = (index - 1 + steps.length) % steps.length;
          } else if (event.key === "Home") {
            nextIndex = 0;
          } else if (event.key === "End") {
            nextIndex = steps.length - 1;
          } else if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          event.preventDefault();
          selectJourney(nextIndex, true);
        });
      });
      if (steps[0]) selectJourney(0, false);
    });

  function countEl(el) {
    if (el.__counted) return;
    el.__counted = true;
    var t = parseFloat(el.dataset.target),
      pre = el.dataset.prefix || "",
      suf = el.dataset.suffix || "",
      dec = parseInt(el.dataset.dec || "0"),
      start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1600, 1);
      var v = p * p * (3 - 2 * p) * t;
      el.textContent =
        pre + (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString()) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-target")) countEl(e.target);
          if (e.target.querySelectorAll)
            e.target.querySelectorAll("[data-target]").forEach(function (n) {
              countEl(n);
            });
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.16 },
  );
  document.querySelectorAll(".reveal, [data-target]").forEach(function (el) {
    io.observe(el);
  });
  document
    .querySelectorAll(".hero .reveal, .phero .reveal")
    .forEach(function (el) {
      el.classList.add("in");
    });

  document.querySelectorAll("[data-timeline]").forEach(function (tl) {
    var line = tl.querySelector(".tl-line");
    var dots = tl.querySelectorAll(".tdot");
    function draw() {
      var r = tl.getBoundingClientRect();
      var trigger = window.innerHeight * 0.82;
      var h = Math.max(0, Math.min(r.height, trigger - r.top));
      if (line) line.style.height = h + "px";
      dots.forEach(function (d) {
        d.classList.toggle("on", d.getBoundingClientRect().top < trigger);
      });
    }
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", draw);
    draw();
  });

  document.querySelectorAll(".jtl").forEach(function (tl) {
    var line = tl.querySelector(".tl-line");
    function jdraw() {
      var r = tl.getBoundingClientRect();
      var trig = window.innerHeight * 0.62;
      var h = Math.max(0, Math.min(r.height, trig - r.top));
      if (line) line.style.height = h + "px";
    }
    window.addEventListener("scroll", jdraw, { passive: true });
    window.addEventListener("resize", jdraw);
    jdraw();
  });

  /* hero video — nudge autoplay (some browsers need an explicit play() after canplay).
     On failure, hide the <video> so its poster / the image slideshow shows through. */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo && heroVideo.tagName === "VIDEO") {
    var kick = function () {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (heroVideo.readyState >= 2) kick();
    heroVideo.addEventListener("canplay", kick, { once: true });
    heroVideo.addEventListener("error", function () {
      heroVideo.style.display = "none";
    });
  }

  /* hero slideshow — the fallback beneath the video (visible if the video errors).
     Probe each image so a missing file (e.g. hero-liberty.jpg) is dropped, not shown blank */
  var slides = Array.prototype.slice.call(
    document.querySelectorAll(".hero-slide"),
  );
  if (slides.length) {
    var pendingProbes = slides.length;
    var probeDone = function () {
      if (--pendingProbes > 0) return;
      if (slides.length < 2) {
        if (slides[0]) slides[0].classList.add("active");
        return;
      }
      var si = 0;
      slides.forEach(function (s, k) {
        s.classList.toggle("active", k === 0);
      });
      setInterval(function () {
        slides[si].classList.remove("active");
        si = (si + 1) % slides.length;
        slides[si].classList.add("active");
      }, 9000);
    };
    slides.slice().forEach(function (s) {
      var m = (s.style.backgroundImage || "").match(
        /url\(["']?([^"')]+)["']?\)/,
      );
      if (!m) {
        probeDone();
        return;
      }
      var probe = new Image();
      probe.onload = probeDone;
      probe.onerror = function () {
        s.parentNode.removeChild(s);
        slides.splice(slides.indexOf(s), 1);
        probeDone();
      };
      probe.src = m[1];
    });
  }

  document.querySelectorAll(".qa .q").forEach(function (q) {
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var item = q.parentElement,
        a = item.querySelector(".a");
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
    });
  });

  document.querySelectorAll(".optrow").forEach(function (row) {
    row.querySelectorAll(".opt").forEach(function (option) {
      option.setAttribute("aria-pressed", "false");
    });
    row.addEventListener("click", function (e) {
      var o = e.target.closest(".opt");
      if (!o) return;
      row.querySelectorAll(".opt").forEach(function (x) {
        x.classList.remove("sel");
        x.setAttribute("aria-pressed", "false");
      });
      o.classList.add("sel");
      o.setAttribute("aria-pressed", "true");
      row.dataset.value = o.dataset.value || o.textContent;
    });
  });

  function whatsappUrl(lines) {
    return "https://wa.me/919818781231?text=" + encodeURIComponent(lines.join("\n"));
  }

  function responseError(response) {
    if (response.ok) return response.json();
    return response
      .json()
      .catch(function () {
        return {};
      })
      .then(function (data) {
        throw new Error(data.error || "We could not send your enquiry.");
      });
  }

  function setFormStatus(status, message, success) {
    if (!status) return;
    status.hidden = !message;
    status.classList.toggle("is-success", !!success);
    status.textContent = message || "";
  }

  var stepper = document.getElementById("stepper");
  if (stepper) {
    var steps = stepper.querySelectorAll(".estep");
    var bar = stepper.querySelector(".progress i");
    var readinessForm = stepper.querySelector("form");
    var readinessStatus = stepper.querySelector("[data-form-status]");
    var i = 0;
    function setStepError(step, message) {
      var error = step.querySelector(".step-error");
      if (!error) {
        error = document.createElement("div");
        error.className = "step-error";
        error.setAttribute("role", "alert");
        step.appendChild(error);
      }
      error.textContent = message || "";
      error.hidden = !message;
    }
    function show(n) {
      steps.forEach(function (s, k) {
        s.classList.toggle("on", k === n);
      });
      if (bar) bar.style.width = ((n + 1) / steps.length) * 100 + "%";
    }
    stepper.addEventListener("click", function (e) {
      if (e.target.closest("[data-next]")) {
        e.preventDefault();
        var currentStep = steps[i];
        if (currentStep.querySelector(".optrow") && !currentStep.querySelector(".opt.sel")) {
          setStepError(currentStep, "Choose one option to continue.");
          currentStep.querySelector(".opt").focus();
          return;
        }
        setStepError(currentStep, "");
        if (i < steps.length - 1) {
          i++;
          show(i);
        }
      } else if (e.target.closest("[data-prev]")) {
        e.preventDefault();
        if (i > 0) {
          i--;
          show(i);
        }
      }
    });

    readinessForm.addEventListener("submit", function (event) {
      event.preventDefault();
      setFormStatus(readinessStatus, "", false);
      if (!readinessForm.checkValidity()) {
        readinessForm.reportValidity();
        return;
      }
      var selected = Array.prototype.map.call(
        stepper.querySelectorAll(".optrow"),
        function (row) {
          return row.dataset.value || "";
        },
      );
      if (selected.some(function (value) { return !value; })) {
        setFormStatus(readinessStatus, "Please answer every readiness question.", false);
        return;
      }

      var submit = readinessForm.querySelector('button[type="submit"]');
      var label = submit.querySelector("[data-submit-label]");
      var payload = {
        type: "eligibility",
        name: readinessForm.elements.name.value.trim(),
        email: readinessForm.elements.email.value.trim(),
        phone: readinessForm.elements.phone.value.trim(),
        website: readinessForm.elements.website.value,
        consent: readinessForm.elements.consent.checked,
        openedAt: pageOpenedAt,
        answers: {
          readiness: selected[0],
          location: selected[1],
          goal: selected[2],
          timeframe: selected[3],
        },
      };
      var lines = [
        "Hello The Calculus — I completed the preliminary EB-5 readiness review:",
        "Readiness: " + selected[0],
        "Location: " + selected[1],
        "Goal: " + selected[2],
        "Timeframe: " + selected[3],
        "Name: " + payload.name,
        "Email: " + payload.email,
        "Phone: " + payload.phone,
      ];
      submit.disabled = true;
      label.textContent = "Sending securely…";
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(responseError)
        .then(function () {
          stepper.innerHTML =
            '<div class="ok"><b>Your readiness review has been received.</b> This is not a legal eligibility decision. Our team will contact you to arrange an appropriate next step.<br><a class="btn btn-gold" style="margin-top:16px" href="' +
            whatsappUrl(lines) +
            '" target="_blank" rel="noopener">Continue on WhatsApp <span class="arr">→</span></a></div>';
        })
        .catch(function (error) {
          setFormStatus(readinessStatus, error.message + " You can use WhatsApp instead.", false);
        })
        .finally(function () {
          submit.disabled = false;
          label.textContent = "Request my readiness review";
        });
    });
    show(0);
  }

  document.querySelectorAll("form[data-lead]").forEach(function (f) {
    if (f.closest("#stepper")) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = f.querySelector("[data-form-status]");
      setFormStatus(status, "", false);
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
      var submit = f.querySelector('button[type="submit"]');
      var label = submit.querySelector("[data-submit-label]");
      var payload = {
        type: f.dataset.lead || "contact",
        name: f.elements.name.value.trim(),
        email: f.elements.email.value.trim(),
        phone: f.elements.phone.value.trim(),
        readiness: f.elements.readiness ? f.elements.readiness.value : "",
        message: f.elements.message ? f.elements.message.value.trim() : "",
        website: f.elements.website.value,
        consent: f.elements.consent.checked,
        openedAt: pageOpenedAt,
      };
      var lines = [
        "Hello The Calculus — I would like to request an EB-5 consultation.",
        "Name: " + payload.name,
        "Email: " + payload.email,
        "Phone: " + payload.phone,
      ];
      if (payload.readiness) lines.push("Readiness: " + payload.readiness);
      if (payload.message) lines.push("Message: " + payload.message);
      submit.disabled = true;
      label.textContent = "Sending securely…";
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(responseError)
        .then(function () {
          var box = document.createElement("div");
          box.className = "ok";
          box.innerHTML =
            '<b>Your consultation request has been received.</b> We aim to reply within one business day.<br><a class="btn btn-gold" style="margin-top:16px" href="' +
            whatsappUrl(lines) +
            '" target="_blank" rel="noopener">Continue on WhatsApp <span class="arr">→</span></a>';
          f.innerHTML = "";
          f.appendChild(box);
        })
        .catch(function (error) {
          setFormStatus(status, error.message + " You can contact us on WhatsApp instead.", false);
        })
        .finally(function () {
          submit.disabled = false;
          label.textContent = "Book Consultation";
        });
    });
  });

  var y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();

  /* ===== parallax scroll on hero text ===== */
  var phero = document.querySelector(".phero");
  if (phero) {
    var ph1 = phero.querySelector("h1");
    var pp = phero.querySelector("p");
    var reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reducedMotion) {
      window.addEventListener(
        "scroll",
        function () {
          var s = window.scrollY;
          var limit = phero.offsetHeight;
          if (s < limit) {
            var offset = s * 0.3;
            if (ph1) ph1.style.transform = "translateY(" + offset + "px)";
            if (pp) pp.style.transform = "translateY(" + offset * 0.6 + "px)";
          }
        },
        { passive: true },
      );
    }
  }

  /* ===== typewriter effect (about page) ===== */
  var twEl = document.querySelector(".typewriter");
  if (twEl) {
    var fullText = twEl.textContent;
    twEl.textContent = "";
    twEl.classList.add("typing");
    var twIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            twIO.unobserve(e.target);
            var idx = 0;
            var speed = Math.max(8, Math.min(25, 1500 / fullText.length));
            function typeChar() {
              if (idx < fullText.length) {
                twEl.textContent += fullText.charAt(idx);
                idx++;
                setTimeout(typeChar, speed);
              } else {
                twEl.classList.remove("typing");
                twEl.classList.add("done");
              }
            }
            typeChar();
          }
        });
      },
      { threshold: 0.3 },
    );
    twIO.observe(twEl);
  }

  /* ===== gaincard mouse-move parallax ===== */
  document.querySelectorAll(".gaincard").forEach(function (gc) {
    gc.setAttribute("data-parallax", "");
    var img = gc.querySelector(".gc-img");
    if (!img) return;
    gc.addEventListener("mousemove", function (e) {
      var r = gc.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var yy = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform =
        "scale(1.08) translate(" + x * 10 + "px," + yy * 10 + "px)";
    });
    gc.addEventListener("mouseleave", function () {
      img.style.transform = "";
    });
  });

  /* ===== table row-by-row reveal ===== */
  document.querySelectorAll(".ctable").forEach(function (tbl) {
    tbl.classList.add("reveal-rows");
    var rows = tbl.querySelectorAll("tr");
    var tblIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            tblIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    rows.forEach(function (row, idx) {
      row.style.transitionDelay = idx * 80 + "ms";
      tblIO.observe(row);
    });
  });

  /* ===== journey active step tracking ===== */
  var jsteps = document.querySelectorAll(".jstep");
  if (jsteps.length) {
    function updateActiveStep() {
      var mid = window.innerHeight * 0.5;
      var closest = null,
        closestDist = Infinity;
      jsteps.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < closestDist) {
          closestDist = dist;
          closest = s;
        }
      });
      jsteps.forEach(function (s) {
        s.classList.toggle("j-active", s === closest);
      });
    }
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    updateActiveStep();
  }

  var accessModal = document.querySelector("[data-access-modal]");
  if (accessModal) {
    var accessCard = accessModal.querySelector(".access-card");
    var accessShown = false;
    var accessForm = accessModal.querySelector("[data-journey-access]");
    var accessError = accessModal.querySelector("[data-access-error]");

    function setAccessError(message) {
      if (!accessError) return;
      accessError.textContent = message;
      accessError.hidden = !message;
    }
    function openAccessModal() {
      if (accessShown) return;
      accessShown = true;
      accessModal.classList.add("is-open");
      accessModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("access-open");
      document.body.classList.add("journey-locked");
      if (accessCard) accessCard.focus();
    }
    function grantAccess() {
      accessModal.classList.remove("is-open");
      accessModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("access-open");
      document.body.classList.remove("journey-locked");
    }

    setTimeout(openAccessModal, 250);

    if (accessForm) {
      accessForm.addEventListener("submit", function (event) {
        event.preventDefault();
        setAccessError("");

        var emailInput = accessForm.querySelector('[name="email"]');
        var countryInput = accessForm.querySelector('[name="countryCode"]');
        var phoneInput = accessForm.querySelector('[name="phone"]');
        var consentInput = accessForm.querySelector('[name="consent"]');
        var submit = accessForm.querySelector('button[type="submit"]');
        var email = emailInput ? emailInput.value.trim() : "";
        var countryCode = countryInput ? countryInput.value : "";
        var phone = phoneInput ? phoneInput.value.replace(/\D/g, "") : "";
        var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
        var phoneValid = /^\d{7,15}$/.test(phone);

        if (emailInput) emailInput.setAttribute("aria-invalid", emailValid ? "false" : "true");
        if (phoneInput) phoneInput.setAttribute("aria-invalid", phoneValid ? "false" : "true");

        if (!email || !phone) {
          setAccessError(
            "Access was not granted because both email and phone are required. Add them and retry anytime.",
          );
          return;
        }
        if (!emailValid) {
          setAccessError("Enter a valid email address, then try again.");
          emailInput.focus();
          return;
        }
        if (!phoneValid) {
          setAccessError("Enter a valid national phone number, then try again.");
          phoneInput.focus();
          return;
        }
        if (!consentInput || !consentInput.checked) {
          setAccessError("Please review the Privacy Notice and provide consent.");
          if (consentInput) consentInput.focus();
          return;
        }

        submit.disabled = true;
        submit.classList.add("is-loading");
        submit.querySelector("span").textContent = "Submitting details...";

        fetch("/api/journey-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            countryCode: countryCode,
            phone: phone,
            website: accessForm.elements.website.value,
            consent: consentInput.checked,
            openedAt: pageOpenedAt,
          }),
        })
          .then(function (response) {
            if (!response.ok) {
              return response.json().catch(function () {
                return {};
              }).then(function (data) {
                throw new Error(data.error || "Submission failed");
              });
            }
            return response.json();
          })
          .then(function () {
            grantAccess();
          })
          .catch(function () {
            setAccessError(
              "We couldn't submit your details, so access remains locked. Please retry anytime.",
            );
          })
          .finally(function () {
            submit.disabled = false;
            submit.classList.remove("is-loading");
            submit.querySelector("span").textContent = "View the EB-5 journey";
          });
      });
    }
  }

  /* ===== proof strip animated counter ===== */
  document.querySelectorAll(".proof .big").forEach(function (el) {
    if (!el.hasAttribute("data-target")) {
      var text = el.textContent;
      var num = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) {
        el.setAttribute("data-target", num);
        el.setAttribute("data-prefix", text.match(/^[^0-9]*/)[0] || "");
        el.setAttribute("data-suffix", text.match(/[^0-9.]*$/)[0] || "");
        el.setAttribute("data-dec", text.indexOf(".") >= 0 ? "1" : "0");
        var pIO = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                pIO.unobserve(e.target);
                countEl(e.target);
                e.target.classList.add("counted");
              }
            });
          },
          { threshold: 0.3 },
        );
        pIO.observe(el);
      }
    }
  });

  /* ===== heritage counter ===== */
  document.querySelectorAll(".hc-num[data-target]").forEach(function (el) {
    var hcIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            hcIO.unobserve(e.target);
            countEl(e.target);
          }
        });
      },
      { threshold: 0.3 },
    );
    hcIO.observe(el);
  });
});
