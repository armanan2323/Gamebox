window.createMemory = function (root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Ходы: <span class="memory-moves">0</span></strong>
                <button class="game-button memory-restart">Заново</button>
            </div>

            <div class="memory-board"></div>

            <p class="game-status memory-status">
                Найди все пары
            </p>
        </div>
    `;

    const boardElement = root.querySelector(".memory-board");
    const movesElement = root.querySelector(".memory-moves");
    const status = root.querySelector(".memory-status");
    const restart = root.querySelector(".memory-restart");

    const symbols = [
        "★", "★",
        "●", "●",
        "▲", "▲",
        "■", "■",
        "◆", "◆",
        "♥", "♥",
        "☀", "☀",
        "✦", "✦"
    ];

    let cards;
    let firstCard;
    let secondCard;
    let locked;
    let moves;
    let matched;

    function start() {
        cards = [...symbols].sort(() => Math.random() - 0.5);

        firstCard = null;
        secondCard = null;
        locked = false;
        moves = 0;
        matched = 0;

        movesElement.textContent = "0";
        status.textContent = "Найди все пары";

        render();
    }

    function render() {
        boardElement.innerHTML = "";

        cards.forEach((symbol, index) => {
            const button = document.createElement("button");

            button.className = "memory-card";

            const visible =
                firstCard === index ||
                secondCard === index ||
                cards[index] === null;

            if (visible) {
                button.classList.add(
                    cards[index] === null
                        ? "matched"
                        : "flipped"
                );
            }

            button.innerHTML = `
                <span class="memory-symbol">
                    ${visible && symbol ? symbol : "?"}
                </span>
            `;

            button.addEventListener("click", () => flip(index));

            boardElement.appendChild(button);
        });
    }

    function flip(index) {
        if (
            locked ||
            cards[index] === null ||
            index === firstCard
        ) {
            return;
        }

        if (firstCard === null) {
            firstCard = index;
            render();
            return;
        }

        secondCard = index;
        moves++;
        movesElement.textContent = moves;

        render();

        locked = true;

        setTimeout(() => {
            if (cards[firstCard] === cards[secondCard]) {
                cards[firstCard] = null;
                cards[secondCard] = null;
                matched += 2;

                if (matched === cards.length) {
                    status.textContent = "Все пары найдены!";
                }
            }

            firstCard = null;
            secondCard = null;
            locked = false;

            render();
        }, 550);
    }

    restart.addEventListener("click", start);

    start();

    return function cleanup() {};
};