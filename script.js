(function () {
    "use strict";

    var app = document.getElementById("app");
    var boardViewport = document.getElementById("boardViewport");
    var boardScene = document.getElementById("boardScene");
    var board = document.getElementById("board");
    var status = document.getElementById("status");
    var statusText = document.getElementById("statusText");
    var gameActions = document.getElementById("gameActions");
    var newGameButton = document.getElementById("newGameButton");
    var undoButton = document.getElementById("undoButton");
    var settingsButton = document.getElementById("settingsButton");
    var settingsOverlay = document.getElementById("settingsOverlay");
    var closeSettingsButton = document.getElementById("closeSettingsButton");
    var modalAiMode = document.getElementById("modalAiMode");
    var modalTwoMode = document.getElementById("modalTwoMode");
    var difficultySection = document.getElementById("difficultySection");
    var difficultySelect = document.getElementById("difficultySelect");
    var animationToggle = document.getElementById("animationToggle");
    var animationSwitch = document.getElementById("animationSwitch");
    var animationHint = document.getElementById("animationHint");
    var promotionOverlay = document.getElementById("promotionOverlay");

    var PIECES = {
        w: {
            p: "♙",
            r: "♖",
            n: "♘",
            b: "♗",
            q: "♕",
            k: "♔"
        },
        b: {
            p: "♟",
            r: "♜",
            n: "♞",
            b: "♝",
            q: "♛",
            k: "♚"
        }
    };

    var VALUE = {
        p: 100,
        n: 320,
        b: 330,
        r: 500,
        q: 900,
        k: 20000
    };

    var PST = {
        p: [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
            5, 5, 10, 25, 25, 10, 5, 5,
            0, 0, 0, 20, 20, 0, 0, 0,
            5, -5, -10, 0, 0, -10, -5, 5,
            5, 10, 10, -20, -20, 10, 10, 5,
            0, 0, 0, 0, 0, 0, 0, 0
        ],
        n: [
            -50, -40, -30, -30, -30, -30, -40, -50,
            -40, -20, 0, 5, 5, 0, -20, -40,
            -30, 5, 10, 15, 15, 10, 5, -30,
            -30, 0, 15, 20, 20, 15, 0, -30,
            -30, 5, 15, 20, 20, 15, 5, -30,
            -30, 0, 10, 15, 15, 10, 0, -30,
            -40, -20, 0, 0, 0, 0, -20, -40,
            -50, -40, -30, -30, -30, -30, -40, -50
        ],
        b: [
            -20, -10, -10, -10, -10, -10, -10, -20,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -10, 0, 5, 10, 10, 5, 0, -10,
            -10, 5, 5, 10, 10, 5, 5, -10,
            -10, 0, 10, 10, 10, 10, 0, -10,
            -10, 10, 10, 10, 10, 10, 10, -10,
            -10, 5, 0, 0, 0, 0, 5, -10,
            -20, -10, -10, -10, -10, -10, -10, -20
        ],
        r: [
            0, 0, 0, 0, 0, 0, 0, 0,
            5, 10, 10, 10, 10, 10, 10, 5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            0, 0, 0, 5, 5, 0, 0, 0
        ],
        q: [
            -20, -10, -10, 0, 0, -10, -10, -20,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -10, 0, 5, 5, 5, 5, 0, -10,
            0, 0, 5, 5, 5, 5, 0, -5,
            -5, 0, 5, 5, 5, 5, 0, -5,
            -10, 5, 5, 5, 5, 5, 0, -10,
            -10, 0, 5, 0, 0, 0, 0, -10,
            -20, -10, -10, 0, 0, -10, -10, -20
        ],
        k: [
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -20, -30, -30, -40, -40, -30, -30, -20,
            -10, -20, -20, -20, -20, -20, -20, -10,
            20, 20, 0, 0, 0, 0, 20, 20,
            20, 30, 10, 0, 0, 10, 30, 20
        ]
    };

    var state = createInitialState();
    var history = [];
    var positionHistory = {};
    var cells = [];
    var pieceNodes = [];
    var rankNodes = [];
    var fileNodes = [];
    var targetFlags = [];
    var selected = -1;
    var cursor = -1;
    var legalTargets = [];
    var pendingPromotion = null;
    var boardBlack = false;
    var gameMode = "ai";
    var aiThinking = false;
    var aiTimer = 0;
    var searchDeadline = 0;
    var orientationTimer = 0;
    var resizeTimer = 0;
    var resizeFrame = 0;
    var animationEnabled = true;
    var lastRenderedResult = null;
    var modernLayout = false;
    var pointerEvents = false;

    function detectFeatures() {
        var css = window.CSS;
        var supports = css && typeof css.supports === "function";

        modernLayout = !!(
            supports &&
            css.supports("display", "grid") &&
            css.supports("aspect-ratio", "1 / 1")
        );

        pointerEvents =
            typeof window.PointerEvent === "function";
    }

    function applyAppClass() {
        var classes =
            modernLayout
                ? "app modern-layout"
                : "app legacy-layout";

        if (!animationEnabled) {
            classes += " no-animations";
        }

        app.className = classes;
    }

    detectFeatures();

    try {
        if (
            window.localStorage &&
            localStorage.getItem(
                "2dchess.animations"
            ) === "0"
        ) {
            animationEnabled = false;
        }
    } catch (e) { }

    try {
        if (
            window.matchMedia &&
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            animationEnabled = false;
        }
    } catch (e2) { }

    function createInitialState() {
        return {
            board: [
                "r", "n", "b", "q", "k", "b", "n", "r",
                "p", "p", "p", "p", "p", "p", "p", "p",
                ".", ".", ".", ".", ".", ".", ".", ".",
                ".", ".", ".", ".", ".", ".", ".", ".",
                ".", ".", ".", ".", ".", ".", ".", ".",
                ".", ".", ".", ".", ".", ".", ".", ".",
                "P", "P", "P", "P", "P", "P", "P", "P",
                "R", "N", "B", "Q", "K", "B", "N", "R"
            ],
            turn: "w",
            castling: {
                K: true,
                Q: true,
                k: true,
                q: true
            },
            ep: -1,
            halfmove: 0,
            fullmove: 1,
            last: null
        };
    }

    function cloneState(s) {
        return {
            board: s.board.slice(),
            turn: s.turn,
            castling: {
                K: s.castling.K,
                Q: s.castling.Q,
                k: s.castling.k,
                q: s.castling.q
            },
            ep: s.ep,
            halfmove: s.halfmove,
            fullmove: s.fullmove,
            last: s.last
                ? {
                    from: s.last.from,
                    to: s.last.to
                }
                : null
        };
    }

    function row(i) {
        return Math.floor(i / 8);
    }

    function col(i) {
        return i % 8;
    }

    function index(r, c) {
        return r * 8 + c;
    }

    function inside(r, c) {
        return r >= 0 &&
            r < 8 &&
            c >= 0 &&
            c < 8;
    }

    function colorOf(piece) {
        if (!piece || piece === ".") {
            return null;
        }

        return piece === piece.toUpperCase()
            ? "w"
            : "b";
    }

    function typeOf(piece) {
        return piece.toLowerCase();
    }

    function opposite(color) {
        return color === "w"
            ? "b"
            : "w";
    }

    function isTV() {
        var ua =
            navigator.userAgent || "";

        return /web0s|webos|netcast|smarttv|hbbtv|viera|tizen.*tv|googletv|google tv|aftb|aftm|android tv/i.test(
            ua
        );
    }

    function isTouchDevice() {
        return (
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    }

    function isDesktop() {
        return (
            !isTV() &&
            !isTouchDevice() &&
            getViewportWidth() >= 900
        );
    }

    function usePCStyle() {
        return isTV() || isDesktop();
    }

    function shouldAutoFlip() {
        return (
            gameMode === "two" &&
            usePCStyle()
        );
    }

    function getViewportWidth() {
        return (
            window.innerWidth ||
            document.documentElement.clientWidth ||
            320
        );
    }

    function getViewportHeight() {
        return (
            window.innerHeight ||
            document.documentElement.clientHeight ||
            480
        );
    }

    function getBoardSize() {
        var width = getViewportWidth();
        var height = getViewportHeight();

        var horizontal =
            width <= 360
                ? 10
                : width <= 600
                    ? 14
                    : width <= 900
                        ? 20
                        : 28;

        var availableWidth =
            Math.max(
                180,
                width - horizontal
            );

        var landscape =
            width > height;

        var size;

        if (!landscape) {
            size =
                Math.min(
                    760,
                    availableWidth
                );
        } else {
            var topbar =
                document.querySelector(
                    ".topbar"
                );

            var topbarHeight =
                topbar
                    ? topbar.offsetHeight
                    : 40;

            var availableHeight =
                height -
                topbarHeight -
                36 -
                38 -
                22;

            size =
                Math.min(
                    760,
                    availableWidth,
                    Math.max(
                        180,
                        availableHeight
                    )
                );
        }

        return Math.max(
            180,
            Math.floor(size)
        );
    }

    function resizeBoard() {
        resizeTimer = 0;
        resizeFrame = 0;

        if (modernLayout) {
            boardScene.style.width = "";
            boardScene.style.height = "";
            status.style.width = "";
            gameActions.style.width = "";
            return;
        }

        var size =
            getBoardSize();

        if (!size) {
            return;
        }

        boardScene.style.width =
            size + "px";

        boardScene.style.height =
            size + "px";

        status.style.width =
            size + "px";

        gameActions.style.width =
            size + "px";

        var fontSize =
            Math.max(
                20,
                Math.floor(
                    (size / 8) * .84
                )
            );

        var i;

        for (
            i = 0;
            i < pieceNodes.length;
            i++
        ) {
            pieceNodes[i].style.fontSize =
                fontSize + "px";
        }

        var coordSize =
            size <= 420
                ? 7
                : 9;

        for (
            i = 0;
            i < rankNodes.length;
            i++
        ) {
            rankNodes[i].style.fontSize =
                coordSize + "px";

            fileNodes[i].style.fontSize =
                coordSize + "px";
        }
    }

    function scheduleResize() {
        if (resizeTimer) {
            clearTimeout(
                resizeTimer
            );
        }

        if (
            resizeFrame &&
            window.cancelAnimationFrame
        ) {
            window.cancelAnimationFrame(
                resizeFrame
            );

            resizeFrame = 0;
        }

        if (
            modernLayout &&
            window.requestAnimationFrame
        ) {
            resizeFrame =
                window.requestAnimationFrame(
                    function () {
                        resizeFrame = 0;
                        resizeBoard();
                    }
                );
        } else {
            resizeTimer =
                setTimeout(
                    resizeBoard,
                    35
                );
        }
    }

    function updateAnimationUI() {
        applyAppClass();

        animationSwitch.className =
            animationEnabled
                ? "switch on"
                : "switch";

        animationHint.innerHTML =
            animationEnabled
                ? "Включены плавные анимации."
                : "Анимации отключены для минимальной нагрузки.";
    }

    function saveAnimationSetting() {
        try {
            localStorage.setItem(
                "2dchess.animations",
                animationEnabled
                    ? "1"
                    : "0"
            );
        } catch (e) { }
    }

    function findKing(s, color) {
        var target =
            color === "w"
                ? "K"
                : "k";

        var i;

        for (
            i = 0;
            i < 64;
            i++
        ) {
            if (
                s.board[i] === target
            ) {
                return i;
            }
        }

        return -1;
    }

    function squareAttacked(
        s,
        square,
        byColor
    ) {
        var r =
            row(square);

        var c =
            col(square);

        var rr;
        var cc;
        var i;
        var piece;

        var pawn =
            byColor === "w"
                ? "P"
                : "p";

        var pawnRow =
            byColor === "w"
                ? r + 1
                : r - 1;

        if (
            inside(
                pawnRow,
                c - 1
            ) &&
            s.board[
            index(
                pawnRow,
                c - 1
            )
            ] === pawn
        ) {
            return true;
        }

        if (
            inside(
                pawnRow,
                c + 1
            ) &&
            s.board[
            index(
                pawnRow,
                c + 1
            )
            ] === pawn
        ) {
            return true;
        }

        var knight =
            byColor === "w"
                ? "N"
                : "n";

        var knightDirections = [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1]
        ];

        for (
            i = 0;
            i < knightDirections.length;
            i++
        ) {
            rr =
                r +
                knightDirections[i][0];

            cc =
                c +
                knightDirections[i][1];

            if (
                inside(rr, cc) &&
                s.board[
                index(rr, cc)
                ] === knight
            ) {
                return true;
            }
        }

        var bishop =
            byColor === "w"
                ? "B"
                : "b";

        var rook =
            byColor === "w"
                ? "R"
                : "r";

        var queen =
            byColor === "w"
                ? "Q"
                : "q";

        var king =
            byColor === "w"
                ? "K"
                : "k";

        var diagonal = [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]
        ];

        var straight = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ];

        for (
            i = 0;
            i < diagonal.length;
            i++
        ) {
            rr =
                r +
                diagonal[i][0];

            cc =
                c +
                diagonal[i][1];

            while (
                inside(rr, cc)
            ) {
                piece =
                    s.board[
                    index(rr, cc)
                    ];

                if (piece !== ".") {
                    if (
                        piece === bishop ||
                        piece === queen
                    ) {
                        return true;
                    }

                    break;
                }

                rr +=
                    diagonal[i][0];

                cc +=
                    diagonal[i][1];
            }
        }

        for (
            i = 0;
            i < straight.length;
            i++
        ) {
            rr =
                r +
                straight[i][0];

            cc =
                c +
                straight[i][1];

            while (
                inside(rr, cc)
            ) {
                piece =
                    s.board[
                    index(rr, cc)
                    ];

                if (piece !== ".") {
                    if (
                        piece === rook ||
                        piece === queen
                    ) {
                        return true;
                    }

                    break;
                }

                rr +=
                    straight[i][0];

                cc +=
                    straight[i][1];
            }
        }

        for (
            rr = r - 1;
            rr <= r + 1;
            rr++
        ) {
            for (
                cc = c - 1;
                cc <= c + 1;
                cc++
            ) {
                if (
                    inside(rr, cc) &&
                    !(
                        rr === r &&
                        cc === c
                    ) &&
                    s.board[
                    index(rr, cc)
                    ] === king
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function inCheck(
        s,
        color
    ) {
        var king =
            findKing(
                s,
                color
            );

        return (
            king < 0 ||
            squareAttacked(
                s,
                king,
                opposite(color)
            )
        );
    }

    function addMove(
        list,
        from,
        to,
        options
    ) {
        list.push({
            from: from,
            to: to,
            promotion:
                options &&
                    options.promotion
                    ? options.promotion
                    : null,
            castle:
                options &&
                    options.castle
                    ? options.castle
                    : null,
            enPassant: !!(
                options &&
                options.enPassant
            )
        });
    }

    function addPromotions(
        list,
        from,
        to
    ) {
        addMove(
            list,
            from,
            to,
            {
                promotion: "q"
            }
        );

        addMove(
            list,
            from,
            to,
            {
                promotion: "r"
            }
        );

        addMove(
            list,
            from,
            to,
            {
                promotion: "b"
            }
        );

        addMove(
            list,
            from,
            to,
            {
                promotion: "n"
            }
        );
    }

    function generatePseudoMoves(
        s,
        color
    ) {
        var moves = [];
        var b = s.board;

        var i;
        var piece;
        var type;
        var r;
        var c;
        var rr;
        var cc;
        var target;

        for (
            i = 0;
            i < 64;
            i++
        ) {
            piece =
                b[i];

            if (
                piece === "." ||
                colorOf(piece) !== color
            ) {
                continue;
            }

            type =
                typeOf(piece);

            r =
                row(i);

            c =
                col(i);

            if (type === "p") {
                var direction =
                    color === "w"
                        ? -1
                        : 1;

                var startRow =
                    color === "w"
                        ? 6
                        : 1;

                var promotionRow =
                    color === "w"
                        ? 0
                        : 7;

                rr =
                    r + direction;

                if (
                    inside(rr, c) &&
                    b[
                    index(
                        rr,
                        c
                    )
                    ] === "."
                ) {
                    if (
                        rr === promotionRow
                    ) {
                        addPromotions(
                            moves,
                            i,
                            index(
                                rr,
                                c
                            )
                        );
                    } else {
                        addMove(
                            moves,
                            i,
                            index(
                                rr,
                                c
                            )
                        );

                        if (
                            r === startRow &&
                            b[
                            index(
                                r +
                                direction * 2,
                                c
                            )
                            ] === "."
                        ) {
                            addMove(
                                moves,
                                i,
                                index(
                                    r +
                                    direction * 2,
                                    c
                                )
                            );
                        }
                    }
                }

                var dc;

                for (
                    dc = -1;
                    dc <= 1;
                    dc += 2
                ) {
                    rr =
                        r + direction;

                    cc =
                        c + dc;

                    if (
                        !inside(
                            rr,
                            cc
                        )
                    ) {
                        continue;
                    }

                    target =
                        b[
                        index(
                            rr,
                            cc
                        )
                        ];

                    if (
                        target !== "." &&
                        colorOf(
                            target
                        ) ===
                        opposite(color)
                    ) {
                        if (
                            rr === promotionRow
                        ) {
                            addPromotions(
                                moves,
                                i,
                                index(
                                    rr,
                                    cc
                                )
                            );
                        } else {
                            addMove(
                                moves,
                                i,
                                index(
                                    rr,
                                    cc
                                )
                            );
                        }
                    }

                    if (
                        index(
                            rr,
                            cc
                        ) === s.ep
                    ) {
                        addMove(
                            moves,
                            i,
                            index(
                                rr,
                                cc
                            ),
                            {
                                enPassant:
                                    true
                            }
                        );
                    }
                }
            }

            if (type === "n") {
                var knightDirections = [
                    [-2, -1],
                    [-2, 1],
                    [-1, -2],
                    [-1, 2],
                    [1, -2],
                    [1, 2],
                    [2, -1],
                    [2, 1]
                ];

                var ni;

                for (
                    ni = 0;
                    ni < knightDirections.length;
                    ni++
                ) {
                    rr =
                        r +
                        knightDirections[ni][0];

                    cc =
                        c +
                        knightDirections[ni][1];

                    if (
                        !inside(rr, cc)
                    ) {
                        continue;
                    }

                    target =
                        b[
                        index(
                            rr,
                            cc
                        )
                        ];

                    if (
                        target === "." ||
                        colorOf(target) !== color
                    ) {
                        addMove(
                            moves,
                            i,
                            index(
                                rr,
                                cc
                            )
                        );
                    }
                }
            }

            if (
                type === "b" ||
                type === "r" ||
                type === "q"
            ) {
                var directions = [];
                var di;

                if (
                    type === "b" ||
                    type === "q"
                ) {
                    directions =
                        directions.concat([
                            [-1, -1],
                            [-1, 1],
                            [1, -1],
                            [1, 1]
                        ]);
                }

                if (
                    type === "r" ||
                    type === "q"
                ) {
                    directions =
                        directions.concat([
                            [-1, 0],
                            [1, 0],
                            [0, -1],
                            [0, 1]
                        ]);
                }

                for (
                    di = 0;
                    di < directions.length;
                    di++
                ) {
                    rr =
                        r +
                        directions[di][0];

                    cc =
                        c +
                        directions[di][1];

                    while (
                        inside(rr, cc)
                    ) {
                        target =
                            b[
                            index(
                                rr,
                                cc
                            )
                            ];

                        if (
                            target === "."
                        ) {
                            addMove(
                                moves,
                                i,
                                index(
                                    rr,
                                    cc
                                )
                            );
                        } else {
                            if (
                                colorOf(target) !==
                                color
                            ) {
                                addMove(
                                    moves,
                                    i,
                                    index(
                                        rr,
                                        cc
                                    )
                                );
                            }

                            break;
                        }

                        rr +=
                            directions[di][0];

                        cc +=
                            directions[di][1];
                    }
                }
            }

            if (type === "k") {
                for (
                    rr = r - 1;
                    rr <= r + 1;
                    rr++
                ) {
                    for (
                        cc = c - 1;
                        cc <= c + 1;
                        cc++
                    ) {
                        if (
                            !inside(rr, cc) ||
                            (
                                rr === r &&
                                cc === c
                            )
                        ) {
                            continue;
                        }

                        target =
                            b[
                            index(
                                rr,
                                cc
                            )
                            ];

                        if (
                            target === "." ||
                            colorOf(target) !== color
                        ) {
                            addMove(
                                moves,
                                i,
                                index(
                                    rr,
                                    cc
                                )
                            );
                        }
                    }
                }

                if (
                    color === "w" &&
                    i === 60 &&
                    !inCheck(s, "w")
                ) {
                    if (
                        s.castling.K &&
                        b[61] === "." &&
                        b[62] === "." &&
                        b[63] === "R" &&
                        !squareAttacked(
                            s,
                            61,
                            "b"
                        ) &&
                        !squareAttacked(
                            s,
                            62,
                            "b"
                        )
                    ) {
                        addMove(
                            moves,
                            60,
                            62,
                            {
                                castle: "K"
                            }
                        );
                    }

                    if (
                        s.castling.Q &&
                        b[59] === "." &&
                        b[58] === "." &&
                        b[57] === "." &&
                        b[56] === "R" &&
                        !squareAttacked(
                            s,
                            59,
                            "b"
                        ) &&
                        !squareAttacked(
                            s,
                            58,
                            "b"
                        )
                    ) {
                        addMove(
                            moves,
                            60,
                            58,
                            {
                                castle: "Q"
                            }
                        );
                    }
                }

                if (
                    color === "b" &&
                    i === 4 &&
                    !inCheck(s, "b")
                ) {
                    if (
                        s.castling.k &&
                        b[5] === "." &&
                        b[6] === "." &&
                        b[7] === "r" &&
                        !squareAttacked(
                            s,
                            5,
                            "w"
                        ) &&
                        !squareAttacked(
                            s,
                            6,
                            "w"
                        )
                    ) {
                        addMove(
                            moves,
                            4,
                            6,
                            {
                                castle: "k"
                            }
                        );
                    }

                    if (
                        s.castling.q &&
                        b[3] === "." &&
                        b[2] === "." &&
                        b[1] === "." &&
                        b[0] === "r" &&
                        !squareAttacked(
                            s,
                            3,
                            "w"
                        ) &&
                        !squareAttacked(
                            s,
                            2,
                            "w"
                        )
                    ) {
                        addMove(
                            moves,
                            4,
                            2,
                            {
                                castle: "q"
                            }
                        );
                    }
                }
            }
        }

        return moves;
    }

    function applyMove(
        s,
        move
    ) {
        var next =
            cloneState(s);

        var piece =
            next.board[
            move.from
            ];

        var captured =
            next.board[
            move.to
            ];

        var color =
            colorOf(piece);

        next.board[
            move.from
        ] = ".";

        if (
            move.enPassant
        ) {
            var capturedPawnSquare =
                color === "w"
                    ? move.to + 8
                    : move.to - 8;

            captured =
                next.board[
                capturedPawnSquare
                ];

            next.board[
                capturedPawnSquare
            ] = ".";
        }

        next.board[
            move.to
        ] = piece;

        if (
            move.promotion
        ) {
            next.board[
                move.to
            ] =
                color === "w"
                    ? move.promotion.toUpperCase()
                    : move.promotion;
        }

        if (
            move.castle === "K"
        ) {
            next.board[63] = ".";
            next.board[61] = "R";
        }

        if (
            move.castle === "Q"
        ) {
            next.board[56] = ".";
            next.board[59] = "R";
        }

        if (
            move.castle === "k"
        ) {
            next.board[7] = ".";
            next.board[5] = "r";
        }

        if (
            move.castle === "q"
        ) {
            next.board[0] = ".";
            next.board[3] = "r";
        }

        if (piece === "K") {
            next.castling.K = false;
            next.castling.Q = false;
        }

        if (piece === "k") {
            next.castling.k = false;
            next.castling.q = false;
        }

        if (
            move.from === 63 ||
            move.to === 63
        ) {
            next.castling.K = false;
        }

        if (
            move.from === 56 ||
            move.to === 56
        ) {
            next.castling.Q = false;
        }

        if (
            move.from === 7 ||
            move.to === 7
        ) {
            next.castling.k = false;
        }

        if (
            move.from === 0 ||
            move.to === 0
        ) {
            next.castling.q = false;
        }

        next.ep = -1;

        if (
            typeOf(piece) === "p" &&
            Math.abs(
                move.to - move.from
            ) === 16
        ) {
            next.ep =
                (
                    move.to +
                    move.from
                ) / 2;
        }

        next.halfmove =
            typeOf(piece) === "p" ||
                captured !== "."
                ? 0
                : next.halfmove + 1;

        if (
            color === "b"
        ) {
            next.fullmove++;
        }

        next.last = {
            from: move.from,
            to: move.to
        };

        next.turn =
            opposite(color);

        return next;
    }

    function legalMoves(
        s,
        color
    ) {
        var pseudo =
            generatePseudoMoves(
                s,
                color
            );

        var result = [];
        var i;
        var next;

        for (
            i = 0;
            i < pseudo.length;
            i++
        ) {
            next =
                applyMove(
                    s,
                    pseudo[i]
                );

            if (
                !inCheck(
                    next,
                    color
                )
            ) {
                result.push(
                    pseudo[i]
                );
            }
        }

        return result;
    }

    function positionKey(s) {
        var castling =
            (
                s.castling.K
                    ? "K"
                    : ""
            ) +
            (
                s.castling.Q
                    ? "Q"
                    : ""
            ) +
            (
                s.castling.k
                    ? "k"
                    : ""
            ) +
            (
                s.castling.q
                    ? "q"
                    : ""
            );

        return (
            s.board.join("") +
            "|" +
            s.turn +
            "|" +
            castling +
            "|" +
            s.ep
        );
    }

    function recordPosition(s) {
        var key =
            positionKey(s);

        positionHistory[key] =
            positionHistory[key]
                ? positionHistory[key] + 1
                : 1;
    }

    function rebuildPositionHistory() {
        positionHistory = {};

        var i;

        for (
            i = 0;
            i < history.length;
            i++
        ) {
            recordPosition(
                history[i]
            );
        }

        recordPosition(
            state
        );
    }

    function insufficientMaterial(s) {
        var pieces = [];
        var bishops = [];
        var i;
        var piece;

        for (
            i = 0;
            i < 64;
            i++
        ) {
            piece =
                s.board[i];

            if (
                piece === "." ||
                typeOf(piece) === "k"
            ) {
                continue;
            }

            if (
                typeOf(piece) === "p" ||
                typeOf(piece) === "q" ||
                typeOf(piece) === "r"
            ) {
                return false;
            }

            pieces.push(
                piece
            );

            if (
                typeOf(piece) === "b"
            ) {
                bishops.push(
                    i
                );
            }
        }

        if (
            pieces.length === 0
        ) {
            return true;
        }

        if (
            pieces.length === 1 &&
            (
                typeOf(
                    pieces[0]
                ) === "n" ||
                typeOf(
                    pieces[0]
                ) === "b"
            )
        ) {
            return true;
        }

        if (
            pieces.length === 2 &&
            typeOf(
                pieces[0]
            ) === "b" &&
            typeOf(
                pieces[1]
            ) === "b"
        ) {
            return (
                (
                    row(
                        bishops[0]
                    ) +
                    col(
                        bishops[0]
                    )
                ) % 2
            ) === (
                    (
                        row(
                            bishops[1]
                        ) +
                        col(
                            bishops[1]
                        )
                    ) % 2
                );
        }

        return false;
    }

    function gameStatus(
        s,
        searchMode
    ) {
        var legal =
            legalMoves(
                s,
                s.turn
            );

        if (
            !legal.length
        ) {
            if (
                inCheck(
                    s,
                    s.turn
                )
            ) {
                return {
                    over: true,
                    result:
                        s.turn === "w"
                            ? "0-1"
                            : "1-0",
                    text:
                        s.turn === "w"
                            ? "Мат — победили чёрные"
                            : "Мат — победили белые"
                };
            }

            return {
                over: true,
                result: "1/2-1/2",
                text: "Пат — ничья"
            };
        }

        if (
            !searchMode &&
            insufficientMaterial(s)
        ) {
            return {
                over: true,
                result: "1/2-1/2",
                text:
                    "Ничья — недостаточно материала"
            };
        }

        if (
            !searchMode &&
            s.halfmove >= 100
        ) {
            return {
                over: true,
                result: "1/2-1/2",
                text:
                    "Ничья по правилу 50 ходов"
            };
        }

        if (
            !searchMode
        ) {
            var key =
                positionKey(s);

            if (
                positionHistory[key] &&
                positionHistory[key] >= 3
            ) {
                return {
                    over: true,
                    result: "1/2-1/2",
                    text:
                        "Ничья — троекратное повторение"
                };
            }
        }

        return {
            over: false,
            result: null,
            text:
                s.turn === "w"
                    ? "Ход белых"
                    : "Ход чёрных"
        };
    }

    function evaluate(s) {
        var score = 0;
        var i;
        var piece;
        var color;
        var type;
        var tableIndex;

        for (
            i = 0;
            i < 64;
            i++
        ) {
            piece =
                s.board[i];

            if (
                piece === "."
            ) {
                continue;
            }

            color =
                colorOf(piece);

            type =
                typeOf(piece);

            tableIndex =
                color === "w"
                    ? i
                    : 63 - i;

            if (
                color === "w"
            ) {
                score +=
                    VALUE[type] +
                    (
                        PST[type]
                            ? PST[type][tableIndex]
                            : 0
                    );
            } else {
                score -=
                    VALUE[type] +
                    (
                        PST[type]
                            ? PST[type][tableIndex]
                            : 0
                    );
            }
        }

        return score;
    }

    function moveOrderingScore(
        s,
        move
    ) {
        var moving =
            s.board[
            move.from
            ];

        var captured =
            s.board[
            move.to
            ];

        var score = 0;

        if (
            move.enPassant
        ) {
            captured =
                s.turn === "w"
                    ? "p"
                    : "P";
        }

        if (
            captured !== "."
        ) {
            score +=
                VALUE[
                typeOf(
                    captured
                )
                ] *
                10 -
                VALUE[
                typeOf(
                    moving
                )
                ];
        }

        if (
            move.promotion
        ) {
            score +=
                VALUE[
                move.promotion
                ] +
                800;
        }

        if (
            move.castle
        ) {
            score += 50;
        }

        return score;
    }

    function orderMoves(
        s,
        moves
    ) {
        var ordered =
            moves.slice();

        ordered.sort(
            function (a, b) {
                return (
                    moveOrderingScore(
                        s,
                        b
                    ) -
                    moveOrderingScore(
                        s,
                        a
                    )
                );
            }
        );

        return ordered;
    }

    function search(
        s,
        depth,
        alpha,
        beta
    ) {
        if (
            Date.now() >=
            searchDeadline
        ) {
            throw "timeout";
        }

        var moves =
            legalMoves(
                s,
                s.turn
            );

        if (
            !moves.length
        ) {
            if (
                inCheck(
                    s,
                    s.turn
                )
            ) {
                return s.turn === "w"
                    ? -1000000 - depth
                    : 1000000 + depth;
            }

            return 0;
        }

        if (
            depth <= 0
        ) {
            return evaluate(s);
        }

        moves =
            orderMoves(
                s,
                moves
            );

        var maximizing =
            s.turn === "w";

        var i;
        var child;
        var score;

        var best =
            maximizing
                ? -Infinity
                : Infinity;

        for (
            i = 0;
            i < moves.length;
            i++
        ) {
            child =
                applyMove(
                    s,
                    moves[i]
                );

            score =
                search(
                    child,
                    depth - 1,
                    alpha,
                    beta
                );

            if (
                maximizing
            ) {
                if (
                    score > best
                ) {
                    best = score;
                }

                if (
                    best > alpha
                ) {
                    alpha = best;
                }
            } else {
                if (
                    score < best
                ) {
                    best = score;
                }

                if (
                    best < beta
                ) {
                    beta = best;
                }
            }

            if (
                beta <= alpha
            ) {
                break;
            }
        }

        return best;
    }

    function aiConfig(level) {
        var oldDevice = false;

        try {
            oldDevice =
                (
                    navigator.hardwareConcurrency &&
                    navigator.hardwareConcurrency <= 2
                ) ||
                /iPhone|iPad|iPod|Android/i.test(
                    navigator.userAgent || ""
                );
        } catch (e) { }

        if (
            level === 1
        ) {
            return {
                maxDepth: 1,
                time: 55
            };
        }

        if (
            level === 2
        ) {
            return {
                maxDepth: 2,
                time:
                    oldDevice
                        ? 120
                        : 160
            };
        }

        if (
            level === 3
        ) {
            return {
                maxDepth: 3,
                time:
                    oldDevice
                        ? 300
                        : 420
            };
        }

        if (
            level === 4
        ) {
            return {
                maxDepth: 4,
                time:
                    oldDevice
                        ? 700
                        : 900
            };
        }

        return {
            maxDepth: 5,
            time:
                oldDevice
                    ? 1050
                    : 1350
        };
    }

    function chooseAIMove(
        s,
        level
    ) {
        var legal =
            legalMoves(
                s,
                s.turn
            );

        if (
            !legal.length
        ) {
            return null;
        }

        var config =
            aiConfig(level);

        var ordered =
            orderMoves(
                s,
                legal
            );

        var bestMove =
            ordered[0];

        searchDeadline =
            Date.now() +
            config.time;

        var depth = 1;

        while (
            depth <=
            config.maxDepth
        ) {
            try {
                var currentBest =
                    bestMove;

                var currentScore =
                    s.turn === "w"
                        ? -Infinity
                        : Infinity;

                var i;
                var child;
                var score;

                for (
                    i = 0;
                    i < ordered.length;
                    i++
                ) {
                    child =
                        applyMove(
                            s,
                            ordered[i]
                        );

                    score =
                        search(
                            child,
                            depth - 1,
                            -Infinity,
                            Infinity
                        );

                    if (
                        s.turn === "w"
                    ) {
                        if (
                            score >
                            currentScore
                        ) {
                            currentScore =
                                score;

                            currentBest =
                                ordered[i];
                        }
                    } else if (
                        score <
                        currentScore
                    ) {
                        currentScore =
                            score;

                        currentBest =
                            ordered[i];
                    }
                }

                bestMove =
                    currentBest;

                depth++;
            } catch (e) {
                break;
            }
        }

        return bestMove;
    }

    function buildBoard() {
        var r;
        var c;
        var sq;
        var cell;
        var pieceNode;
        var rankNode;
        var fileNode;

        board.innerHTML = "";

        cells = [];
        pieceNodes = [];
        rankNodes = [];
        fileNodes = [];
        targetFlags = [];

        for (
            sq = 0;
            sq < 64;
            sq++
        ) {
            targetFlags[sq] =
                false;
        }

        for (
            r = 0;
            r < 8;
            r++
        ) {
            for (
                c = 0;
                c < 8;
                c++
            ) {
                sq =
                    index(
                        r,
                        c
                    );

                cell =
                    document.createElement(
                        "div"
                    );

                cell.className =
                    "square " +
                    (
                        (
                            r + c
                        ) % 2 === 0
                            ? "light"
                            : "dark"
                    );

                cell.setAttribute(
                    "data-square",
                    sq
                );

                if (
                    !modernLayout
                ) {
                    cell.style.left =
                        (c * 12.5) +
                        "%";

                    cell.style.top =
                        (r * 12.5) +
                        "%";

                    cell.style.width =
                        "12.5%";

                    cell.style.height =
                        "12.5%";
                }

                pieceNode =
                    document.createElement(
                        "span"
                    );

                pieceNode.className =
                    "piece";

                pieceNode.style.display =
                    "none";

                cell.appendChild(
                    pieceNode
                );

                rankNode =
                    document.createElement(
                        "span"
                    );

                rankNode.className =
                    "coord rank";

                rankNode.textContent =
                    8 - r;

                rankNode.style.display =
                    c === 7
                        ? "block"
                        : "none";

                cell.appendChild(
                    rankNode
                );

                fileNode =
                    document.createElement(
                        "span"
                    );

                fileNode.className =
                    "coord file";

                fileNode.textContent =
                    String.fromCharCode(
                        97 + c
                    );

                fileNode.style.display =
                    r === 7
                        ? "block"
                        : "none";

                cell.appendChild(
                    fileNode
                );

                board.appendChild(
                    cell
                );

                cells[sq] =
                    cell;

                pieceNodes[sq] =
                    pieceNode;

                rankNodes[sq] =
                    rankNode;

                fileNodes[sq] =
                    fileNode;
            }
        }

        resizeBoard();
    }

    function setLegalTargets(
        moves,
        from
    ) {
        var i;

        legalTargets = [];

        for (
            i = 0;
            i < 64;
            i++
        ) {
            targetFlags[i] =
                false;
        }

        for (
            i = 0;
            i < moves.length;
            i++
        ) {
            if (
                moves[i].from === from &&
                !targetFlags[
                moves[i].to
                ]
            ) {
                targetFlags[
                    moves[i].to
                ] = true;

                legalTargets.push(
                    moves[i].to
                );
            }
        }
    }

    function updateSceneClass() {
        var classes =
            "board-scene " +
            (
                boardBlack
                    ? "orientation-black"
                    : "orientation-white"
            );

        if (
            gameMode === "two"
        ) {
            classes +=
                " two-mode";
        }

        boardScene.className =
            classes;
    }

    function resetOrientationInstant(
        black
    ) {
        if (
            orientationTimer
        ) {
            clearTimeout(
                orientationTimer
            );

            orientationTimer = 0;
        }

        boardBlack =
            !!black;

        updateSceneClass();
    }

    function animateOrientation(
        black
    ) {
        black =
            !!black;

        if (
            boardBlack === black
        ) {
            return;
        }

        if (
            !animationEnabled
        ) {
            resetOrientationInstant(
                black
            );

            return;
        }

        var forward =
            !boardBlack &&
            black;

        boardBlack =
            black;

        var base =
            "board-scene two-mode ";

        boardScene.className =
            base +
            (
                forward
                    ? "orientation-forward"
                    : "orientation-backward"
            );

        boardScene.offsetWidth;

        if (
            orientationTimer
        ) {
            clearTimeout(
                orientationTimer
            );
        }

        orientationTimer =
            setTimeout(
                function () {
                    updateSceneClass();
                    orientationTimer = 0;
                },
                475
            );
    }

    function updateStatus(
        result,
        animate
    ) {
        var text =
            result.text;

        if (
            !result.over &&
            inCheck(
                state,
                state.turn
            )
        ) {
            text +=
                " — шах";
        }

        if (
            aiThinking
        ) {
            text =
                "ИИ думает...";
        }

        statusText.textContent =
            text;

        status.className =
            animate &&
                animationEnabled
                ? "status pop"
                : "status";

        lastRenderedResult =
            result;
    }

    function render(
        animateMove
    ) {
        var result =
            gameStatus(
                state,
                false
            );

        var kingSquare =
            result.over
                ? -1
                : findKing(
                    state,
                    state.turn
                );

        var i;
        var piece;
        var pColor;
        var pType;
        var pieceNode;
        var isTarget;
        var cellClass;

        var showCursor =
            usePCStyle() &&
            cursor >= 0;

        for (
            i = 0;
            i < 64;
            i++
        ) {
            piece =
                state.board[i];

            cellClass =
                "square " +
                (
                    (
                        Math.floor(
                            i / 8
                        ) +
                        (
                            i % 8
                        )
                    ) % 2 === 0
                        ? "light"
                        : "dark"
                );

            if (
                selected === i
            ) {
                cellClass +=
                    " selected";
            }

            if (
                showCursor &&
                cursor === i
            ) {
                cellClass +=
                    " cursor";
            }

            if (
                state.last &&
                (
                    state.last.from === i ||
                    state.last.to === i
                )
            ) {
                cellClass +=
                    " last";
            }

            if (
                kingSquare === i &&
                inCheck(
                    state,
                    state.turn
                )
            ) {
                cellClass +=
                    " check";
            }

            isTarget =
                targetFlags[i];

            if (
                isTarget
            ) {
                cellClass +=
                    piece === "."
                        ? " move"
                        : " capture";
            }

            cells[i].className =
                cellClass;

            pieceNode =
                pieceNodes[i];

            if (
                piece === "."
            ) {
                pieceNode.style.display =
                    "none";

                pieceNode.textContent =
                    "";

                pieceNode.className =
                    "piece";
            } else {
                pColor =
                    colorOf(
                        piece
                    );

                pType =
                    typeOf(
                        piece
                    );

                pieceNode.style.display =
                    "block";

                pieceNode.textContent =
                    PIECES[
                    pColor
                    ][
                    pType
                    ];

                pieceNode.className =
                    "piece " +
                    (
                        pColor === "w"
                            ? "white-piece"
                            : "black-piece"
                    );

                if (
                    animateMove &&
                    animationEnabled &&
                    state.last &&
                    state.last.to === i
                ) {
                    pieceNode.className +=
                        " enter";
                }
            }
        }

        if (
            !orientationTimer
        ) {
            updateSceneClass();
        }

        updateStatus(
            result,
            animateMove
        );

        return result;
    }

    function clearSelection() {
        selected = -1;
        legalTargets = [];

        for (
            var i = 0;
            i < 64;
            i++
        ) {
            targetFlags[i] =
                false;
        }

        pendingPromotion =
            null;
    }

    function resetGame() {
        if (
            aiTimer
        ) {
            clearTimeout(
                aiTimer
            );

            aiTimer = 0;
        }

        state =
            createInitialState();

        history = [];

        positionHistory = {};

        clearSelection();

        aiThinking = false;

        cursor =
            usePCStyle()
                ? 60
                : -1;

        resetOrientationInstant(
            false
        );

        recordPosition(
            state
        );

        closePromotion();

        updateAnimationUI();

        render(false);

        if (
            gameMode === "ai" &&
            state.turn === "b"
        ) {
            startAITurn();
        }
    }

    function undoMove() {
        if (
            aiThinking ||
            history.length === 0
        ) {
            return;
        }

        if (
            gameMode === "ai" &&
            history.length >= 2
        ) {
            state =
                history[
                history.length - 2
                ];

            history =
                history.slice(
                    0,
                    -2
                );
        } else {
            state =
                history.pop();
        }

        clearSelection();

        cursor =
            usePCStyle()
                ? (
                    state.turn === "w"
                        ? 60
                        : 4
                )
                : -1;

        rebuildPositionHistory();

        resetOrientationInstant(
            gameMode === "two" &&
            shouldAutoFlip() &&
            state.turn === "b"
        );

        render(false);
    }

    function executeMove(
        move
    ) {
        history.push(
            cloneState(
                state
            )
        );

        state =
            applyMove(
                state,
                move
            );

        recordPosition(
            state
        );

        clearSelection();

        cursor =
            move.to;

        closePromotion();

        if (
            shouldAutoFlip()
        ) {
            animateOrientation(
                state.turn === "b"
            );
        } else if (
            gameMode === "two"
        ) {
            resetOrientationInstant(
                false
            );
        }

        var result =
            render(true);

        if (
            !result.over &&
            gameMode === "ai" &&
            state.turn === "b"
        ) {
            startAITurn();
        }
    }

    function startAITurn() {
        if (
            aiThinking
        ) {
            return;
        }

        aiThinking = true;

        render(false);

        var level =
            parseInt(
                difficultySelect.value,
                10
            );

        aiTimer =
            setTimeout(
                function () {
                    aiTimer = 0;

                    var move =
                        chooseAIMove(
                            state,
                            level
                        );

                    aiThinking = false;

                    if (
                        move
                    ) {
                        executeMove(
                            move
                        );
                    } else {
                        render(false);
                    }
                },
                level >= 4
                    ? 45
                    : 20
            );
    }

    function chooseSquare(
        square
    ) {
        if (
            aiThinking ||
            gameStatus(
                state,
                false
            ).over
        ) {
            return;
        }

        if (
            gameMode === "ai" &&
            state.turn === "b"
        ) {
            return;
        }

        if (
            square < 0 ||
            square > 63
        ) {
            return;
        }

        var piece =
            state.board[square];

        var moves;
        var candidates = [];
        var i;

        if (
            selected === -1
        ) {
            if (
                piece !== "." &&
                colorOf(
                    piece
                ) === state.turn
            ) {
                selected =
                    square;

                cursor =
                    square;

                moves =
                    legalMoves(
                        state,
                        state.turn
                    );

                setLegalTargets(
                    moves,
                    square
                );
            }

            render(false);

            return;
        }

        if (
            square === selected
        ) {
            clearSelection();

            cursor =
                square;

            render(false);

            return;
        }

        moves =
            legalMoves(
                state,
                state.turn
            );

        for (
            i = 0;
            i < moves.length;
            i++
        ) {
            if (
                moves[i].from === selected &&
                moves[i].to === square
            ) {
                candidates.push(
                    moves[i]
                );
            }
        }

        if (
            !candidates.length
        ) {
            if (
                piece !== "." &&
                colorOf(
                    piece
                ) === state.turn
            ) {
                selected =
                    square;

                cursor =
                    square;

                setLegalTargets(
                    moves,
                    square
                );
            } else {
                clearSelection();
            }

            render(false);

            return;
        }

        if (
            candidates.length > 1
        ) {
            pendingPromotion = {
                moves: candidates
            };

            openPromotion();

            return;
        }

        executeMove(
            candidates[0]
        );
    }

    function setMode(
        mode
    ) {
        gameMode =
            mode;

        modalAiMode.className =
            mode === "ai"
                ? "mode-button active"
                : "mode-button";

        modalTwoMode.className =
            mode === "two"
                ? "mode-button active"
                : "mode-button";

        difficultySection.style.display =
            mode === "ai"
                ? "block"
                : "none";

        resetGame();
    }

    function openSettings() {
        updateAnimationUI();

        settingsOverlay.className =
            "overlay";
    }

    function closeSettings() {
        settingsOverlay.className =
            "overlay hidden";
    }

    function openPromotion() {
        promotionOverlay.className =
            "overlay";
    }

    function closePromotion() {
        promotionOverlay.className =
            "overlay hidden";

        pendingPromotion =
            null;
    }

    function findBoardTarget(
        target
    ) {
        while (
            target &&
            target !== board &&
            !target.getAttribute(
                "data-square"
            )
        ) {
            target =
                target.parentNode;
        }

        return target &&
            target !== board
            ? target
            : null;
    }

    function handleBoardInteraction(
        event
    ) {
        var target =
            findBoardTarget(
                event.target
            );

        if (
            !target
        ) {
            return;
        }

        chooseSquare(
            parseInt(
                target.getAttribute(
                    "data-square"
                ),
                10
            )
        );
    }

    if (
        pointerEvents &&
        board.addEventListener
    ) {
        board.addEventListener(
            "pointerdown",
            handleBoardInteraction,
            false
        );
    } else {
        board.onclick =
            handleBoardInteraction;
    }

    newGameButton.onclick =
        function () {
            resetGame();
        };

    undoButton.onclick =
        function () {
            undoMove();
        };

    settingsButton.onclick =
        function () {
            openSettings();
        };

    closeSettingsButton.onclick =
        function () {
            closeSettings();
        };

    settingsOverlay.onclick =
        function (event) {
            if (
                event.target ===
                settingsOverlay
            ) {
                closeSettings();
            }
        };

    modalAiMode.onclick =
        function () {
            setMode("ai");
        };

    modalTwoMode.onclick =
        function () {
            setMode("two");
        };

    animationToggle.onclick =
        function () {
            animationEnabled =
                !animationEnabled;

            saveAnimationSetting();

            updateAnimationUI();

            resetOrientationInstant(
                boardBlack
            );

            render(false);
        };

    promotionOverlay.onclick =
        function (event) {
            if (
                event.target ===
                promotionOverlay
            ) {
                clearSelection();
                closePromotion();
                render(false);
            }
        };

    var promotionButtons =
        promotionOverlay.getElementsByTagName(
            "button"
        );

    var promotionIndex;

    for (
        promotionIndex = 0;
        promotionIndex <
        promotionButtons.length;
        promotionIndex++
    ) {
        promotionButtons[
            promotionIndex
        ].onclick =
            function () {
                if (
                    !pendingPromotion
                ) {
                    return;
                }

                var wanted =
                    this.getAttribute(
                        "data-promotion"
                    );

                var chosen =
                    null;

                var i;

                for (
                    i = 0;
                    i <
                    pendingPromotion.moves.length;
                    i++
                ) {
                    if (
                        pendingPromotion.moves[i].promotion ===
                        wanted
                    ) {
                        chosen =
                            pendingPromotion.moves[i];

                        break;
                    }
                }

                if (
                    chosen
                ) {
                    executeMove(
                        chosen
                    );
                }
            };
    }

    function moveCursor(
        dr,
        dc
    ) {
        if (
            !usePCStyle()
        ) {
            return;
        }

        if (
            cursor < 0
        ) {
            cursor =
                state.turn === "w"
                    ? 60
                    : 4;
        }

        if (
            boardBlack
        ) {
            dr = -dr;
            dc = -dc;
        }

        var r =
            row(cursor) +
            dr;

        var c =
            col(cursor) +
            dc;

        if (
            !inside(
                r,
                c
            )
        ) {
            return;
        }

        cursor =
            index(
                r,
                c
            );

        render(false);
    }

    document.onkeydown =
        function (event) {
            var key =
                event.keyCode ||
                event.which;

            if (
                key === 27
            ) {
                closeSettings();
                clearSelection();
                closePromotion();
                render(false);
                return;
            }

            if (
                key === 78
            ) {
                resetGame();
                return;
            }

            if (
                key === 37 ||
                key === 38 ||
                key === 39 ||
                key === 40
            ) {
                if (
                    !usePCStyle()
                ) {
                    return;
                }

                if (
                    key === 37
                ) {
                    moveCursor(
                        0,
                        -1
                    );
                }

                if (
                    key === 38
                ) {
                    moveCursor(
                        -1,
                        0
                    );
                }

                if (
                    key === 39
                ) {
                    moveCursor(
                        0,
                        1
                    );
                }

                if (
                    key === 40
                ) {
                    moveCursor(
                        1,
                        0
                    );
                }

                if (
                    event.preventDefault
                ) {
                    event.preventDefault();
                }

                return;
            }

            if (
                key === 13 ||
                key === 32
            ) {
                if (
                    !usePCStyle()
                ) {
                    return;
                }

                if (
                    cursor < 0
                ) {
                    cursor =
                        state.turn === "w"
                            ? 60
                            : 4;
                }

                chooseSquare(
                    cursor
                );

                if (
                    event.preventDefault
                ) {
                    event.preventDefault();
                }
            }
        };

    function handleResize() {
        scheduleResize();
    }

    window.onresize =
        handleResize;

    window.onorientationchange =
        handleResize;

    buildBoard();
    updateAnimationUI();
    resetOrientationInstant(false);
    recordPosition(state);
    render(false);
    resizeBoard();
}());
