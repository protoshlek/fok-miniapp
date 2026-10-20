# fok-miniapp

Статика Mini App «Дозаполнить» для MAX-группы «Экспл. ФОК президентский».

Деплой: GitHub Pages → https://protoshlek.github.io/fok-miniapp/

## Откуда берётся код

Источник истины — приватный репозиторий `protoshlek/fok-bot`, папка `miniapp/`.
Этот репозиторий — только статика для Pages (Pages на free-плане не работает
с приватными репозиториями, поэтому статика вынесена отдельно).

Синхронизация: скопировать `miniapp/*` из `fok-bot` сюда и закоммитить.

## Что можно менять

Адрес backend'а — **только** в `config.js` (`window.FOK_CONFIG.apiBase`).
Там же комментарий с примером Cloudflare Tunnel-адреса.

Секретов (`MAX_BOT_TOKEN`, `APPFLOWY_TOKEN`) в этом репозитории быть не должно
и не может — всё общение с MAX/AppFlowy идёт через backend.

## Локальная отладка

```bash
python -m http.server 5500   # из корня репо
# открыть http://localhost:5500
```

`config.js` по умолчанию указывает на `http://localhost:8000` — это FastAPI backend.