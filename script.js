document.addEventListener('DOMContentLoaded', () => {
    const ROWS = 9;
    const COLS = 9;

    const Player = {
        RED: 'player1',
        BLUE: 'player2'
    };

    const GameMode = {
        HUMAN_VS_HUMAN: 'HUMAN_VS_HUMAN',
        HUMAN_VS_COMPUTER: 'HUMAN_VS_COMPUTER'
    };

    const TokenDirection = {
        UP: 'UP', // Default
        DOWN: 'DOWN',
        LEFT: 'LEFT',
        RIGHT: 'RIGHT',
        TOP_LEFT: 'TOP_LEFT',
        BOTTOM_RIGHT: 'BOTTOM_RIGHT'
    };

    const CellState = {
        EMPTY: 'EMPTY',
        OCCUPIED: 'OCCUPIED',
        CAPTURED: 'CAPTURED'
    };
    
    const Points = {
        HEXAGON_COMPLETION: 6,
        MACRO_TRIANGLE: 4,
        FORTRESS_CAPTURE: 10
    };

    const TARGET_SCORE = 50;

    // Define central fortress zones
    const FORTRESS_ZONES_COORDS = [{ r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) }];

    let board = []; // 2D array for game state
    let currentPlayer = Player.RED;
    let scores = { [Player.RED]: 0, [Player.BLUE]: 0 };
    let hexagonCount = { [Player.RED]: 0, [Player.BLUE]: 0 }; // Track hexagons for tie-breaking
    let lastMoveState = null; // Stores the state *before* the current player's last move
    let undoAvailableThisTurn = false; // Tracks if undo is available for the *current* move being made
    let gameActive = false; // Game starts inactive until mode is selected
    let selectedTokenDirection = TokenDirection.UP;
    let gameMode = null; // Will be set when user selects a mode

    // DOM Elements
    const boardElement = document.getElementById('game-board');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const turnIndicatorElement = document.getElementById('turn-indicator');
    const undoButton = document.getElementById('undo-button');
    const resetButton = document.getElementById('reset-button');
    const rulesButton = document.getElementById('rules-button');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const winnerTextElement = document.getElementById('winner-text');
    const playAgainButton = document.getElementById('play-again-button');
    const orientationButtons = document.querySelectorAll('.orientation-button');
    
    // Modal Elements
    const gameModeModal = document.getElementById('game-mode-modal');
    const humanVsHumanBtn = document.getElementById('human-vs-human-btn');
    const humanVsComputerBtn = document.getElementById('human-vs-computer-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeRulesButton = document.querySelector('.close-button');

    function initBoard() {
        boardElement.innerHTML = '';
        board = [];
        for (let r = 0; r < ROWS; r++) {
            const rowArray = [];
            const rowElement = document.createElement('div');
            rowElement.classList.add('hex-row');
            for (let c = 0; c < COLS; c++) {
                rowArray.push({
                    state: CellState.EMPTY,
                    player: null,
                    direction: null,
                    isFortressZone: FORTRESS_ZONES_COORDS.some(fz => fz.r === r && fz.c === c), // Mark predefined fortress zones
                    isCapturedFortress: false, // If this fortress zone is captured
                    partOfHexagon: false, // Track if this cell is part of a completed hexagon
                    partOfMacroTriangle: false // Track if this cell is part of a completed macro triangle
                });

                const cellElement = document.createElement('div');
                cellElement.classList.add('hex-cell');
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;
                cellElement.addEventListener('click', () => handleCellClick(r, c));
                rowElement.appendChild(cellElement);
            }
            board.push(rowArray);
            boardElement.appendChild(rowElement);
        }
    }

    function renderBoard() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cellData = board[r][c];
                const cellElement = boardElement.children[r].children[c];
                
                // Clear previous classes and content
                cellElement.innerHTML = '';
                cellElement.className = 'hex-cell'; // Reset classes

                if (cellData.state === CellState.OCCUPIED) {
                    cellElement.classList.add('occupied', cellData.player);
                    const tokenContainer = document.createElement('div');
                    tokenContainer.classList.add('token-container');
                    const triangle = document.createElement('div');
                    triangle.classList.add('triangle', cellData.player, cellData.direction);
                    tokenContainer.appendChild(triangle);
                    cellElement.appendChild(tokenContainer);
                    
                    // Add visual indicators for scoring patterns
                    if (cellData.partOfHexagon) {
                        cellElement.classList.add('part-of-hexagon');
                    }
                    if (cellData.partOfMacroTriangle) {
                        cellElement.classList.add('part-of-macro-triangle');
                    }
                } else if (cellData.state === CellState.CAPTURED) {
                    cellElement.classList.add('captured', cellData.player);
                }
                
                if (cellData.isFortressZone && cellData.isCapturedFortress) {
                    cellElement.classList.add('fortress', cellData.player);
                }
            }
        }
        updateScoreboard();
    }

    function updateScoreboard() {
        player1ScoreElement.textContent = `Red: ${scores[Player.RED]}`;
        player2ScoreElement.textContent = `Blue: ${scores[Player.BLUE]}`;
        turnIndicatorElement.textContent = `${currentPlayer === Player.RED ? 'Red' : 'Blue'}'s Turn`;
        turnIndicatorElement.className = `turn-indicator ${currentPlayer}`;
        // Undo button is enabled if a move has been made by the current player in their current turn
        // and they haven't used their undo for this turn yet.
        undoButton.disabled = !undoAvailableThisTurn || !lastMoveState;
    }
    
    function getNeighbors(r, c) {
        const neighbors = [];
        // Offsets for pointy-topped hexes with row-based offset ("even-r" or "odd-r")
        const isEvenRow = r % 2 === 0;
        const potentialNeighbors = isEvenRow ? [
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },  // W, E
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, // NW, NE
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }   // SW, SE
        ] : [
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },  // W, E
            { dr: -1, dc: 0 }, { dr: -1, dc: 1 }, // NW, NE
            { dr: 1, dc: 0 }, { dr: 1, dc: 1 }   // SW, SE
        ];

        for (const offset of potentialNeighbors) {
            const nr = r + offset.dr;
            const nc = c + offset.dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    function handleCellClick(r, c) {
        if (!gameActive || board[r][c].state !== CellState.EMPTY) {
            return;
        }

        // If it's the computer's turn in Human vs Computer mode, ignore the click
        if (gameMode === GameMode.HUMAN_VS_COMPUTER && currentPlayer === Player.BLUE) {
            return;
        }

        makeMove(r, c);
        
        // If Human vs Computer mode and it's now the computer's turn, make a computer move
        if (gameMode === GameMode.HUMAN_VS_COMPUTER && currentPlayer === Player.BLUE && gameActive) {
            setTimeout(makeComputerMove, 1000); // Delay for better UX
        }
    }
    
    function makeMove(r, c) {
        // Store state for potential undo *of this move*
        lastMoveState = {
            board: JSON.parse(JSON.stringify(board)), // Deep copy
            scores: { ...scores },
            hexagonCount: { ...hexagonCount },
            currentPlayer: currentPlayer,
            gameActive: gameActive
        };
        undoAvailableThisTurn = true; // The move about to be made can be undone

        board[r][c].state = CellState.OCCUPIED;
        board[r][c].player = currentPlayer;
        board[r][c].direction = selectedTokenDirection;

        let pointsEarnedThisTurn = 0;
        pointsEarnedThisTurn += checkForHexagonCompletion(r, c, currentPlayer);
        pointsEarnedThisTurn += checkForMacroTriangleCompletion(r, c, currentPlayer);
        pointsEarnedThisTurn += checkForFortressCapture(r, c, currentPlayer);

        scores[currentPlayer] += pointsEarnedThisTurn;

        if (checkGameEnd()) {
            endGame();
        } else {
            switchPlayer();
            // After switching player, the next player hasn't made a move yet, so no undo for *their* potential move.
            // The previous player's undo opportunity for *their* last move is now gone.
            undoAvailableThisTurn = false;
        }
        renderBoard();
    }
    
    function makeComputerMove() {
        if (!gameActive || currentPlayer !== Player.BLUE) return;
        
        // Simple AI: find an empty cell and place a token
        const validMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].state === CellState.EMPTY) {
                    validMoves.push({ r, c });
                }
            }
        }
        
        if (validMoves.length > 0) {
            // Choose a random valid move
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            
            // Choose a random direction
            const directions = Object.values(TokenDirection);
            selectedTokenDirection = directions[Math.floor(Math.random() * directions.length)];
            
            // Update the UI to show the selected direction
            orientationButtons.forEach(btn => {
                if (btn.dataset.direction === selectedTokenDirection) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Make the move
            makeMove(randomMove.r, randomMove.c);
        }
    }
    
    function checkForHexagonCompletion(placedR, placedC, player) {
        // Check if the placed token completes a hexagon pattern
        let points = 0;
        
        // Get the direct neighbors of the placed token
        const neighbors = getNeighbors(placedR, placedC);
        
        // For each neighbor, check if it's part of a potential hexagon
        for (const neighbor of neighbors) {
            // Skip if not the player's token
            if (board[neighbor.r][neighbor.c].state !== CellState.OCCUPIED || 
                board[neighbor.r][neighbor.c].player !== player) {
                continue;
            }
            
            // Find common neighbors between the placed token and this neighbor
            const placedNeighbors = getNeighbors(placedR, placedC);
            const neighborNeighbors = getNeighbors(neighbor.r, neighbor.c);
            
            // Try to build a connected path of 6 tokens forming a hexagon
            for (const secondNeighbor of neighborNeighbors) {
                // Skip if it's the placed token or not the player's token
                if ((secondNeighbor.r === placedR && secondNeighbor.c === placedC) ||
                    board[secondNeighbor.r][secondNeighbor.c].state !== CellState.OCCUPIED ||
                    board[secondNeighbor.r][secondNeighbor.c].player !== player) {
                    continue;
                }
                
                // Now we have: placed -> neighbor -> secondNeighbor
                // Continue the path with a fourth token
                const secondNeighborNeighbors = getNeighbors(secondNeighbor.r, secondNeighbor.c);
                for (const thirdNeighbor of secondNeighborNeighbors) {
                    // Skip if it's already in our path or not the player's token
                    if ((thirdNeighbor.r === placedR && thirdNeighbor.c === placedC) ||
                        (thirdNeighbor.r === neighbor.r && thirdNeighbor.c === neighbor.c) ||
                        board[thirdNeighbor.r][thirdNeighbor.c].state !== CellState.OCCUPIED ||
                        board[thirdNeighbor.r][thirdNeighbor.c].player !== player) {
                        continue;
                    }
                    
                    // Continue with a fifth token
                    const thirdNeighborNeighbors = getNeighbors(thirdNeighbor.r, thirdNeighbor.c);
                    for (const fourthNeighbor of thirdNeighborNeighbors) {
                        // Skip if it's already in our path or not the player's token
                        if ((fourthNeighbor.r === placedR && fourthNeighbor.c === placedC) ||
                            (fourthNeighbor.r === neighbor.r && fourthNeighbor.c === neighbor.c) ||
                            (fourthNeighbor.r === secondNeighbor.r && fourthNeighbor.c === secondNeighbor.c) ||
                            board[fourthNeighbor.r][fourthNeighbor.c].state !== CellState.OCCUPIED ||
                            board[fourthNeighbor.r][fourthNeighbor.c].player !== player) {
                            continue;
                        }
                        
                        // And finally, check if the fifth token connects back to the placed token
                        const fourthNeighborNeighbors = getNeighbors(fourthNeighbor.r, fourthNeighbor.c);
                        const closesLoop = fourthNeighborNeighbors.some(
                            n => n.r === placedR && n.c === placedC
                        );
                        
                        if (closesLoop) {
                            // We've found a hexagon!
                            console.log("Hexagon completion! +6 points");
                            points += Points.HEXAGON_COMPLETION;
                            hexagonCount[player]++;
                            
                            // Mark these cells as part of a hexagon
                            board[placedR][placedC].partOfHexagon = true;
                            board[neighbor.r][neighbor.c].partOfHexagon = true;
                            board[secondNeighbor.r][secondNeighbor.c].partOfHexagon = true;
                            board[thirdNeighbor.r][thirdNeighbor.c].partOfHexagon = true;
                            board[fourthNeighbor.r][fourthNeighbor.c].partOfHexagon = true;
                            
                            // We've found one hexagon, let's return immediately
                            // (to avoid double-counting if multiple hexagons share edges)
                            return points;
                        }
                    }
                }
            }
        }
        
        return points;
    }
    
    function checkForMacroTriangleCompletion(placedR, placedC, player) {
        let points = 0;
        
        // Get the neighbors of the placed token
        const neighbors = getNeighbors(placedR, placedC);
        
        // Check all pairs of neighbors to see if they form a triangle with the placed token
        for (let i = 0; i < neighbors.length; i++) {
            const neighbor1 = neighbors[i];
            
            // Skip if not the player's token
            if (board[neighbor1.r][neighbor1.c].state !== CellState.OCCUPIED || 
                board[neighbor1.r][neighbor1.c].player !== player) {
                continue;
            }
            
            for (let j = i + 1; j < neighbors.length; j++) {
                const neighbor2 = neighbors[j];
                
                // Skip if not the player's token
                if (board[neighbor2.r][neighbor2.c].state !== CellState.OCCUPIED || 
                    board[neighbor2.r][neighbor2.c].player !== player) {
                    continue;
                }
                
                // Check if neighbor1 and neighbor2 are also neighbors to each other
                // This would complete the triangle formation
                const areNeighbors = getNeighbors(neighbor1.r, neighbor1.c).some(
                    n => n.r === neighbor2.r && n.c === neighbor2.c
                );
                
                if (areNeighbors) {
                    // We have found 3 tokens forming a triangle
                    // Now check if their orientations align
                    const placedDirection = board[placedR][placedC].direction;
                    const neighbor1Direction = board[neighbor1.r][neighbor1.c].direction;
                    const neighbor2Direction = board[neighbor2.r][neighbor2.c].direction;
                    
                    // Simplest check: all three have the same direction
                    if (placedDirection === neighbor1Direction && placedDirection === neighbor2Direction) {
                        console.log("Macro Triangle completion! +4 points");
                        points += Points.MACRO_TRIANGLE;
                        
                        // Mark these cells as part of a macro triangle
                        board[placedR][placedC].partOfMacroTriangle = true;
                        board[neighbor1.r][neighbor1.c].partOfMacroTriangle = true;
                        board[neighbor2.r][neighbor2.c].partOfMacroTriangle = true;
                        
                        // Return immediately after finding one
                        return points;
                    }
                    
                    // Add more complex alignment checks if needed
                    // For example, specific combinations like UP, TOP_LEFT, TOP_RIGHT
                    // would form a valid upward-pointing macro triangle
                }
            }
        }
        
        return points;
    }

    function checkForFortressCapture(placedR, placedC, player) {
        let points = 0;

        for (const fzCoord of FORTRESS_ZONES_COORDS) {
            const r_fz = fzCoord.r;
            const c_fz = fzCoord.c;

            // Check if this fortress zone is already captured
            if (board[r_fz][c_fz].isFortressZone && !board[r_fz][c_fz].isCapturedFortress) {
                const fortressNeighbors = getNeighbors(r_fz, c_fz);
                if (fortressNeighbors.length < 6) continue; // Edge fortress zone, cannot be fully surrounded by 6

                let surroundingPlayerTokens = 0;
                for (const fn of fortressNeighbors) {
                    if (board[fn.r][fn.c].state === CellState.OCCUPIED && board[fn.r][fn.c].player === player) {
                        surroundingPlayerTokens++;
                    }
                }

                if (surroundingPlayerTokens === fortressNeighbors.length) { // All surrounding cells are player's tokens
                    board[r_fz][c_fz].isCapturedFortress = true;
                    board[r_fz][c_fz].player = player; // Mark who captured it
                    points += Points.FORTRESS_CAPTURE;
                    console.log("Fortress Capture! +10 points");
                }
            }
        }
        return points;
    }

    function switchPlayer() {
        currentPlayer = (currentPlayer === Player.RED) ? Player.BLUE : Player.RED;
    }

    function checkGameEnd() {
        if (scores[Player.RED] >= TARGET_SCORE || scores[Player.BLUE] >= TARGET_SCORE) {
            return true;
        }
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].state === CellState.EMPTY) return false; // Found an empty cell
            }
        }
        return true; // All cells filled
    }

    function endGame() {
        gameActive = false;
        let winnerMessage = "";
        
        if (scores[Player.RED] > scores[Player.BLUE]) {
            winnerMessage = "Red wins!";
        } else if (scores[Player.BLUE] > scores[Player.RED]) {
            winnerMessage = "Blue wins!";
        } else {
            // Tie in scores, check who made more hexagons
            if (hexagonCount[Player.RED] > hexagonCount[Player.BLUE]) {
                winnerMessage = "Red wins by Hexagon count!";
            } else if (hexagonCount[Player.BLUE] > hexagonCount[Player.RED]) {
                winnerMessage = "Blue wins by Hexagon count!";
            } else {
                winnerMessage = "It's a Draw!";
            }
        }
        
        winnerTextElement.textContent = winnerMessage;
        gameOverMessageElement.style.display = 'block';
        undoButton.disabled = true;
    }
    
    function handleUndo() {
        if (!gameActive || !undoAvailableThisTurn || !lastMoveState) {
            alert("Undo not available for this move or no move to undo.");
            return;
        }

        // Restore the game state from before the last move
        board = JSON.parse(JSON.stringify(lastMoveState.board)); // Deep copy
        scores = { ...lastMoveState.scores };
        hexagonCount = { ...lastMoveState.hexagonCount };
        currentPlayer = lastMoveState.currentPlayer; // Player who made the move gets to replay
        gameActive = lastMoveState.gameActive;

        undoAvailableThisTurn = false; // Undo for this specific turn slot has been used.
        lastMoveState = null; // Clear the stored undo state as it's been used

        renderBoard(); // Re-render the board with the restored state
        updateScoreboard(); // Update UI elements
        gameOverMessageElement.style.display = 'none'; // Hide game over message if it was shown
    }

    function resetGame() {
        // Show game mode selection first
        gameModeModal.style.display = 'block';
    }
    
    function startGame(mode) {
        gameMode = mode;
        gameModeModal.style.display = 'none';
        
        gameActive = true;
        currentPlayer = Player.RED;
        scores = { [Player.RED]: 0, [Player.BLUE]: 0 };
        hexagonCount = { [Player.RED]: 0, [Player.BLUE]: 0 };
        lastMoveState = null;
        undoAvailableThisTurn = false;
        selectedTokenDirection = TokenDirection.UP;
        
        // Reset orientation buttons if they exist
        if (orientationButtons.length > 0) {
            orientationButtons.forEach(btn => btn.classList.remove('active'));
            orientationButtons[0].classList.add('active');
        }
        
        gameOverMessageElement.style.display = 'none';
        initBoard();
        renderBoard();
    }
    
    function showRules() {
        rulesModal.style.display = 'block';
    }

    // Event Listeners for Game Modes
    humanVsHumanBtn.addEventListener('click', () => startGame(GameMode.HUMAN_VS_HUMAN));
    humanVsComputerBtn.addEventListener('click', () => startGame(GameMode.HUMAN_VS_COMPUTER));

    // Event Listener for Rules
    rulesButton.addEventListener('click', showRules);
    closeRulesButton.addEventListener('click', () => rulesModal.style.display = 'none');

    // Event Listeners for Orientation Buttons
    orientationButtons.forEach(button => {
        button.addEventListener('click', () => {
            orientationButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedTokenDirection = TokenDirection[button.dataset.direction.toUpperCase()];
        });
    });
    
    undoButton.addEventListener('click', handleUndo);
    resetButton.addEventListener('click', resetGame);
    playAgainButton.addEventListener('click', resetGame);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });

    // Initialize Game - Show mode selection on start
    gameModeModal.style.display = 'block';
});