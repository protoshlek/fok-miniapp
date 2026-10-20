/* Конфиг Mini App — единственное место, где живёт адрес backend'а.
 *
 * ПРИ ПЕРЕЕЗДЕ (GitHub Pages → свой домен → self-host) правится ТОЛЬКО ЭТА СТРОКА.
 * Секретов здесь быть не должно: MAX_BOT_TOKEN и APPFLOWY_TOKEN живут только на backend.
 *
 * Текущий режим: backend на ПК за Cloudflare Tunnel.
 * Пока туннель не поднят — localhost (работает только при отладке на телефоне
 * через USB/ADB reverse или при открытии Mini App в браузере на том же ПК).
 *
 * После подключения Cloudflare Tunnel — указать HTTPS-адрес вида
 *   https://fok-bot.tunnel.example.com
 * Mini App работает только по HTTPS.
 */
window.FOK_CONFIG = {
  apiBase: "http://localhost:8000",
  // apiBase: "https://<your-tunnel>.example.com", // ← поменять при поднятии Cloudflare Tunnel
};