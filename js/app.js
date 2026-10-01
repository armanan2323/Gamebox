const games = {
    snake: {
        title: "Snake",
        icon: "🐍",
        desc: "Классическая змейка",
        category: "Аркады",
        group: "arcade",
        create: "createSnake"
    },

    pacman: {
    title: "Pac-Man",
    icon: "🟡",
    desc: "Собирай точки и убегай от призраков",
    category: "Аркады",
    group: "arcade",
    create: "createPacman"
},

carDodge: {
    title: "Car Dodge",
    icon: "🚗",
    desc: "Уклоняйся от машин",
    category: "Аркады",
    group: "arcade",
    create: "createCarDodge"
},

reactionBattle: {
    title: "Reaction Battle",
    icon: "⚡",
    desc: "Кто быстрее отреагирует",
    category: "Два игрока",
    group: "twoPlayer",
    create: "createReactionBattle"
},

quickMath: {
    title: "Quick Math",
    icon: "🧮",
    desc: "Решай примеры на скорость",
    category: "На реакцию",
    group: "reaction",
    create: "createQuickMath"
},

    tetris: {
        title: "Tetris",
        icon: "🧱",
        desc: "Собирай линии",
        category: "Аркады",
        group: "arcade",
        create: "createTetris"
    },

    minesweeper: {
        title: "Minesweeper",
        icon: "💣",
        desc: "Найди все мины",
        category: "Головоломки",
        group: "puzzle",
        create: "createMinesweeper"
    },

    pong: {
        title: "Pong",
        icon: "🏓",
        desc: "Против ИИ или вдвоём",
        category: "Два игрока",
        group: "twoPlayer",
        create: "createPong"
    },

    memory: {
        title: "Memory",
        icon: "🧠",
        desc: "Найди одинаковые пары",
        category: "Головоломки",
        group: "puzzle",
        create: "createMemory"
    },

    ticTacToe: {
        title: "Tic-Tac-Toe",
        icon: "❌",
        desc: "Против ИИ или друга",
        category: "Два игрока",
        group: "twoPlayer",
        create: "createTicTacToe"
    },

    game2048: {
        title: "2048",
        icon: "🔢",
        desc: "Соединяй одинаковые числа",
        category: "Головоломки",
        group: "puzzle",
        create: "create2048"
    },

    breakout: {
        title: "Breakout",
        icon: "🧱",
        desc: "Разбивай блоки",
        category: "Аркады",
        group: "arcade",
        create: "createBreakout"
    },

    flappyBird: {
        title: "Flappy Bird",
        icon: "🐦",
        desc: "Пролети между трубами",
        category: "Аркады",
        group: "arcade",
        create: "createFlappyBird"
    },

    connectFour: {
        title: "Connect Four",
        icon: "🔴",
        desc: "Собери четыре в ряд",
        category: "Два игрока",
        group: "twoPlayer",
        create: "createConnectFour"
    },

    sudoku: {
        title: "Sudoku",
        icon: "🔢",
        desc: "Заполни сетку 9×9",
        category: "Головоломки",
        group: "puzzle",
        create: "createSudoku"
    },

    spaceInvaders: {
        title: "Space Invaders",
        icon: "👾",
        desc: "Защити планету",
        category: "Аркады",
        group: "arcade",
        create: "createSpaceInvaders"
    },

    chess: {
        title: "Chess",
        icon: "♟️",
        desc: "Шахматы для двух игроков",
        category: "Два игрока",
        group: "twoPlayer",
        create: "createChess"
    },

    battleship: {
        title: "Battleship",
        icon: "🚢",
        desc: "Морской бой",
        category: "Два игрока",
        group: "twoPlayer",
        create: "createBattleship"
    },

    puzzle15: {
        title: "15 Puzzle",
        icon: "🧩",
        desc: "Собери числа по порядку",
        category: "Головоломки",
        group: "puzzle",
        create: "createPuzzle15"
    },

    reaction: {
        title: "Reaction Test",
        icon: "⚡",
        desc: "Проверь скорость реакции",
        category: "На реакцию",
        group: "reaction",
        create: "createReaction"
    },

    doodleJump: {
        title: "Doodle Jump",
        icon: "🟦",
        desc: "Прыгай всё выше",
        category: "Аркады",
        group: "arcade",
        create: "createDoodleJump"
    },

    billiards: {
    title: "Billiards",
    icon: "🎱",
    desc: "Бильярд для двух игроков",
    category: "Два игрока",
    group: "twoPlayer",
    create: "createBilliards"
    },

    airHockey: {
    title: "Air Hockey",
    icon: "🏒",
    desc: "Аэрохоккей против ИИ или друга",
    category: "Два игрока",
    group: "twoPlayer",
    create: "createAirHockey"
},
};

const ratings = {
    snake: { type: "best", order: "desc", format: "points" },
    pacman: { type: "best", order: "desc", format: "points" },
    carDodge: { type: "best", order: "desc", format: "points" },
    reactionBattle: { type: "wins" },
    quickMath: { type: "best", order: "desc", format: "points" },
    tetris: { type: "best", order: "desc", format: "points" },
    minesweeper: { type: "best", order: "asc", format: "time" },
    pong: { type: "wins" },
    memory: { type: "best", order: "asc", format: "moves" },
    ticTacToe: { type: "wins" },
    game2048: { type: "best", order: "desc", format: "points" },
    breakout: { type: "best", order: "desc", format: "points" },
    flappyBird: { type: "best", order: "desc", format: "points" },
    connectFour: { type: "wins" },
    sudoku: { type: "best", order: "asc", format: "time" },
    spaceInvaders: { type: "best", order: "desc", format: "points" },
    chess: { type: "wins" },
    battleship: { type: "wins" },
    puzzle15: { type: "best", order: "asc", format: "moves" },
    reaction: { type: "best", order: "asc", format: "ms" },
    doodleJump: { type: "best", order: "desc", format: "points" },
    billiards: { type: "wins" },
    airHockey: { type: "wins" }
};

/* ---------- Хранилище ---------- */

const storage = {
    get(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {}
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {}
    }
};

/* ---------- Настройки ---------- */

const defaultSettings = {
    theme: "system",
    accent: "green",
    sound: true,
    volume: 0.6,
    vibration: true,
    name1: "Игрок 1",
    name2: "Игрок 2"
};

const settings = {
    ...defaultSettings,
    ...storage.get("gamebox:settings", {})
};

function saveSettings() {
    storage.set("gamebox:settings", settings);
}

const themeQuery = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function applyTheme() {
    const dark =
        settings.theme === "dark" ||
        (settings.theme === "system" && themeQuery && themeQuery.matches);

    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.accent = settings.accent;

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
        meta.setAttribute("content", dark ? "#121412" : "#f7f8f6");
    }
}

if (themeQuery) {
    const onSchemeChange = () => {
        if (settings.theme === "system") applyTheme();
    };

    if (themeQuery.addEventListener) {
        themeQuery.addEventListener("change", onSchemeChange);
    } else if (themeQuery.addListener) {
        themeQuery.addListener(onSchemeChange);
    }
}

applyTheme();

/* ---------- Звук ---------- */

const sound = (() => {
    let context = null;
    let master = null;
    let noiseBuffer = null;

    const presets = {
        click: [{ type: "square", from: 660, to: 660, time: 0.04, gain: 0.25 }],
        move: [{ type: "triangle", from: 320, to: 300, time: 0.04, gain: 0.35 }],
        rotate: [{ type: "triangle", from: 520, to: 700, time: 0.05, gain: 0.3 }],
        flip: [{ type: "triangle", from: 500, to: 760, time: 0.06, gain: 0.35 }],
        place: [{ type: "sine", from: 420, to: 260, time: 0.08, gain: 0.5 }],
        drop: [{ type: "sine", from: 260, to: 90, time: 0.12, gain: 0.6 }],
        eat: [
            { type: "square", from: 660, to: 660, time: 0.05, gain: 0.22 },
            { type: "square", from: 990, to: 990, time: 0.06, gain: 0.22, delay: 0.05 }
        ],
        score: [
            { type: "sine", from: 880, to: 880, time: 0.06, gain: 0.4 },
            { type: "sine", from: 1320, to: 1320, time: 0.09, gain: 0.35, delay: 0.06 }
        ],
        bounce: [{ type: "triangle", from: 440, to: 400, time: 0.05, gain: 0.45 }],
        hit: [{ type: "square", from: 180, to: 90, time: 0.1, gain: 0.3 }],
        shoot: [{ type: "sawtooth", from: 900, to: 260, time: 0.09, gain: 0.15 }],
        explode: [{ noise: true, time: 0.28, gain: 0.5 }],
        jump: [{ type: "sine", from: 300, to: 760, time: 0.12, gain: 0.4 }],
        power: [
            { type: "square", from: 300, to: 900, time: 0.25, gain: 0.18 }
        ],
        tick: [{ type: "square", from: 1000, to: 1000, time: 0.03, gain: 0.15 }],
        go: [{ type: "square", from: 1200, to: 1200, time: 0.18, gain: 0.25 }],
        error: [
            { type: "square", from: 220, to: 200, time: 0.08, gain: 0.25 },
            { type: "square", from: 160, to: 150, time: 0.12, gain: 0.25, delay: 0.09 }
        ],
        win: [
            { type: "triangle", from: 523, to: 523, time: 0.1, gain: 0.4 },
            { type: "triangle", from: 659, to: 659, time: 0.1, gain: 0.4, delay: 0.1 },
            { type: "triangle", from: 784, to: 784, time: 0.1, gain: 0.4, delay: 0.2 },
            { type: "triangle", from: 1047, to: 1047, time: 0.25, gain: 0.4, delay: 0.3 }
        ],
        lose: [
            { type: "sawtooth", from: 400, to: 380, time: 0.15, gain: 0.18 },
            { type: "sawtooth", from: 300, to: 280, time: 0.15, gain: 0.18, delay: 0.16 },
            { type: "sawtooth", from: 220, to: 110, time: 0.35, gain: 0.18, delay: 0.32 }
        ]
    };

    function ensureContext() {
        if (context) return context;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return null;

        context = new AudioContextClass();
        master = context.createGain();
        master.connect(context.destination);

        return context;
    }

    function getNoise() {
        if (noiseBuffer) return noiseBuffer;

        const length = Math.floor(context.sampleRate * 0.4);
        noiseBuffer = context.createBuffer(1, length, context.sampleRate);

        const data = noiseBuffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        }

        return noiseBuffer;
    }

    function unlock() {
        if (!settings.sound) return;

        const ctx = ensureContext();

        if (ctx && ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }
    }

    function play(name) {
        if (!settings.sound || document.hidden) return;

        const notes = presets[name];
        const ctx = ensureContext();

        if (!notes || !ctx) return;

        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }

        master.gain.value = settings.volume * 0.5;

        const now = ctx.currentTime + 0.005;

        notes.forEach(note => {
            const start = now + (note.delay || 0);
            const end = start + note.time;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(note.gain, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, end);
            gain.connect(master);

            let source;

            if (note.noise) {
                source = ctx.createBufferSource();
                source.buffer = getNoise();
            } else {
                source = ctx.createOscillator();
                source.type = note.type;
                source.frequency.setValueAtTime(note.from, start);
                source.frequency.exponentialRampToValueAtTime(note.to, end);
            }

            source.connect(gain);
            source.start(start);
            source.stop(end + 0.02);
        });
    }

    ["pointerdown", "keydown"].forEach(type => {
        window.addEventListener(type, unlock, { passive: true });
    });

    return { play };
})();

function vibrate(pattern) {
    if (settings.vibration && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (error) {}
    }
}

/* ---------- Рейтинг ---------- */

const MAX_ENTRIES = 10;
const AI_NAME = "🤖 ИИ";

function playerName(number) {
    const name = (number === 2 ? settings.name2 : settings.name1) || "";
    return name.trim() || (number === 2 ? "Игрок 2" : "Игрок 1");
}

function formatValue(value, format) {
    if (format === "ms") return `${value} мс`;

    if (format === "time") {
        const minutes = Math.floor(value / 60);
        const seconds = String(value % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    }

    if (format === "moves") return `${value} ход.`;

    return String(value);
}

function scoresKey(id) {
    return `gamebox:scores:${id}`;
}

function winsKey(id) {
    return `gamebox:wins:${id}`;
}

function getScores(id) {
    const list = storage.get(scoresKey(id), []);
    return Array.isArray(list) ? list : [];
}

function getWins(id) {
    const wins = storage.get(winsKey(id), {});
    return wins && typeof wins === "object" ? wins : {};
}

function bestText(id) {
    const rating = ratings[id];

    if (!rating) return "";

    if (rating.type === "wins") {
        const total = Object.values(getWins(id))
            .reduce((sum, value) => sum + value, 0);

        return total ? `Партий: ${total}` : "";
    }

    const best = getScores(id)[0];

    return best ? `Рекорд: ${formatValue(best.value, rating.format)}` : "";
}

/* ---------- DOM ---------- */

const homeView = document.getElementById("homeView");
const gameView = document.getElementById("gameView");
const gameRoot = document.getElementById("gameRoot");
const leaderboard = document.getElementById("leaderboard");

const gameTitle = document.getElementById("gameTitle");
const gameCategory = document.getElementById("gameCategory");

const homeButton = document.getElementById("homeButton");
const backButton = document.getElementById("backButton");

let currentGameId = null;
let currentGameCleanup = null;
let lastEntryTime = 0;

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(time) {
    try {
        return new Date(time).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit"
        });
    } catch (error) {
        return "";
    }
}

function renderLeaderboard() {
    if (!leaderboard) return;

    const rating = ratings[currentGameId];

    if (!rating) {
        leaderboard.innerHTML = "";
        return;
    }

    let rows = "";
    let empty = true;

    if (rating.type === "wins") {
        const entries = Object.entries(getWins(currentGameId))
            .sort((a, b) => b[1] - a[1])
            .slice(0, MAX_ENTRIES);

        empty = !entries.length;

        rows = entries.map(([name, wins], index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(name)}</td>
                <td>${wins}</td>
            </tr>
        `).join("");
    } else {
        const entries = getScores(currentGameId);

        empty = !entries.length;

        rows = entries.map((entry, index) => `
            <tr class="${entry.time === lastEntryTime ? "is-new" : ""}">
                <td>${index + 1}</td>
                <td>${escapeHtml(entry.name)}</td>
                <td>${formatValue(entry.value, rating.format)}</td>
                <td class="leaderboard-date">${formatDate(entry.time)}</td>
            </tr>
        `).join("");
    }

    leaderboard.innerHTML = `
        <div class="leaderboard-head">
            <h2>🏆 Рейтинг</h2>
            ${empty ? "" : `<button class="leaderboard-clear" type="button">Очистить</button>`}
        </div>
        ${empty
            ? `<p class="leaderboard-empty">${rating.type === "wins"
                ? "Здесь появятся победы игроков. Имена меняются в настройках."
                : "Пока нет результатов. Сыграй, чтобы попасть в таблицу!"}</p>`
            : `<table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Игрок</th>
                        <th>${rating.type === "wins" ? "Победы" : "Результат"}</th>
                        ${rating.type === "wins" ? "" : "<th class=\"leaderboard-date\">Дата</th>"}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`}
    `;

    const clear = leaderboard.querySelector(".leaderboard-clear");

    if (clear) {
        clear.addEventListener("click", () => {
            if (!confirm("Очистить рейтинг этой игры?")) return;

            storage.remove(scoresKey(currentGameId));
            storage.remove(winsKey(currentGameId));
            renderLeaderboard();
        });
    }
}

let toastTimer = null;

function showToast(text) {
    let toast = document.querySelector(".toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.textContent = text;
    toast.classList.add("visible");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2600);
}

function submitScore(id, value) {
    const rating = ratings[id];

    if (!rating || rating.type !== "best") return 0;
    if (!Number.isFinite(value)) return 0;

    value = Math.round(value);

    if (rating.order === "desc" && value <= 0) return 0;
    if (rating.order === "asc" && value < 0) return 0;

    const list = getScores(id);
    const entry = { name: playerName(1), value, time: Date.now() };

    list.push(entry);
    list.sort((a, b) =>
        rating.order === "asc" ? a.value - b.value : b.value - a.value
    );

    const kept = list.slice(0, MAX_ENTRIES);
    const rank = kept.indexOf(entry) + 1;

    storage.set(scoresKey(id), kept);

    if (rank) {
        lastEntryTime = entry.time;

        if (rank === 1) {
            showToast("🏆 Новый рекорд!");
            sound.play("win");
        } else {
            showToast(`Ты на ${rank}-м месте в рейтинге`);
        }
    }

    if (id === currentGameId) renderLeaderboard();

    return rank;
}

function recordWin(id, name) {
    const rating = ratings[id];

    if (!rating || rating.type !== "wins" || !name) return;

    const wins = getWins(id);
    wins[name] = (wins[name] || 0) + 1;

    storage.set(winsKey(id), wins);

    if (id === currentGameId) renderLeaderboard();
}

/* ---------- Общие помощники для игр ---------- */

function holdButton(button, onDown, onUp, options = {}) {
    let repeatDelay = null;
    let repeatTimer = null;
    let pressed = false;

    function stopRepeat() {
        clearTimeout(repeatDelay);
        clearInterval(repeatTimer);
    }

    function down(event) {
        event.preventDefault();

        if (pressed) return;

        pressed = true;
        button.classList.add("pressed");

        try {
            button.setPointerCapture(event.pointerId);
        } catch (error) {}

        onDown && onDown(event);

        if (options.repeat && onDown) {
            stopRepeat();

            repeatDelay = setTimeout(() => {
                repeatTimer = setInterval(() => {
                    if (pressed) onDown(event);
                }, options.repeat);
            }, options.delay || 220);
        }
    }

    function up(event) {
        if (!pressed) return;

        pressed = false;
        button.classList.remove("pressed");
        stopRepeat();

        onUp && onUp(event);
    }

    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("lostpointercapture", up);
    button.addEventListener("contextmenu", event => event.preventDefault());

    return function release() {
        stopRepeat();
        pressed = false;
    };
}

function onSwipe(element, handler, options = {}) {
    const minDistance = options.distance || 24;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let fired = false;
    let lastFire = 0;

    // После свайпа браузер может прислать click по плитке - игнорируем его.
    element.addEventListener("click", event => {
        if (Date.now() - lastFire < 400) {
            event.stopPropagation();
            event.preventDefault();
        }
    }, true);

    function start(event) {
        if (event.pointerType === "mouse" && !options.mouse) return;

        tracking = true;
        fired = false;
        startX = event.clientX;
        startY = event.clientY;
    }

    function move(event) {
        if (!tracking || !options.continuous) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return;

        fire(dx, dy);

        startX = event.clientX;
        startY = event.clientY;
    }

    function end(event) {
        if (!tracking) return;

        tracking = false;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) {
            if (!fired && options.onTap) options.onTap(event);
            return;
        }

        fire(dx, dy);
    }

    function fire(dx, dy) {
        fired = true;
        lastFire = Date.now();

        if (Math.abs(dx) > Math.abs(dy)) {
            handler(dx > 0 ? "right" : "left");
        } else {
            handler(dy > 0 ? "down" : "up");
        }
    }

    element.addEventListener("pointerdown", start);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", () => {
        tracking = false;
    });
}

function canvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Цикл с фиксированным шагом: одинаковая скорость на 60, 90 и 120 Гц.
function createLoop(step, render) {
    const STEP = 1000 / 60;

    let frame = null;
    let last = 0;
    let accumulator = 0;

    function tick(time) {
        frame = requestAnimationFrame(tick);

        if (!last) last = time;

        accumulator += Math.min(100, time - last);
        last = time;

        let steps = 0;

        while (accumulator >= STEP && steps < 6) {
            if (step() === false) {
                accumulator = 0;
                break;
            }

            accumulator -= STEP;
            steps++;
        }

        if (steps === 6) accumulator = 0;

        render && render();
    }

    return {
        start() {
            if (frame) return;
            last = 0;
            accumulator = 0;
            frame = requestAnimationFrame(tick);
        },

        stop() {
            if (frame) cancelAnimationFrame(frame);
            frame = null;
        },

        get running() {
            return frame !== null;
        }
    };
}

window.GameBox = {
    sound: name => sound.play(name),
    vibrate,
    submit: value => submitScore(currentGameId, value),
    win: name => recordWin(currentGameId, name),
    name: playerName,
    aiName: AI_NAME,
    toast: showToast,
    hold: holdButton,
    swipe: onSwipe,
    point: canvasPoint,
    loop: createLoop
};

/* ---------- Навигация ---------- */

function renderGames() {
    document.querySelectorAll(".games-grid").forEach(grid => {
        grid.innerHTML = "";
    });

    const fragment = {};

    Object.entries(games).forEach(([id, game]) => {
        const grid = document.getElementById(`${game.group}Grid`);

        if (!grid) return;

        const card = document.createElement("button");

        card.className = "game-card";
        card.type = "button";

        const best = bestText(id);

        card.innerHTML = `
            <span class="game-icon">${game.icon}</span>
            <h3>${game.title}</h3>
            <p>${game.desc}</p>
            ${best ? `<span class="game-best">${escapeHtml(best)}</span>` : ""}
        `;

        card.addEventListener("click", () => {
            openGame(id);
        });

        if (!fragment[game.group]) {
            fragment[game.group] = document.createDocumentFragment();
        }

        fragment[game.group].appendChild(card);
    });

    Object.entries(fragment).forEach(([group, items]) => {
        document.getElementById(`${group}Grid`).appendChild(items);
    });
}

function stopCurrentGame() {
    if (currentGameCleanup) {
        try {
            currentGameCleanup();
        } catch (error) {
            console.error(error);
        }

        currentGameCleanup = null;
    }

    gameRoot.innerHTML = "";
}

function openGame(id, fromHistory) {
    const game = games[id];

    if (!game) return;

    stopCurrentGame();

    currentGameId = id;
    lastEntryTime = 0;

    homeView.classList.add("hidden");
    gameView.classList.remove("hidden");
    document.body.classList.add("in-game");

    gameTitle.textContent = game.title;
    gameCategory.textContent = game.category;
    document.title = `${game.title} · GameBox`;

    if (!fromHistory && location.hash !== `#${id}`) {
        history.pushState({ game: id }, "", `#${id}`);
    }

    const createGame = window[game.create];

    if (typeof createGame === "function") {
        try {
            const cleanup = createGame(gameRoot);
            currentGameCleanup = typeof cleanup === "function" ? cleanup : null;
        } catch (error) {
            console.error(error);
            showGameError();
        }
    } else {
        showGameError();
    }

    renderLeaderboard();

    window.scrollTo({ top: 0, behavior: "auto" });
}

function showGameError() {
    gameRoot.innerHTML = `
        <div class="game-box game-error">
            <strong>Игра не загрузилась</strong>
            <p>Проверьте подключение файла игры или обновите страницу.</p>
        </div>
    `;
}

function goHome(fromHistory) {
    stopCurrentGame();

    currentGameId = null;

    if (leaderboard) leaderboard.innerHTML = "";

    gameView.classList.add("hidden");
    homeView.classList.remove("hidden");
    document.body.classList.remove("in-game");
    document.title = "GameBox";

    if (!fromHistory && location.hash) {
        history.pushState({}, "", location.pathname + location.search);
    }

    renderGames();

    window.scrollTo({ top: 0, behavior: "auto" });
}

homeButton.addEventListener("click", () => goHome());
backButton.addEventListener("click", () => goHome());

window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);

    if (games[id]) {
        openGame(id, true);
    } else {
        goHome(true);
    }
});

// Кнопки в игре не должны перехватывать пробел/Enter после клика мышью или пальцем.
gameRoot.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (button && event.detail > 0) {
        button.blur();
    }
});

// Звук нажатия на кнопки интерфейса игр.
gameRoot.addEventListener("pointerdown", event => {
    if (event.target.closest(".game-button, .mode-button")) {
        sound.play("click");
    }
});

/* ---------- Окно настроек ---------- */

const settingsButton = document.getElementById("settingsButton");
const settingsModal = document.getElementById("settingsModal");

function syncSettingsForm() {
    if (!settingsModal) return;

    settingsModal.querySelectorAll("[data-theme-option]").forEach(button => {
        button.classList.toggle("active", button.dataset.themeOption === settings.theme);
    });

    settingsModal.querySelectorAll("[data-accent-option]").forEach(button => {
        button.classList.toggle("active", button.dataset.accentOption === settings.accent);
    });

    settingsModal.querySelector("#settingSound").checked = settings.sound;
    settingsModal.querySelector("#settingVolume").value = Math.round(settings.volume * 100);
    settingsModal.querySelector("#settingVolume").disabled = !settings.sound;
    settingsModal.querySelector("#settingVibration").checked = settings.vibration;
    settingsModal.querySelector("#settingName1").value = settings.name1;
    settingsModal.querySelector("#settingName2").value = settings.name2;
}

function openSettings() {
    syncSettingsForm();
    settingsModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    settingsModal.querySelector(".settings-close").focus();
}

function closeSettings() {
    settingsModal.classList.add("hidden");
    document.body.classList.remove("modal-open");

    if (currentGameId) renderLeaderboard();
}

if (settingsButton && settingsModal) {
    settingsButton.addEventListener("click", openSettings);

    settingsModal.addEventListener("click", event => {
        if (
            event.target === settingsModal ||
            event.target.closest(".settings-close")
        ) {
            closeSettings();
        }

        const themeButton = event.target.closest("[data-theme-option]");

        if (themeButton) {
            settings.theme = themeButton.dataset.themeOption;
            saveSettings();
            applyTheme();
            syncSettingsForm();
        }

        const accentButton = event.target.closest("[data-accent-option]");

        if (accentButton) {
            settings.accent = accentButton.dataset.accentOption;
            saveSettings();
            applyTheme();
            syncSettingsForm();
        }

        if (event.target.closest(".settings-reset")) {
            if (confirm("Удалить рейтинги и рекорды всех игр?")) {
                Object.keys(ratings).forEach(id => {
                    storage.remove(scoresKey(id));
                    storage.remove(winsKey(id));
                });

                showToast("Рейтинги очищены");

                if (currentGameId) renderLeaderboard();
            }
        }
    });

    settingsModal.querySelector("#settingSound").addEventListener("change", event => {
        settings.sound = event.target.checked;
        saveSettings();
        syncSettingsForm();

        if (settings.sound) sound.play("score");
    });

    settingsModal.querySelector("#settingVolume").addEventListener("input", event => {
        settings.volume = Number(event.target.value) / 100;
        saveSettings();
    });

    settingsModal.querySelector("#settingVolume").addEventListener("change", () => {
        sound.play("score");
    });

    settingsModal.querySelector("#settingVibration").addEventListener("change", event => {
        settings.vibration = event.target.checked;
        saveSettings();
        vibrate(40);
    });

    ["name1", "name2"].forEach((key, index) => {
        const input = settingsModal.querySelector(`#settingName${index + 1}`);

        input.addEventListener("input", () => {
            settings[key] = input.value.slice(0, 20);
            saveSettings();
        });
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !settingsModal.classList.contains("hidden")
        ) {
            closeSettings();
        }
    });

    // Пока открыто окно настроек, игры не получают нажатия клавиш.
    document.addEventListener("keydown", event => {
        if (settingsModal.classList.contains("hidden")) return;
        if (event.key === "Escape" || event.key === "Tab") return;
        if (event.target.closest && event.target.closest("#settingsModal")) {
            event.stopImmediatePropagation();
            return;
        }
        event.stopImmediatePropagation();
        event.preventDefault();
    }, true);
}

renderGames();

if (games[location.hash.slice(1)]) {
    openGame(location.hash.slice(1), true);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .catch(() => {});
    });
}
