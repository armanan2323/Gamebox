const CACHE_NAME = "gamebox-v5";

const FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./favicon.png",
    "./css/style.css",
    "./css/games.css",
    "./js/app.js",
    "./js/games/2048.js",
    "./js/games/aim-trainer.js",
    "./js/games/air-hockey.js",
    "./js/games/battleship.js",
    "./js/games/billiards.js",
    "./js/games/boxing.js",
    "./js/games/breakout.js",
    "./js/games/car-dodge.js",
    "./js/games/chess.js",
    "./js/games/connect-four.js",
    "./js/games/doodle-jump.js",
    "./js/games/endless-runner.js",
    "./js/games/flappy-bird.js",
    "./js/games/memory.js",
    "./js/games/minesweeper.js",
    "./js/games/pacman.js",
    "./js/games/pong.js",
    "./js/games/puzzle-15.js",
    "./js/games/quick-math.js",
    "./js/games/reaction-battle.js",
    "./js/games/reaction.js",
    "./js/games/snake.js",
    "./js/games/space-invaders.js",
    "./js/games/sudoku.js",
    "./js/games/tank-battle.js",
    "./js/games/tetris.js",
    "./js/games/tic-tac-toe.js",
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES))
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});

// Сначала отдаём из кэша (быстро и офлайн), а в фоне обновляем файл из сети,
// чтобы после обновления сайта игроки получали новую версию.
self.addEventListener("fetch", event => {

    const request = event.request;

    if (
        request.method !== "GET" ||
        !request.url.startsWith(self.location.origin)
    ) {
        return;
    }

    event.respondWith(

        caches.open(CACHE_NAME).then(cache =>
            cache.match(request, { ignoreSearch: true }).then(cached => {

                const network = fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            cache.put(request, response.clone());
                        }

                        return response;
                    })
                    .catch(() => null);

                if (cached) {
                    event.waitUntil(network);
                    return cached;
                }

                return network.then(response =>
                    response ||
                    (request.mode === "navigate"
                        ? cache.match("./index.html")
                        : Response.error())
                );
            })
        )

    );
});
