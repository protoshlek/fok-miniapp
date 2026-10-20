/* MAX Mini App — дозаполнение события.
 *
 * СЕКРЕТОВ В ЭТОМ ФАЙЛЕ НЕТ И БЫТЬ НЕ ДОЛЖНО: MAX_BOT_TOKEN и APPFLOWY_TOKEN
 * живут только на backend. Здесь — лишь публичный API_BASE.
 *
 * initData передаётся на backend как есть; backend сам проверит HMAC-подпись.
 */
(function () {
  "use strict";

  // === Конфиг: адрес backend'а при переезде меняем в config.js, не здесь ===
  var API_BASE = (window.FOK_CONFIG && window.FOK_CONFIG.apiBase) || "http://localhost:8000";

  var tg = window.WebApp || {};
  var $ = function (id) { return document.getElementById(id); };
  var state = { event: null, eventId: null, room: null };

  // ---------- helpers ----------
  function initData() {
    try { return tg.initData || ""; } catch (e) { return ""; }
  }
  function status(msg, cls) {
    var el = $("status");
    el.textContent = msg || "";
    el.className = "status" + (cls ? " " + cls : "");
  }
  function banner(msg) {
    var el = $("banner");
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function api(path, body) {
    return fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ init_data: initData() }, body || {}))
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.detail || j.error || ("HTTP " + r.status));
        return j;
      });
    });
  }

  // ---------- boot ----------
  function boot() {
    if (tg.BackButton) tg.BackButton.show();
    if (tg.MainButton) {
      tg.MainButton.setText("Сохранить");
      tg.MainButton.show();
      tg.MainButton.onClick(function () { $("form").requestSubmit(); });
    }
    $("back").addEventListener("click", function () {
      if (tg.BackButton && tg.BackButton.onClick) { tg.BackButton.offClick && tg.BackButton.offClick(); }
      history.back();
    });

    // start_param приходит из OpenAppButton: `?startapp=fill_<event_id>`
    var sp = (tg.initDataUnsafe && tg.initDataUnsafe.start_param) || "";
    var m = /^fill_([A-Za-z0-9_-]+)$/.exec(sp);
    if (m) {
      state.eventId = m[1];
      $("hdr-title").textContent = "Дозаполнить событие";
    } else {
      state.eventId = null;
      $("hdr-title").textContent = "Новое событие";
      banner("Ручное создание: опишите, что нужно сделать.");
    }

    wire();
    if (state.eventId) loadEvent(state.eventId);
  }

  function wire() {
    var t = 0;
    $("f-room").addEventListener("input", function (e) {
      clearTimeout(t);
      var q = e.target.value;
      t = setTimeout(function () { q.length >= 2 ? api("/api/rooms/search", { query: q })
                                                 .then(function (j) { renderHints(j.rooms || []); })
                                                 .catch(function () {})
                                           : renderHints([]); }, 250);
    });
    $("form").addEventListener("submit", onSubmit);
  }

  // ---------- data ----------
  function loadEvent(id) {
    status("Загрузка…");
    api("/api/event/" + encodeURIComponent(id))
      .then(function (ev) {
        state.event = ev;
        if (ev.source_text) $("src-text").textContent = ev.source_text;
        var meta = [];
        if (ev.author_name) meta.push(ev.author_name);
        if (ev.created_at) meta.push(new Date(ev.created_at * 1000).toLocaleString("ru-RU"));
        $("src-meta").textContent = meta.join(" · ");
        if (ev.event_time) $("f-time").value = ev.event_time.slice(11, 16) || "";
        if (ev.description) $("f-desc").value = ev.description;
        if (ev.work_kind) $("f-kind").value = ev.work_kind;
        if (ev.room_label) { state.room = ev.room; $("f-room").value = ev.room_number || ev.room_label;
                             showPicked(ev.room_label); }
        if (ev.missing && ev.missing.length) {
          banner("Не хватает: " + ev.missing.join(", "));
        }
        renderPhotos(ev.photos || []);
        status("");
      })
      .catch(function (e) { banner("Не удалось загрузить: " + e.message); status("", ""); });
  }

  function renderHints(rooms) {
    var box = $("room-hints");
    box.innerHTML = "";
    if (!rooms.length) { box.classList.add("hidden"); return; }
    rooms.forEach(function (r) {
      var d = document.createElement("div");
      d.className = "hint";
      d.innerHTML = r.label + (r.floor ? "<small>Этаж: " + r.floor + "</small>" : "");
      d.addEventListener("click", function () {
        state.room = r;
        $("f-room").value = r.number;
        box.classList.add("hidden");
        showPicked(r.label);
      });
      box.appendChild(d);
    });
    box.classList.remove("hidden");
  }

  function showPicked(label) {
    var el = $("room-picked");
    el.textContent = "✓ " + label;
    el.classList.remove("hidden");
  }

  function renderPhotos(urls) {
    var box = $("photos");
    box.innerHTML = "";
    (urls || []).forEach(function (u) {
      var img = document.createElement("img");
      img.src = u;
      img.alt = "Фото из чата";
      img.loading = "lazy";
      box.appendChild(img);
    });
    if (!urls || !urls.length) box.textContent = "Нет фото";
  }

  // ---------- submit ----------
  function onSubmit(ev) {
    ev.preventDefault();
    var payload = {
      event_id: state.eventId,
      event_time: $("f-time").value ? ($("f-time").value + ":00") : null,
      room_number: state.room ? state.room.number : $("f-room").value.trim(),
      room_label: state.room ? state.room.label : null,
      work_kind: $("f-kind").value || null,
      executor: $("f-exec").value.trim() || null,
      description: $("f-desc").value.trim()
    };
    if (!payload.event_time || !payload.room_number || !payload.description) {
      return status("Заполните время, помещение и описание", "err");
    }
    $("submit").disabled = true;
    status("Сохраняю…");
    var path = state.eventId ? "/api/event/" + state.eventId + "/fill" : "/api/event/new";
    api(path, payload)
      .then(function (j) {
        var sync = j.sync || {};
        if (sync.action === "created") status("Строка создана в AppFlowy", "ok");
        else if (sync.action === "updated") status("Строка обновлена в AppFlowy", "ok");
        else if (sync.reason === "incomplete") status("Сохранено, но не хватает: " + (j.missing || []).join(", "), "err");
        else if (sync.action === "skipped") status("Сохранено. AppFlowy: " + (sync.reason || "—"), "err");
        else status("AppFlowy: " + (sync.error || sync.reason || "неизвестно"), "err");
        if (tg.MainButton) tg.MainButton.hide();
        setTimeout(function () { window.close(); }, 900);
      })
      .catch(function (e) {
        status("Ошибка: " + e.message, "err");
        $("submit").disabled = false;
      });
  }

  if (tg.ready) tg.ready(boot);
  else document.addEventListener("DOMContentLoaded", boot);
})();