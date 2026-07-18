/* ============================================================
   Natalia & Paweł — logika strony
   - animacja intro "Wzięliśmy ślub" + płatki
   - nawigacja / reveal przy scrollu
   - wgrywanie zdjęć + galeria (localStorage lub backend)
   - lightbox
   ============================================================ */
(function () {
  "use strict";

  /* --------------------------------------------------------
     KONFIGURACJA — wybór trybu galerii

     Tryb wybierany jest automatycznie:
       1) Supabase   -> gdy wypełnisz SUPABASE_URL + SUPABASE_ANON_KEY
                        (WSPÓLNA galeria — wszyscy goście widzą to samo).
       2) Endpoint    -> gdy ustawisz własne GALLERY_ENDPOINT (custom API).
       3) Lokalny     -> domyślnie: zdjęcia w przeglądarce (localStorage),
                         każdy gość widzi tylko własne.

     Konfiguracja Supabase (zalecane) — patrz README.md, sekcja
     "Wspólna galeria (Supabase)". Klucz "anon public" jest z założenia
     jawny; bezpieczeństwo dają POLITYKI (RLS) w panelu Supabase, nie
     ukrywanie klucza.
     -------------------------------------------------------- */
  var SUPABASE_URL = "https://sjzdoloqtfeeshbzvlqu.supabase.co"; // ⬅️ WKLEJ tu Project URL (Settings → API)
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqemRvbG9xdGZlZXNoYnp2bHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzY2MTAsImV4cCI6MjA5ODU1MjYxMH0.qZjAzgfnSg2l-vH0Aj2lePh0mcZeBqmHNCyy-Dssm0I"; // ⬅️ WKLEJ tu klucz "anon public" (Settings → API Keys)
  var SUPABASE_BUCKET = "natalia-pawel-photos"; // ⬅️ własny bucket pary (utwórz o tej samej nazwie w Supabase)

  var GALLERY_ENDPOINT = null; // alternatywnie: adres własnego API
  var STORAGE_KEY = "np_wedding_gallery_v1";
  var MAX_EDGE = 2000; // maks. dłuższy bok zapisywanego zdjęcia (px)
  var JPEG_QUALITY = 0.86;
  var THUMB_EDGE = 400;
  var THUMB_QUALITY = 0.7;
  var MODE =
    SUPABASE_URL && SUPABASE_ANON_KEY
      ? "supabase"
      : GALLERY_ENDPOINT
        ? "endpoint"
        : "local";

  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  document.addEventListener("DOMContentLoaded", function () {
    initIntro();
    initNav();
    initReveal();
    initUploader();
    initGallery();
    initLightbox();
  });

  /* ========================== INTRO ========================== */
  function initIntro() {
    var intro = $("#intro");
    if (!intro) return;
    document.body.classList.add("intro-lock");

    // Reszta strony jest bezwładna (inert) i niedostępna dla klawiatury /
    // czytników ekranu, dopóki widoczne jest intro nakładające się na treść.
    var site = $("#site");
    if (site) site.inert = true;

    var petals = startPetals($("#petals-canvas"));
    var closed = false;

    function closeIntro() {
      if (closed) return;
      closed = true;
      intro.classList.add("is-hidden");
      document.body.classList.remove("intro-lock");
      if (site) site.inert = false;
      // przenieś fokus do treści, jeśli był uwięziony na przycisku intro
      var main = $("#main-content");
      if (main && intro.contains(document.activeElement)) main.focus();
      if (petals) petals.stop(2200);
      window.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter") closeIntro();
    }

    $("#intro-skip").addEventListener("click", closeIntro);
    window.addEventListener("keydown", onKey);

    // Intro NIE znika samo — gość musi kliknąć „Wejdź →" (albo Enter/Esc).
  }

  function startPetals(canvas) {
    if (!canvas) return null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return null;

    var ctx = canvas.getContext("2d");
    var w,
      h,
      petals = [],
      raf,
      running = true,
      fading = false,
      fadeStart = 0,
      fadeDur = 0;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    var COLORS = ["#ffffff", "#f7eede", "#e7c987", "#bf9550", "#8a976b"];
    function spawn() {
      return {
        x: Math.random() * w,
        y: -20 - Math.random() * h,
        r: 5 + Math.random() * 8,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.01 + Math.random() * 0.03,
        vy: 0.6 + Math.random() * 1.4,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.05,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.65 + Math.random() * 0.35,
      };
    }
    for (var i = 0; i < 60; i++) {
      var p = spawn();
      p.y = Math.random() * h;
      petals.push(p);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var globalAlpha = 1;
      if (fading) {
        var t = (performance.now() - fadeStart) / fadeDur;
        globalAlpha = Math.max(0, 1 - t);
        if (t >= 1) {
          running = false;
        }
      }
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.y += p.vy;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * 0.8;
        p.rot += p.vrot;
        if (p.y > h + 20) {
          petals[i] = spawn();
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha * globalAlpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        // płatek (elipsa)
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (running) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return {
      stop: function (dur) {
        fading = true;
        fadeStart = performance.now();
        fadeDur = dur || 1500;
      },
    };
  }

  /* ========================== NAV ========================== */
  function initNav() {
    var nav = $("#nav");
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ===================== REVEAL ON SCROLL ===================== */
  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ===================== UPLOADER ===================== */
  function initUploader() {
    var input = $("#file-input");
    var zone = $("#dropzone");
    var status = $("#upload-status");
    if (!input || !zone) return;

    zone.addEventListener("click", function () {
      input.click();
    });
    zone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });

    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.remove("is-dragover");
      });
    });
    zone.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files)
        handleFiles(e.dataTransfer.files);
    });
    input.addEventListener("change", function () {
      handleFiles(input.files);
      input.value = "";
    });

    function handleFiles(fileList) {
      var all = Array.prototype.slice.call(fileList);
      var images = all.filter(function (f) { return /^image\//.test(f.type); });
      var videos = all.filter(function (f) { return /^video\//.test(f.type); });

      if (!images.length && !videos.length) {
        setStatus("Wybierz pliki ze zdjęciami lub filmami 🙂");
        return;
      }

      var total = images.length + videos.length;
      setStatus("Przetwarzam " + total + " plik(ów)…", true);

      var done = 0, ok = 0;
      function checkDone() {
        if (done === total) {
          setStatus(
            ok ? "Dodano " + ok + " plik(ów)! Dziękujemy 💛" : "Nie udało się dodać plików.",
            false
          );
          setTimeout(function () { setStatus("", false); }, 4000);
        }
      }

      images.forEach(function (file) {
        processImage(file, function (dataUrl) {
          done++;
          if (dataUrl) { ok++; Gallery.add(dataUrl); }
          checkDone();
        });
      });

      videos.forEach(function (file) {
        Gallery.addVideo(file, function (success) {
          done++;
          if (success) ok++;
          checkDone();
        });
      });
    }

    function setStatus(msg, loading) {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle("is-loading", !!loading);
    }
  }

  // Skalowanie + kompresja przed zapisem
  function processImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        var cw = Math.round(img.width * scale);
        var ch = Math.round(img.height * scale);
        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        try {
          cb(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        } catch (e) {
          cb(null);
        }
      };
      img.onerror = function () {
        cb(null);
      };
      img.src = reader.result;
    };
    reader.onerror = function () {
      cb(null);
    };
    reader.readAsDataURL(file);
  }

  function generateThumb(fullDataUrl, cb) {
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, THUMB_EDGE / Math.max(img.width, img.height));
      var cw = Math.round(img.width * scale);
      var ch = Math.round(img.height * scale);
      var canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
      try { cb(canvas.toDataURL("image/jpeg", THUMB_QUALITY)); }
      catch (e) { cb(null); }
    };
    img.onerror = function () { cb(null); };
    img.src = fullDataUrl;
  }

  function generateVideoPoster(videoUrl, cb) {
    var vid = document.createElement("video");
    vid.preload = "auto";
    vid.muted = true;
    vid.playsInline = true;
    var done = false;
    function finish(result) {
      if (done) return;
      done = true;
      cb(result);
    }
    vid.onloadeddata = function () { vid.currentTime = 0.5; };
    vid.onseeked = function () {
      var w = Math.min(vid.videoWidth || 640, THUMB_EDGE);
      var h = Math.round(w * ((vid.videoHeight || 480) / (vid.videoWidth || 640)));
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(vid, 0, 0, w, h);
      try { finish(canvas.toDataURL("image/jpeg", THUMB_QUALITY)); }
      catch (e) { finish(null); }
    };
    vid.onerror = function () { finish(null); };
    setTimeout(function () { finish(null); }, 8000);
    vid.src = videoUrl;
  }

  /* ===================== SUPABASE (wspólna galeria) ===================== */
  function sbHeaders(extra) {
    var h = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function sbPublicUrl(name) {
    return (
      SUPABASE_URL +
      "/storage/v1/object/public/" +
      SUPABASE_BUCKET +
      "/" +
      encodeURIComponent(name)
    );
  }
  function sbUploadBlob(blob, name) {
    fetch(
      SUPABASE_URL + "/storage/v1/object/" + SUPABASE_BUCKET + "/" + encodeURIComponent(name),
      {
        method: "POST",
        headers: sbHeaders({ "Content-Type": blob.type, "cache-control": "3600", "x-upsert": "false" }),
        body: blob,
      }
    );
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(",");
    var mime = ((parts[0] || "").match(/:(.*?);/) || [])[1] || "image/jpeg";
    var bin = atob(parts[1] || "");
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function sbList(cb) {
    fetch(SUPABASE_URL + "/storage/v1/object/list/" + SUPABASE_BUCKET, {
      method: "POST",
      headers: sbHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        prefix: "",
        limit: 200,
        sortBy: { column: "created_at", order: "asc" },
      }),
    })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(function (rows) {
        var all = (rows || []).filter(function (o) {
          return o && o.id && o.name && o.name.charAt(0) !== ".";
        });
        var thumbs = {};
        var posters = {};
        all.forEach(function (o) {
          if (/^thumb-/i.test(o.name)) {
            thumbs[o.name.replace(/^thumb-/i, "")] = sbPublicUrl(o.name);
          } else if (/^poster-/i.test(o.name)) {
            var stem = o.name.replace(/^poster-/i, "").replace(/\.[^.]+$/, "");
            posters[stem] = sbPublicUrl(o.name);
          }
        });
        cb(
          all
            .filter(function (o) {
              return (
                !/^thumb-/i.test(o.name) &&
                !/^poster-/i.test(o.name) &&
                (/\.(jpe?g|png|gif|webp|avif|heic)$/i.test(o.name) ||
                 /\.(mp4|mov|webm|m4v|avi)$/i.test(o.name))
              );
            })
            .map(function (o) {
              var isVideo = /\.(mp4|mov|webm|m4v|avi)$/i.test(o.name);
              var item = { id: o.name, src: sbPublicUrl(o.name), type: isVideo ? "video" : "image" };
              if (!isVideo && thumbs[o.name]) item.thumbSrc = thumbs[o.name];
              if (isVideo) {
                var stem = o.name.replace(/\.[^.]+$/, "");
                if (posters[stem]) item.posterSrc = posters[stem];
              }
              return item;
            }),
        );
      })
      .catch(function () {
        cb([]);
      });
  }
  function sbUpload(dataUrl, cb) {
    var blob;
    try {
      blob = dataUrlToBlob(dataUrl);
    } catch (e) {
      cb(null);
      return;
    }
    var name =
      "photo-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      ".jpg";
    fetch(
      SUPABASE_URL +
        "/storage/v1/object/" +
        SUPABASE_BUCKET +
        "/" +
        encodeURIComponent(name),
      {
        method: "POST",
        headers: sbHeaders({
          "Content-Type": blob.type,
          "cache-control": "3600",
          "x-upsert": "false",
        }),
        body: blob,
      },
    )
      .then(function (r) {
        if (r.ok) {
          generateThumb(dataUrl, function (thumbData) {
            if (thumbData) {
              try { sbUploadBlob(dataUrlToBlob(thumbData), "thumb-" + name); } catch (e) {}
            }
          });
          cb({ id: name, src: sbPublicUrl(name), thumbSrc: sbPublicUrl("thumb-" + name) });
        } else {
          cb(null);
        }
      })
      .catch(function () {
        cb(null);
      });
  }
  function sbUploadVideo(file, onProgress, cb) {
    var ext = (file.name.match(/\.[^.]+$/) || [".mp4"])[0].toLowerCase();
    var name =
      "video-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      ext;
    var url =
      SUPABASE_URL +
      "/storage/v1/object/" +
      SUPABASE_BUCKET +
      "/" +
      encodeURIComponent(name);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Authorization", "Bearer " + SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.setRequestHeader("cache-control", "3600");
    xhr.setRequestHeader("x-upsert", "false");

    if (onProgress) {
      xhr.upload.addEventListener("progress", function (e) {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = function () {
      cb(
        xhr.status >= 200 && xhr.status < 300
          ? { id: name, src: sbPublicUrl(name), type: "video" }
          : null,
      );
    };
    xhr.onerror = function () {
      cb(null);
    };

    xhr.send(file);
  }

  /* ===================== GALERIA ===================== */
  var Gallery = (function () {
    var grid = null,
      empty = null,
      items = [];

    function load() {
      if (MODE === "supabase") {
        sbList(function (list) {
          items = list;
          render();
        });
      } else if (MODE === "endpoint") {
        fetch(GALLERY_ENDPOINT)
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            items = (data && data.images) || [];
            render();
          })
          .catch(function () {
            items = [];
            render();
          });
      } else {
        try {
          items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch (e) {
          items = [];
        }
        render();
      }
    }

    function persistLocal() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        // przepełnienie pamięci — usuń najstarsze i spróbuj ponownie
        while (items.length > 1) {
          items.shift();
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            return;
          } catch (e2) {
            /* dalej */
          }
        }
      }
    }

    function add(dataUrl) {
      var entry = {
        id: "p" + Date.now() + "_" + Math.round(performance.now()),
        src: dataUrl,
        type: "image",
      };
      if (MODE === "supabase") {
        entry.pending = true;
        items.push(entry);
        render();
        sbUpload(dataUrl, function (res) {
          var i = items.indexOf(entry);
          if (res) {
            res.type = "image";
            if (i >= 0) items[i] = res;
            else items.push(res);
          } else if (i >= 0) {
            items.splice(i, 1);
          }
          render();
        });
      } else if (MODE === "endpoint") {
        fetch(GALLERY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        })
          .then(function () {
            load();
          })
          .catch(function () {});
        items.push(entry);
        render();
      } else {
        items.push(entry);
        persistLocal();
        render();
      }
    }

    function addVideo(file, cb) {
      if (MODE === "supabase") {
        var objUrl = URL.createObjectURL(file);
        var entry = {
          id: "v" + Date.now() + "_" + Math.round(performance.now()),
          src: objUrl,
          type: "video",
          pending: true,
          progress: 0,
        };
        items.push(entry);
        render();
        sbUploadVideo(
          file,
          function onProgress(pct) {
            entry.progress = pct;
            if (!grid) return;
            var fig = grid.querySelector('[data-id="' + entry.id + '"]');
            if (!fig) return;
            var fill = fig.querySelector(".gallery__progress-fill");
            if (fill) fill.style.width = pct + "%";
            var txt = fig.querySelector(".gallery__progress-text");
            if (txt) txt.textContent = pct + "%";
          },
          function onDone(res) {
            var i = items.indexOf(entry);
            if (res) {
              generateVideoPoster(objUrl, function (posterData) {
                URL.revokeObjectURL(objUrl);
                if (posterData) {
                  var stem = res.id.replace(/\.[^.]+$/, "");
                  try { sbUploadBlob(dataUrlToBlob(posterData), "poster-" + stem + ".jpg"); } catch (e) {}
                  res.posterSrc = sbPublicUrl("poster-" + stem + ".jpg");
                }
                if (i >= 0) items[i] = res;
                else items.push(res);
                if (cb) cb(true);
                render();
              });
            } else {
              URL.revokeObjectURL(objUrl);
              if (i >= 0) items.splice(i, 1);
              if (cb) cb(false);
              render();
            }
          },
        );
      } else {
        if (cb) cb(false);
      }
    }

    function remove(id) {
      items = items.filter(function (it) {
        return it.id !== id;
      });
      if (MODE === "local") persistLocal();
      render();
    }

    function updateEmptyState() {
      if (empty) empty.classList.toggle("is-hidden", items.length > 0);
    }

    function render() {
      if (!grid) return;
      grid.innerHTML = "";
      var order = items.slice().reverse();
      order.forEach(function (it) {
        var fig = document.createElement("figure");
        fig.className = "gallery__item";
        fig.setAttribute("data-id", it.id);

        if (it.type === "video") {
          fig.classList.add("gallery__item--video");

          if (it.pending) {
            var vid = document.createElement("video");
            vid.preload = "metadata";
            vid.muted = true;
            vid.playsInline = true;
            vid.src = it.src + "#t=0.5";
            fig.appendChild(vid);
          } else if (it.posterSrc) {
            var posterImg = document.createElement("img");
            posterImg.loading = "lazy";
            posterImg.src = it.posterSrc;
            posterImg.alt = "Podgląd wideo";
            posterImg.addEventListener("error", function () {
              posterImg.remove();
              fig.classList.add("gallery__item--no-poster");
            });
            fig.appendChild(posterImg);
          } else {
            fig.classList.add("gallery__item--no-poster");
          }

          var playIcon = document.createElement("span");
          playIcon.className = "gallery__play";
          playIcon.setAttribute("aria-hidden", "true");
          fig.appendChild(playIcon);
        } else {
          var img = document.createElement("img");
          img.loading = "lazy";
          img.alt = "Zdjęcie z wesela";
          var fullSrc = it.src;
          img.src = it.thumbSrc || fullSrc;
          if (it.thumbSrc) {
            img.addEventListener("error", function () {
              if (img.src !== fullSrc) { img.src = fullSrc; return; }
              items = items.filter(function (x) { return x.id !== it.id; });
              fig.remove();
              updateEmptyState();
            });
          } else {
            img.addEventListener("error", function () {
              items = items.filter(function (x) { return x.id !== it.id; });
              fig.remove();
              updateEmptyState();
            });
          }
          fig.appendChild(img);
        }

        if (it.pending) {
          fig.classList.add("is-pending");
          if (it.type === "video") {
            var progressWrap = document.createElement("div");
            progressWrap.className = "gallery__progress";
            var progressFill = document.createElement("div");
            progressFill.className = "gallery__progress-fill";
            progressFill.style.width = (it.progress || 0) + "%";
            progressWrap.appendChild(progressFill);
            fig.appendChild(progressWrap);

            var progressText = document.createElement("span");
            progressText.className = "gallery__progress-text";
            progressText.textContent = (it.progress || 0) + "%";
            fig.appendChild(progressText);
          }
        }

        if (MODE === "local" && it.id && it.type !== "video") {
          var del = document.createElement("button");
          del.className = "gallery__item-del";
          del.type = "button";
          del.setAttribute("aria-label", "Usuń");
          del.textContent = "×";
          del.addEventListener("click", function (e) {
            e.stopPropagation();
            remove(it.id);
          });
          fig.appendChild(del);
        }

        fig.addEventListener("click", function (e) {
          if (e.target.closest && e.target.closest(".gallery__item-del")) return;
          if (it.pending) return;
          var mediaList = order
            .filter(function (o) { return !o.pending; })
            .map(function (o) { return { src: o.src, type: o.type || "image" }; });
          var mediaIdx = 0;
          for (var mi = 0; mi < mediaList.length; mi++) {
            if (mediaList[mi].src === it.src) { mediaIdx = mi; break; }
          }
          openLightbox(mediaList, mediaIdx);
        });

        grid.appendChild(fig);
      });
      updateEmptyState();
    }

    function init() {
      grid = $("#gallery-grid");
      empty = $("#gallery-empty");
      load();
    }

    return { init: init, add: add, addVideo: addVideo, remove: remove };
  })();

  function initGallery() {
    Gallery.init();
  }

  /* ===================== LIGHTBOX ===================== */
  var _lightbox, _lightboxImg, _lightboxVideo, _lbCounter, _lbPrev, _lbNext;
  var _lbList = [],
    _lbIndex = 0;
  function initLightbox() {
    _lightbox = $("#lightbox");
    _lightboxImg = $("#lightbox-img");
    _lightboxVideo = $("#lightbox-video");
    _lbCounter = $("#lightbox-counter");
    _lbPrev = $("#lightbox-prev");
    _lbNext = $("#lightbox-next");
    if (!_lightbox) return;
    $("#lightbox-close").addEventListener("click", closeLightbox);
    if (_lbPrev)
      _lbPrev.addEventListener("click", function (e) {
        e.stopPropagation();
        lightboxStep(-1);
      });
    if (_lbNext)
      _lbNext.addEventListener("click", function (e) {
        e.stopPropagation();
        lightboxStep(1);
      });
    _lightbox.addEventListener("click", function (e) {
      if (e.target === _lightbox) closeLightbox();
    });
    window.addEventListener("keydown", function (e) {
      if (_lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") lightboxStep(-1);
      else if (e.key === "ArrowRight") lightboxStep(1);
    });
  }
  function openLightbox(list, index) {
    if (!_lightbox) return;
    if (typeof list === "string") list = [{ src: list, type: "image" }];
    _lbList = (list || []).map(function (item) {
      return typeof item === "string" ? { src: item, type: "image" } : item;
    });
    _lbIndex = index || 0;
    if (!_lbList.length) return;
    showLightbox();
    _lightbox.hidden = false;
  }
  function showLightbox() {
    if (!_lbList.length) return;
    if (_lbIndex < 0) _lbIndex = _lbList.length - 1;
    if (_lbIndex >= _lbList.length) _lbIndex = 0;

    var item = _lbList[_lbIndex];
    var isVideo = item.type === "video";

    if (_lightboxVideo) {
      _lightboxVideo.pause();
      if (isVideo) {
        _lightboxImg.hidden = true;
        _lightboxVideo.hidden = false;
        _lightboxVideo.src = item.src;
      } else {
        _lightboxVideo.hidden = true;
        _lightboxVideo.src = "";
        _lightboxImg.hidden = false;
        _lightboxImg.src = item.src;
      }
    } else {
      _lightboxImg.src = item.src;
    }

    var multi = _lbList.length > 1;
    if (_lbCounter)
      _lbCounter.textContent = multi
        ? _lbIndex + 1 + " / " + _lbList.length
        : "";
    if (_lbPrev) _lbPrev.hidden = !multi;
    if (_lbNext) _lbNext.hidden = !multi;
  }
  function lightboxStep(d) {
    _lbIndex += d;
    showLightbox();
  }
  function closeLightbox() {
    if (!_lightbox) return;
    _lightbox.hidden = true;
    _lightboxImg.src = "";
    _lightboxImg.hidden = false;
    if (_lightboxVideo) {
      _lightboxVideo.pause();
      _lightboxVideo.src = "";
      _lightboxVideo.hidden = true;
    }
    _lbList = [];
  }
})();
