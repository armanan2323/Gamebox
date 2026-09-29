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

const homeView = document.getElementById("homeView");
const gameView = document.getElementById("gameView");
const gameRoot = document.getElementById("gameRoot");

const gameTitle = document.getElementById("gameTitle");
const gameCategory = document.getElementById("gameCategory");

const homeButton = document.getElementById("homeButton");
const backButton = document.getElementById("backButton");

let currentGameCleanup = null;

function renderGames() {
    Object.entries(games).forEach(([id, game]) => {

        const grid = document.getElementById(
            `${game.group}Grid`
        );

        if (!grid) return;

        const card = document.createElement("button");

        card.className = "game-card";

        card.innerHTML = `
            <span class="game-icon">
                ${game.icon}
            </span>

            <h3>
                ${game.title}
            </h3>

            <p>
                ${game.desc}
            </p>
        `;

        card.addEventListener("click", () => {
            openGame(id);
        });

        grid.appendChild(card);
    });
}

function openGame(id) {

    const game = games[id];

    if (!game) return;

    if (currentGameCleanup) {
        currentGameCleanup();
        currentGameCleanup = null;
    }

    homeView.classList.add("hidden");
    gameView.classList.remove("hidden");

    gameTitle.textContent = game.title;
    gameCategory.textContent = game.category;

    gameRoot.innerHTML = "";

    const createGame = window[game.create];

    if (typeof createGame === "function") {
        currentGameCleanup = createGame(gameRoot) || null;
    } else {
        gameRoot.innerHTML = `
            <div class="game-box game-error">
                <strong>Игра не загрузилась</strong>
                <p>Проверьте подключение файла игры или обновите страницу.</p>
            </div>
        `;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function goHome() {

    if (currentGameCleanup) {
        currentGameCleanup();
        currentGameCleanup = null;
    }

    gameRoot.innerHTML = "";

    gameView.classList.add("hidden");
    homeView.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

homeButton.addEventListener("click", goHome);
backButton.addEventListener("click", goHome);

renderGames();

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js")
            .catch(() => {});

    });

}