const CACHE_NAME = "gamebox-v3";

const FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css",
    "./css/games.css",
    "./js/app.js",
    "./js/games/2048.js",
    "./js/games/air-hockey.js",
    "./js/games/battleship.js",
    "./js/games/billiards.js",
    "./js/games/breakout.js",
    "./js/games/car-dodge.js",
    "./js/games/chess.js",
    "./js/games/connect-four.js",
    "./js/games/doodle-jump.js",
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

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(event.request)
                    .then(response => {

                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(
                                    event.request,
                                    copy
                                );
                            });

                        return response;
                    })
                    .catch(() => {
                        return caches.match("./index.html");
                    });

            })

    );
});