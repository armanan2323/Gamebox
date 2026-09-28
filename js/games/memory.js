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

    function start() {
        cards = [...symbols, ...symbols]
            .sort(() => Math.random() - 0.5)
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
            }

            render();
        } else {
            locked = true;

            setTimeout(() => {
                firstCard.open = false;
                secondCard.open = false;

                firstCard = null;
                secondCard = null;

                locked = false;

                render();
            }, 700);
        }
    }

    function render() {
        board.innerHTML = "";

        cards.forEach(card => {
            const button = document.createElement("button");

            button.className = "memory-card";

            if (card.open || card.matched) {
                button.classList.add("open");
            }

            if (card.matched) {
                button.classList.add("matched");
            }

            button.innerHTML = `
                <span class="memory-symbol">
                    ${card.open || card.matched ? card.symbol : "?"}
                </span>
            `;

            button.addEventListener("click", () => {
                flip(card);
            });

            board.appendChild(button);
        });
    }

    restart.addEventListener("click", start);

    start();

    return function() {};
};