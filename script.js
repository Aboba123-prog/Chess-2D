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

    var selected = -1;
    var legalTargets = [];
    var pendingPromotion = null;

    var boardBlack = false;
    var gameMode = "ai";

    var aiThinking = false;
    var aiTimer = 0;
    var searchDeadline = 0;

    var orientationTimer = 0;
    var animationEnabled = true;

    try {
        if (
            window.localStorage &&
            localStorage.getItem("2dchess.animations") === "0"
        ) {
            animationEnabled = false;
        }
    } catch (e) {
    }

    try {
        if (
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            animationEnabled = false;
        }
    } catch (e2) {
    }

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
            last: s.last ? {
                from: s.last.from,
                to: s.last.to
            } : null
        };
    }

    function row(index) {
        return Math.floor(index / 8);
    }

    function col(index) {
        return index % 8;
    }

    function index(r, c) {
        return r * 8 + c;
    }

    function inside(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
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
        return color === "w" ? "b" : "w";
    }

    function isTV() {
        var ua = navigator.userAgent || "";

        return /web0s|webos|netcast|smarttv|hbbtv|viera|tizen.*tv|googletv|google tv/i.test(ua);
    }

    function isTouchDevice() {
        return (
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0
        );
    }

    function isDesktop() {
        return (
            !isTV() &&
            !isTouchDevice() &&
            window.innerWidth >= 900
        );
    }

    function shouldAutoFlip() {
        return (
            isDesktop() &&
            gameMode === "two"
        );
    }

    function updateAnimationUI() {
        if (animationEnabled) {
            app.className = "app";
            animationSwitch.className = "switch on";
            animationHint.innerHTML =
                "Анимации включены. Их можно отключить для минимальной нагрузки.";
        } else {
            app.className = "app no-animations";
            animationSwitch.className = "switch";
            animationHint.innerHTML =
                "Анимации выключены.";
        }
    }

    function saveAnimationSetting() {
        try {
            localStorage.setItem(
                "2dchess.animations",
                animationEnabled ? "1" : "0"
            );
        } catch (e) {
        }
    }

    function findKing(s, color) {
        var target =
            color === "w" ? "K" : "k";

        var i;

        for (i = 0; i < 64; i++) {
            if (s.board[i] === target) {
                return i;
            }
        }

        return -1;
    }

    function squareAttacked(s, square, byColor) {
        var r = row(square);
        var c = col(square);
        var rr;
        var cc;
        var i;
        var piece;

        var pawn =
            byColor === "w" ? "P" : "p";

        var pawnRow =
            byColor === "w" ? r + 1 : r - 1;

        if (
            inside(pawnRow, c - 1) &&
            s.board[index(pawnRow, c - 1)] === pawn
        ) {
            return true;
        }

        if (
            inside(pawnRow, c + 1) &&
            s.board[index(pawnRow, c + 1)] === pawn
        ) {
            return true;
        }

        var knight =
            byColor === "w" ? "N" : "n";

        var knightDirections = [
            [-2, -1], [-2, 1],
            [-1, -2], [-1, 2],
            [1, -2], [1, 2],
            [2, -1], [2, 1]
        ];

        for (
            i = 0;
            i < knightDirections.length;
            i++
        ) {
            rr = r + knightDirections[i][0];
            cc = c + knightDirections[i][1];

            if (
                inside(rr, cc) &&
                s.board[index(rr, cc)] === knight
            ) {
                return true;
            }
        }

        var bishop =
            byColor === "w" ? "B" : "b";

        var rook =
            byColor === "w" ? "R" : "r";

        var queen =
            byColor === "w" ? "Q" : "q";

        var king =
            byColor === "w" ? "K" : "k";

        var diagonal = [
            [-1, -1], [-1, 1],
            [1, -1], [1, 1]
        ];

        var straight = [
            [-1, 0], [1, 0],
            [0, -1], [0, 1]
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

            while (inside(rr, cc)) {
                piece =
                    s.board[index(rr, cc)];

                if (piece !== ".") {
                    if (
                        piece === bishop ||
                        piece === queen
                    ) {
                        return true;
                    }

                    break;
                }

                rr += diagonal[i][0];
                cc += diagonal[i][1];
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

            while (inside(rr, cc)) {
                piece =
                    s.board[index(rr, cc)];

                if (piece !== ".") {
                    if (
                        piece === rook ||
                        piece === queen
                    ) {
                        return true;
                    }

                    break;
                }

                rr += straight[i][0];
                cc += straight[i][1];
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
                    !(rr === r && cc === c) &&
                    s.board[index(rr, cc)] === king
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function inCheck(s, color) {
        var king =
            findKing(s, color);

        if (king < 0) {
            return true;
        }

        return squareAttacked(
            s,
            king,
            opposite(color)
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
                options && options.promotion
                    ? options.promotion
                    : null,
            castle:
                options && options.castle
                    ? options.castle
                    : null,
            enPassant:
                !!(
                    options &&
                    options.enPassant
                )
        });
    }

    function generatePseudoMoves(s, color) {
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

        for (i = 0; i < 64; i++) {
            piece = b[i];

            if (
                piece === "." ||
                colorOf(piece) !== color
            ) {
                continue;
            }

            type = typeOf(piece);
            r = row(i);
            c = col(i);

            if (type === "p") {
                var direction =
                    color === "w" ? -1 : 1;

                var startRow =
                    color === "w" ? 6 : 1;

                var promotionRow =
                    color === "w" ? 0 : 7;

                rr =
                    r + direction;

                if (
                    inside(rr, c) &&
                    b[index(rr, c)] === "."
                ) {
                    if (rr === promotionRow) {
                        addMove(
                            moves,
                            i,
                            index(rr, c),
                            { promotion: "q" }
                        );

                        addMove(
                            moves,
                            i,
                            index(rr, c),
                            { promotion: "r" }
                        );

                        addMove(
                            moves,
                            i,
                            index(rr, c),
                            { promotion: "b" }
                        );

                        addMove(
                            moves,
                            i,
                            index(rr, c),
                            { promotion: "n" }
                        );
                    } else {
                        addMove(
                            moves,
                            i,
                            index(rr, c)
                        );

                        if (
                            r === startRow &&
                            b[
                            index(
                                r + direction * 2,
                                c
                            )
                            ] === "."
                        ) {
                            addMove(
                                moves,
                                i,
                                index(
                                    r + direction * 2,
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

                    if (!inside(rr, cc)) {
                        continue;
                    }

                    target =
                        b[index(rr, cc)];

                    if (
                        target !== "." &&
                        colorOf(target) === opposite(color)
                    ) {
                        if (rr === promotionRow) {
                            addMove(
                                moves,
                                i,
                                index(rr, cc),
                                { promotion: "q" }
                            );

                            addMove(
                                moves,
                                i,
                                index(rr, cc),
                                { promotion: "r" }
                            );

                            addMove(
                                moves,
                                i,
                                index(rr, cc),
                                { promotion: "b" }
                            );

                            addMove(
                                moves,
                                i,
                                index(rr, cc),
                                { promotion: "n" }
                            );
                        } else {
                            addMove(
                                moves,
                                i,
                                index(rr, cc)
                            );
                        }
                    }

                    if (
                        index(rr, cc) === s.ep
                    ) {
                        addMove(
                            moves,
                            i,
                            index(rr, cc),
                            { enPassant: true }
                        );
                    }
                }
            }

            if (type === "n") {
                var knightDirections = [
                    [-2, -1], [-2, 1],
                    [-1, -2], [-1, 2],
                    [1, -2], [1, 2],
                    [2, -1], [2, 1]
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

                    if (!inside(rr, cc)) {
                        continue;
                    }

                    target =
                        b[index(rr, cc)];

                    if (
                        target === "." ||
                        colorOf(target) !== color
                    ) {
                        addMove(
                            moves,
                            i,
                            index(rr, cc)
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

                if (
                    type === "b" ||
                    type === "q"
                ) {
                    directions =
                        directions.concat([
                            [-1, -1], [-1, 1],
                            [1, -1], [1, 1]
                        ]);
                }

                if (
                    type === "r" ||
                    type === "q"
                ) {
                    directions =
                        directions.concat([
                            [-1, 0], [1, 0],
                            [0, -1], [0, 1]
                        ]);
                }

                var di;

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

                    while (inside(rr, cc)) {
                        target =
                            b[index(rr, cc)];

                        if (target === ".") {
                            addMove(
                                moves,
                                i,
                                index(rr, cc)
                            );
                        } else {
                            if (
                                colorOf(target) !== color
                            ) {
                                addMove(
                                    moves,
                                    i,
                                    index(rr, cc)
                                );
                            }

                            break;
                        }

                        rr += directions[di][0];
                        cc += directions[di][1];
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
                            b[index(rr, cc)];

                        if (
                            target === "." ||
                            colorOf(target) !== color
                        ) {
                            addMove(
                                moves,
                                i,
                                index(rr, cc)
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
                        !squareAttacked(s, 61, "b") &&
                        !squareAttacked(s, 62, "b")
                    ) {
                        addMove(
                            moves,
                            60,
                            62,
                            { castle: "K" }
                        );
                    }

                    if (
                        s.castling.Q &&
                        b[59] === "." &&
                        b[58] === "." &&
                        b[57] === "." &&
                        b[56] === "R" &&
                        !squareAttacked(s, 59, "b") &&
                        !squareAttacked(s, 58, "b")
                    ) {
                        addMove(
                            moves,
                            60,
                            58,
                            { castle: "Q" }
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
                        !squareAttacked(s, 5, "w") &&
                        !squareAttacked(s, 6, "w")
                    ) {
                        addMove(
                            moves,
                            4,
                            6,
                            { castle: "k" }
                        );
                    }

                    if (
                        s.castling.q &&
                        b[3] === "." &&
                        b[2] === "." &&
                        b[1] === "." &&
                        b[0] === "r" &&
                        !squareAttacked(s, 3, "w") &&
                        !squareAttacked(s, 2, "w")
                    ) {
                        addMove(
                            moves,
                            4,
                            2,
                            { castle: "q" }
                        );
                    }
                }
            }
        }

        return moves;
    }

    function applyMove(s, move) {
        var next =
            cloneState(s);

        var piece =
            next.board[move.from];

        var captured =
            next.board[move.to];

        var color =
            colorOf(piece);

        next.board[move.from] = ".";

        if (move.enPassant) {
            var capturedPawnSquare =
                color === "w"
                    ? move.to + 8
                    : move.to - 8;

            captured =
                next.board[capturedPawnSquare];

            next.board[capturedPawnSquare] = ".";
        }

        next.board[move.to] =
            piece;

        if (move.promotion) {
            next.board[move.to] =
                color === "w"
                    ? move.promotion.toUpperCase()
                    : move.promotion.toLowerCase();
        }

        if (move.castle === "K") {
            next.board[63] = ".";
            next.board[61] = "R";
        }

        if (move.castle === "Q") {
            next.board[56] = ".";
            next.board[59] = "R";
        }

        if (move.castle === "k") {
            next.board[7] = ".";
            next.board[5] = "r";
        }

        if (move.castle === "q") {
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

        if (move.from === 63 || move.to === 63) {
            next.castling.K = false;
        }

        if (move.from === 56 || move.to === 56) {
            next.castling.Q = false;
        }

        if (move.from === 7 || move.to === 7) {
            next.castling.k = false;
        }

        if (move.from === 0 || move.to === 0) {
            next.castling.q = false;
        }

        next.ep = -1;

        if (
            typeOf(piece) === "p" &&
            Math.abs(move.to - move.from) === 16
        ) {
            next.ep =
                (move.to + move.from) / 2;
        }

        if (
            typeOf(piece) === "p" ||
            captured !== "."
        ) {
            next.halfmove = 0;
        } else {
            next.halfmove++;
        }

        if (color === "b") {
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

    function legalMoves(s, color) {
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

            if (!inCheck(next, color)) {
                result.push(
                    pseudo[i]
                );
            }
        }

        return result;
    }

    function positionKey(s) {
        var castling =
            (s.castling.K ? "K" : "") +
            (s.castling.Q ? "Q" : "") +
            (s.castling.k ? "k" : "") +
            (s.castling.q ? "q" : "");

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

        if (positionHistory[key]) {
            positionHistory[key]++;
        } else {
            positionHistory[key] = 1;
        }
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

        recordPosition(state);
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

            pieces.push(piece);

            if (
                typeOf(piece) === "b"
            ) {
                bishops.push(i);
            }
        }

        if (pieces.length === 0) {
            return true;
        }

        if (
            pieces.length === 1 &&
            (
                typeOf(pieces[0]) === "n" ||
                typeOf(pieces[0]) === "b"
            )
        ) {
            return true;
        }

        if (
            pieces.length === 2 &&
            typeOf(pieces[0]) === "b" &&
            typeOf(pieces[1]) === "b"
        ) {
            return (
                (
                    row(bishops[0]) +
                    col(bishops[0])
                ) % 2
            ) === (
                    (
                        row(bishops[1]) +
                        col(bishops[1])
                    ) % 2
                );
        }

        return false;
    }

    function gameStatus(s, searchMode) {
        var legal =
            legalMoves(
                s,
                s.turn
            );

        if (!legal.length) {
            if (inCheck(s, s.turn)) {
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

        if (!searchMode) {
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

            if (piece === ".") {
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

            if (color === "w") {
                score +=
                    VALUE[type];

                if (PST[type]) {
                    score +=
                        PST[type][tableIndex];
                }
            } else {
                score -=
                    VALUE[type];

                if (PST[type]) {
                    score -=
                        PST[type][tableIndex];
                }
            }
        }

        return score;
    }

    function moveOrderingScore(s, move) {
        var moving =
            s.board[move.from];

        var captured =
            s.board[move.to];

        var score = 0;

        if (move.enPassant) {
            captured =
                s.turn === "w"
                    ? "p"
                    : "P";
        }

        if (captured !== ".") {
            score +=
                VALUE[typeOf(captured)] * 10;

            score -=
                VALUE[typeOf(moving)];
        }

        if (move.promotion) {
            score +=
                VALUE[move.promotion] + 800;
        }

        if (move.castle) {
            score += 50;
        }

        return score;
    }

    function orderMoves(s, moves) {
        var ordered =
            moves.slice();

        ordered.sort(
            function (a, b) {
                return (
                    moveOrderingScore(s, b) -
                    moveOrderingScore(s, a)
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

        var terminal =
            gameStatus(
                s,
                true
            );

        if (terminal.over) {
            if (terminal.result === "1-0") {
                return 1000000 + depth;
            }

            if (terminal.result === "0-1") {
                return -1000000 - depth;
            }

            return 0;
        }

        if (depth <= 0) {
            return evaluate(s);
        }

        var moves =
            orderMoves(
                s,
                legalMoves(
                    s,
                    s.turn
                )
            );

        var maximizing =
            s.turn === "w";

        var i;
        var child;
        var score;

        if (maximizing) {
            var best =
                -Infinity;

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

                if (score > best) {
                    best = score;
                }

                if (best > alpha) {
                    alpha = best;
                }

                if (beta <= alpha) {
                    break;
                }
            }

            return best;
        }

        var minimum =
            Infinity;

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

            if (score < minimum) {
                minimum = score;
            }

            if (minimum < beta) {
                beta = minimum;
            }

            if (beta <= alpha) {
                break;
            }
        }

        return minimum;
    }

    function aiConfig(level) {
        if (level === 1) {
            return {
                maxDepth: 1,
                time: 70
            };
        }

        if (level === 2) {
            return {
                maxDepth: 2,
                time: 180
            };
        }

        if (level === 3) {
            return {
                maxDepth: 3,
                time: 500
            };
        }

        if (level === 4) {
            return {
                maxDepth: 4,
                time: 1100
            };
        }

        return {
            maxDepth: 5,
            time: 1900
        };
    }

    function chooseAIMove(s, level) {
        var legal =
            legalMoves(
                s,
                s.turn
            );

        if (!legal.length) {
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
            depth <= config.maxDepth
        ) {
            try {
                var currentBest =
                    bestMove;

                var currentScore =
                    s.turn === "w"
                        ? -Infinity
                        : Infinity;

                var i;

                for (
                    i = 0;
                    i < ordered.length;
                    i++
                ) {
                    var child =
                        applyMove(
                            s,
                            ordered[i]
                        );

                    var score =
                        search(
                            child,
                            depth - 1,
                            -Infinity,
                            Infinity
                        );

                    if (s.turn === "w") {
                        if (score > currentScore) {
                            currentScore =
                                score;

                            currentBest =
                                ordered[i];
                        }
                    } else {
                        if (score < currentScore) {
                            currentScore =
                                score;

                            currentBest =
                                ordered[i];
                        }
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

    function getViewportWidth() {
        if (
            window.visualViewport &&
            window.visualViewport.width
        ) {
            return window.visualViewport.width;
        }

        return (
            window.innerWidth ||
            document.documentElement.clientWidth ||
            320
        );
    }

    function getViewportHeight() {
        if (
            window.visualViewport &&
            window.visualViewport.height
        ) {
            return window.visualViewport.height;
        }

        return (
            window.innerHeight ||
            document.documentElement.clientHeight ||
            480
        );
    }

    function getSafeHorizontal() {
        var width =
            getViewportWidth();

        if (width <= 360) {
            return 6;
        }

        if (width <= 600) {
            return 10;
        }

        if (width <= 900) {
            return 14;
        }

        return 20;
    }

    function getBoardSize() {
        var width =
            getViewportWidth();

        var height =
            getViewportHeight();

        var horizontalPadding =
            getSafeHorizontal();

        var availableWidth =
            width -
            horizontalPadding;

        if (availableWidth < 180) {
            availableWidth =
                width;
        }

        var landscape =
            width > height;

        if (!landscape) {
            return Math.floor(
                Math.min(
                    760,
                    availableWidth
                )
            );
        }

        var topbar =
            document.querySelector(
                ".topbar"
            );

        var topbarHeight =
            topbar
                ? topbar.offsetHeight
                : 40;

        var statusHeight =
            36;

        var actionsHeight =
            38;

        var verticalGaps =
            25;

        var availableHeight =
            height -
            topbarHeight -
            statusHeight -
            actionsHeight -
            verticalGaps;

        if (
            availableHeight <
            180
        ) {
            availableHeight =
                180;
        }

        return Math.floor(
            Math.min(
                760,
                availableWidth,
                availableHeight
            )
        );
    }

    function resizeBoard() {
        var size =
            getBoardSize();

        if (
            !size ||
            size < 1
        ) {
            return;
        }

        boardScene.style.width =
            size + "px";

        boardScene.style.height =
            size + "px";

        board.style.width =
            size + "px";

        board.style.height =
            size + "px";

        status.style.width =
            size + "px";

        gameActions.style.width =
            size + "px";

        var squareSize =
            size / 8;

        var fontSize =
            Math.floor(
                squareSize * .84
            );

        var squares =
            board.getElementsByClassName(
                "square"
            );

        var i;

        for (
            i = 0;
            i < squares.length;
            i++
        ) {
            squares[i].style.fontSize =
                fontSize + "px";
        }
    }

    function resetOrientationInstant(black) {
        if (orientationTimer) {
            clearTimeout(
                orientationTimer
            );

            orientationTimer = 0;
        }

        boardBlack =
            !!black;

        boardScene.className =
            boardBlack
                ? "board-scene orientation-black"
                : "board-scene";
    }

    function animateOrientation(black) {
        black = !!black;

        if (
            boardBlack === black
        ) {
            return;
        }

        if (!animationEnabled) {
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

        boardScene.className =
            forward
                ? "board-scene orientation-forward"
                : "board-scene orientation-backward";

        boardScene.offsetWidth;

        if (orientationTimer) {
            clearTimeout(
                orientationTimer
            );
        }

        orientationTimer =
            setTimeout(
                function () {
                    boardScene.className =
                        boardBlack
                            ? "board-scene orientation-black"
                            : "board-scene";

                    orientationTimer = 0;
                },
                740
            );
    }

    function updateStatus(animate) {
        var result =
            gameStatus(
                state,
                false
            );

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

        if (aiThinking) {
            text =
                "ИИ думает…";
        }

        statusText.innerHTML =
            text;

        status.className =
            animate &&
                animationEnabled
                ? "status pop"
                : "status";
    }

    function render(animateMove) {
        board.innerHTML = "";

        var r;
        var c;
        var square;
        var cell;
        var piece;
        var pieceElement;
        var rankElement;
        var fileElement;

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
                square =
                    index(r, c);

                cell =
                    document.createElement("div");

                cell.className =
                    "square " +
                    (
                        (r + c) % 2 === 0
                            ? "light"
                            : "dark"
                    );

                cell.setAttribute(
                    "data-square",
                    square
                );

                if (
                    selected === square
                ) {
                    cell.className +=
                        " selected";
                }

                if (
                    state.last &&
                    (
                        state.last.from === square ||
                        state.last.to === square
                    )
                ) {
                    cell.className +=
                        " last";
                }

                if (
                    inCheck(
                        state,
                        state.turn
                    ) &&
                    findKing(
                        state,
                        state.turn
                    ) === square
                ) {
                    cell.className +=
                        " check";
                }

                if (
                    legalTargets.indexOf(
                        square
                    ) !== -1
                ) {
                    cell.className +=
                        state.board[square] === "."
                            ? " move"
                            : " capture";
                }

                piece =
                    state.board[square];

                if (
                    piece !== "."
                ) {
                    pieceElement =
                        document.createElement("span");

                    pieceElement.className =
                        "piece " +
                        (
                            colorOf(piece) === "w"
                                ? "white-piece"
                                : "black-piece"
                        );

                    if (
                        animateMove &&
                        animationEnabled &&
                        state.last &&
                        state.last.to === square
                    ) {
                        pieceElement.className +=
                            " enter";
                    }

                    pieceElement.innerHTML =
                        PIECES[
                        colorOf(piece)
                        ][
                        typeOf(piece)
                        ];

                    cell.appendChild(
                        pieceElement
                    );
                }

                if (c === 7) {
                    rankElement =
                        document.createElement("span");

                    rankElement.className =
                        "coord rank";

                    rankElement.innerHTML =
                        8 - r;

                    cell.appendChild(
                        rankElement
                    );
                }

                if (r === 7) {
                    fileElement =
                        document.createElement("span");

                    fileElement.className =
                        "coord file";

                    fileElement.innerHTML =
                        String.fromCharCode(
                            97 + c
                        );

                    cell.appendChild(
                        fileElement
                    );
                }

                board.appendChild(
                    cell
                );
            }
        }

        resizeBoard();
        updateStatus(
            animateMove
        );
    }

    function clearSelection() {
        selected = -1;
        legalTargets = [];
        pendingPromotion = null;
    }

    function resetGame() {
        if (aiTimer) {
            clearTimeout(aiTimer);
            aiTimer = 0;
        }

        state =
            createInitialState();

        history = [];
        positionHistory = {};

        selected = -1;
        legalTargets = [];
        pendingPromotion = null;

        aiThinking = false;

        resetOrientationInstant(false);

        recordPosition(state);

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

        rebuildPositionHistory();

        resetOrientationInstant(false);

        render(false);
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

    function executeMove(move) {
        history.push(
            cloneState(state)
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
        closePromotion();

        if (
            shouldAutoFlip()
        ) {
            animateOrientation(
                state.turn === "b"
            );
        }

        render(true);

        var result =
            gameStatus(
                state,
                false
            );

        if (
            !result.over &&
            gameMode === "ai" &&
            state.turn === "b"
        ) {
            startAITurn();
        }
    }

    function startAITurn() {
        if (aiThinking) {
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

                    if (move) {
                        executeMove(
                            move
                        );
                    } else {
                        render(false);
                    }
                },
                level >= 4
                    ? 60
                    : 25
            );
    }

    function chooseSquare(square) {
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

        var piece =
            state.board[square];

        var moves;
        var candidates;
        var i;

        if (selected === -1) {
            if (
                piece !== "." &&
                colorOf(piece) === state.turn
            ) {
                selected = square;
                legalTargets = [];

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
                        moves[i].from === square &&
                        legalTargets.indexOf(
                            moves[i].to
                        ) === -1
                    ) {
                        legalTargets.push(
                            moves[i].to
                        );
                    }
                }

                render(false);
            }

            return;
        }

        if (square === selected) {
            clearSelection();
            render(false);
            return;
        }

        moves =
            legalMoves(
                state,
                state.turn
            );

        candidates = [];

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

        if (!candidates.length) {
            if (
                piece !== "." &&
                colorOf(piece) === state.turn
            ) {
                selected = square;
                legalTargets = [];

                for (
                    i = 0;
                    i < moves.length;
                    i++
                ) {
                    if (
                        moves[i].from === square &&
                        legalTargets.indexOf(
                            moves[i].to
                        ) === -1
                    ) {
                        legalTargets.push(
                            moves[i].to
                        );
                    }
                }
            } else {
                clearSelection();
            }

            render(false);
            return;
        }

        if (candidates.length > 1) {
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

    function setMode(mode) {
        gameMode = mode;

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

        pendingPromotion = null;
    }

    board.onclick =
        function (event) {
            var target =
                event.target;

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

            if (
                !target ||
                target === board
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
        };

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

            if (!animationEnabled) {
                resetOrientationInstant(
                    boardBlack
                );
            }

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
        promotionIndex < promotionButtons.length;
        promotionIndex++
    ) {
        promotionButtons[
            promotionIndex
        ].onclick =
            function () {
                if (!pendingPromotion) {
                    return;
                }

                var wanted =
                    this.getAttribute(
                        "data-promotion"
                    );

                var chosen = null;
                var i;

                for (
                    i = 0;
                    i < pendingPromotion.moves.length;
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

                if (chosen) {
                    executeMove(
                        chosen
                    );
                }
            };
    }

    document.onkeydown =
        function (event) {
            var key =
                event.keyCode ||
                event.which;

            if (key === 27) {
                closeSettings();
                clearSelection();
                closePromotion();
                render(false);
                return;
            }

            if (key === 78) {
                resetGame();
                return;
            }

            if (
                isTV() ||
                gameMode === "two"
            ) {
                if (
                    key === 37 ||
                    key === 38 ||
                    key === 39 ||
                    key === 40
                ) {
                    if (selected < 0) {
                        selected =
                            state.turn === "w"
                                ? 60
                                : 4;
                    }

                    var rr =
                        row(selected);

                    var cc =
                        col(selected);

                    if (key === 37) {
                        cc--;
                    }

                    if (key === 38) {
                        rr--;
                    }

                    if (key === 39) {
                        cc++;
                    }

                    if (key === 40) {
                        rr++;
                    }

                    if (inside(rr, cc)) {
                        selected =
                            index(
                                rr,
                                cc
                            );

                        legalTargets = [];

                        var moves =
                            legalMoves(
                                state,
                                state.turn
                            );

                        var i;

                        for (
                            i = 0;
                            i < moves.length;
                            i++
                        ) {
                            if (
                                moves[i].from === selected
                            ) {
                                legalTargets.push(
                                    moves[i].to
                                );
                            }
                        }

                        render(false);
                    }

                    return;
                }

                if (
                    key === 13 ||
                    key === 32
                ) {
                    if (selected >= 0) {
                        chooseSquare(
                            selected
                        );
                    }
                }
            }
        };

    function handleViewportResize() {
        resizeBoard();
    }

    window.onresize =
        handleViewportResize;

    if (window.visualViewport) {
        try {
            window.visualViewport.addEventListener(
                "resize",
                handleViewportResize
            );
        } catch (e) {
        }
    }

    window.onload =
        function () {
            updateAnimationUI();
            resetOrientationInstant(false);
            render(false);
            resizeBoard();
        };

    updateAnimationUI();
    resetOrientationInstant(false);
    render(false);
    resizeBoard();

})();