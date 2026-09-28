window.createQuickMath = function(root) {
    root.innerHTML = `
        <div class="game-box quick-math-game">
            <div class="game-toolbar">
                <strong>
                    Счёт:
                    <span class="math-score">0</span>
                </strong>

                <strong>
                    Время:
                    <span class="math-time">30</span>
                </strong>

                <button class="game-button math-restart">
                    Заново
                </button>
            </div>

            <div class="quick-math-question">
                <span class="math-number-one">7</span>
                <span class="math-operation">×</span>
                <span class="math-number-two">8</span>
                <span>= ?</span>
            </div>

            <div class="math-answers">
                <button class="math-answer"></button>
                <button class="math-answer"></button>
                <button class="math-answer"></button>
                <button class="math-answer"></button>
            </div>

            <p class="game-status math-status">
                Нажми на правильный ответ.
            </p>
        </div>
    `;

    const scoreElement =
        root.querySelector(".math-score");

    const timeElement =
        root.querySelector(".math-time");

    const numberOneElement =
        root.querySelector(".math-number-one");

    const operationElement =
        root.querySelector(".math-operation");

    const numberTwoElement =
        root.querySelector(".math-number-two");

    const statusElement =
        root.querySelector(".math-status");

    const answerButtons =
        [...root.querySelectorAll(".math-answer")];

    const restartButton =
        root.querySelector(".math-restart");

    let score = 0;
    let time = 30;
    let answer;
    let timer;
    let running = false;

    function reset() {
        clearInterval(timer);

        score = 0;
        time = 30;
        running = true;

        scoreElement.textContent = "0";
        timeElement.textContent = "30";

        statusElement.textContent =
            "Нажми на правильный ответ.";

        answerButtons.forEach(
            button => {
                button.disabled = false;
            }
        );

        generateQuestion();

        timer = setInterval(() => {
            time--;

            timeElement.textContent =
                time;

            if (time <= 0) {
                endGame();
            }
        }, 1000);
    }

    function generateQuestion() {
        const operations = [
            "+",
            "-",
            "×"
        ];

        const operation =
            operations[
                Math.floor(
                    Math.random() *
                    operations.length
                )
            ];

        let a;
        let b;

        if (operation === "×") {
            a =
                Math.floor(
                    Math.random() * 13
                ) + 2;

            b =
                Math.floor(
                    Math.random() * 13
                ) + 2;

            answer = a * b;
        }

        if (operation === "+") {
            a =
                Math.floor(
                    Math.random() * 80
                ) + 10;

            b =
                Math.floor(
                    Math.random() * 80
                ) + 10;

            answer = a + b;
        }

        if (operation === "-") {
            a =
                Math.floor(
                    Math.random() * 80
                ) + 20;

            b =
                Math.floor(
                    Math.random() * a
                );

            answer = a - b;
        }

        numberOneElement.textContent = a;
        numberTwoElement.textContent = b;
        operationElement.textContent = operation;

        const answers = new Set();

        answers.add(answer);

        while (answers.size < 4) {
            const offset =
                Math.floor(
                    Math.random() * 21
                ) - 10;

            if (offset !== 0) {
                answers.add(
                    answer + offset
                );
            }
        }

        const shuffled =
            [...answers].sort(
                () => Math.random() - 0.5
            );

        answerButtons.forEach(
            (button, index) => {
                button.textContent =
                    shuffled[index];

                button.dataset.answer =
                    shuffled[index];
            }
        );
    }

    function selectAnswer(event) {
        if (!running) return;

        const selected =
            Number(
                event.currentTarget.dataset.answer
            );

        if (selected === answer) {
            score++;

            scoreElement.textContent =
                score;

            statusElement.textContent =
                "Правильно!";

            generateQuestion();
        } else {
            statusElement.textContent =
                `Неверно. Правильный ответ: ${answer}`;

            generateQuestion();
        }
    }

    function endGame() {
        running = false;

        clearInterval(timer);

        time = 0;
        timeElement.textContent = "0";

        statusElement.textContent =
            `Время вышло! Результат: ${score}`;

        answerButtons.forEach(
            button => {
                button.disabled = true;
            }
        );
    }

    answerButtons.forEach(
        button => {
            button.addEventListener(
                "click",
                selectAnswer
            );
        }
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        clearInterval(timer);

        restartButton.removeEventListener(
            "click",
            reset
        );

        answerButtons.forEach(
            button => {
                button.removeEventListener(
                    "click",
                    selectAnswer
                );
            }
        );
    };
};