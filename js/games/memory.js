window.createMemory = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Ходы: <span class="memory-moves">0</span></strong>
                <button class="game-button memory-restart">Заново</button>
            </div>

            <div class="memory-board"></div>

            <p class="game-status memory-status">
                Найди все пары.
            </p>
        </div>
    `;

    const board = root.querySelector(".memory-board");
    const movesElement = root.querySelector(".memory-moves");
    const status = root.querySelector(".memory-status");
    const restart = root.querySelector(".memory-restart");

    const symbols = [
        "🍎", "🍌", "🍇", "🍉",
        "🍓", "🍒", "🥝", "🍍"
    ];

    let cards;
    let firstCard;
    let secondCard;
    let locked;
    let moves;
    let matched;
    let hideTimer = null;
    let buttons = [];

    function shuffle(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }

        return list;
    }

    function start() {
        clearTimeout(hideTimer);

        cards = shuffle([...symbols, ...symbols])
            .map((symbol, index) => ({
                id: index,
                symbol,
                open: false,
                matched: false
            }));

        firstCard = null;
        secondCard = null;
        locked = false;
        moves = 0;
        matched = 0;

        movesElement.textContent = moves;
        status.textContent = "Найди все пары.";

        buildBoard();
        render();
    }

    function flip(card) {
        if (
            locked ||
            card.open ||
            card.matched
        ) {
            return;
        }

        card.open = true;
        GameBox.sound("flip");

        if (!firstCard) {
            firstCard = card;
            render();
            return;
        }

        secondCard = card;
        moves++;

        movesElement.textContent = moves;

        render();

        if (firstCard.symbol === secondCard.symbol) {
            firstCard.matched = true;
            secondCard.matched = true;

            matched += 2;

            firstCard = null;
            secondCard = null;

            if (matched === cards.length) {
                status.textContent =
                    `Победа! Ходов: ${moves}`;

                GameBox.sound("win");
                GameBox.vibrate(80);
                GameBox.submit(moves);
            } else {
                GameBox.sound("score");
            }

            render();
        } else {
            locked = true;

            hideTimer = setTimeout(() => {
                firstCard.open = false;
                secondCard.open = false;

                firstCard = null;
                secondCard = null;

                locked = false;

                render();
            }, 700);
        }
    }

    function buildBoard() {
        board.innerHTML = "";

        buttons = cards.map(card => {
            const button = document.createElement("button");

            button.className = "memory-card";
            button.innerHTML = `<span class="memory-symbol">?</span>`;

            button.addEventListener("click", () => {
                flip(card);
            });

            board.appendChild(button);

            return button;
        });
    }

    function render() {
        cards.forEach((card, index) => {
            const button = buttons[index];
            const visible = card.open || card.matched;

            button.classList.toggle("open", visible);
            button.classList.toggle("matched", card.matched);
            button.firstElementChild.textContent = visible ? card.symbol : "?";
        });
    }

    restart.addEventListener("click", start);

    start();

    return function() {
        clearTimeout(hideTimer);
    };
};