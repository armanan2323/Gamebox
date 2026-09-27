const homeView = document.getElementById("homeView");
const gameView = document.getElementById("gameView");
const gameRoot = document.getElementById("gameRoot");

const gameTitle = document.getElementById("gameTitle");
const gameCategory = document.getElementById("gameCategory");

const homeButton = document.getElementById("homeButton");
const backButton = document.getElementById("backButton");

const games = {
    snake: {
        title: "Snake",
        category: "Аркада",
        create: window.createSnake
    },

    tetris: {
        title: "Tetris",
        category: "Аркада",
        create: window.createTetris
    },

    minesweeper: {
        title: "Minesweeper",
        category: "Головоломка",
        create: window.createMinesweeper
    },

    pong: {
        title: "Pong",
        category: "Аркада",
        create: window.createPong
    },

    memory: {
        title: "Memory",
        category: "Головоломка",
        create: window.createMemory
    },

    "tic-tac-toe": {
        title: "Tic-Tac-Toe",
        category: "Настольная",
        create: window.createTicTacToe
    }
};

let currentGameCleanup = null;

function openGame(name) {
    const game = games[name];

    if (!game) {
        return;
    }

    if (currentGameCleanup) {
        currentGameCleanup();
        currentGameCleanup = null;
    }

    homeView.classList.add("hidden");
    gameView.classList.remove("hidden");

    gameTitle.textContent = game.title;
    gameCategory.textContent = game.category;

    gameRoot.innerHTML = "";

    currentGameCleanup = game.create(gameRoot);

    window.scrollTo({
        top: 0,
        behavior: "instant"
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
        behavior: "instant"
    });
}

document.querySelectorAll("[data-game]").forEach(button => {
    button.addEventListener("click", () => {
        openGame(button.dataset.game);
    });
});

homeButton.addEventListener("click", goHome);
backButton.addEventListener("click", goHome);