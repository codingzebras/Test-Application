const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const playerScoreElement = document.getElementById('playerScore');
const aiScoreElement = document.getElementById('aiScore');
const roundCountElement = document.getElementById('roundCount');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

const HUMAN = 'X';
const AI = 'O';
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

let board = Array(9).fill('');
let playerScore = 0;
let aiScore = 0;
let round = 1;
let roundOver = false;
let matchOver = false;
let isPlayerTurn = true;
let aiTurnTimeout = null;

function initBoard() {
  boardElement.innerHTML = '';
  board.forEach((_, index) => {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.dataset.index = index;
    cell.setAttribute('role', 'gridcell');
    cell.addEventListener('click', onPlayerMove);
    boardElement.appendChild(cell);
  });
}

function onPlayerMove(event) {
  if (roundOver || matchOver || !isPlayerTurn) return;

  const index = Number(event.currentTarget.dataset.index);
  if (board[index]) return;

  placeMove(index, HUMAN);

  const outcome = getOutcome(board);
  if (outcome) {
    finishRound(outcome);
    return;
  }

  isPlayerTurn = false;
  setBoardEnabled(false);
  statusElement.className = 'status';
  statusElement.textContent = 'AI is calculating...';

  aiTurnTimeout = setTimeout(() => {
    aiTurnTimeout = null;

    if (roundOver || matchOver) return;

    const aiMove = chooseAiMove();
    if (aiMove !== null) {
      placeMove(aiMove, AI);
    }

    const aiOutcome = getOutcome(board);
    if (aiOutcome) {
      finishRound(aiOutcome);
      return;
    }

    isPlayerTurn = true;
    setBoardEnabled(true);
    statusElement.className = 'status';
    statusElement.textContent = 'Your turn. Place an X.';
  }, 400);
}

function placeMove(index, token) {
  board[index] = token;
  const cell = boardElement.children[index];
  cell.textContent = token;
  cell.disabled = true;
  if (token === AI) {
    cell.classList.add('o');
  }
}

function setBoardEnabled(enabled) {
  Array.from(boardElement.children).forEach((cell, index) => {
    if (!board[index]) {
      cell.disabled = !enabled;
    }
  });
}

function getOutcome(grid) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (grid[a] && grid[a] === grid[b] && grid[b] === grid[c]) {
      return { winner: grid[a], line };
    }
  }

  if (grid.every(Boolean)) {
    return { winner: 'draw', line: [] };
  }

  return null;
}

function chooseAiMove() {
  const open = board
    .map((value, index) => (value ? null : index))
    .filter((index) => index !== null);

  // Win if possible.
  for (const index of open) {
    const trial = [...board];
    trial[index] = AI;
    if (getOutcome(trial)?.winner === AI) return index;
  }

  // Block player.
  for (const index of open) {
    const trial = [...board];
    trial[index] = HUMAN;
    if (getOutcome(trial)?.winner === HUMAN) return index;
  }

  // Take center, then corners, then any spot.
  if (!board[4]) return 4;

  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  if (!open.length) return null;
  return open[Math.floor(Math.random() * open.length)];
}

function clearAiTimeout() {
  if (aiTurnTimeout !== null) {
    clearTimeout(aiTurnTimeout);
    aiTurnTimeout = null;
  }
}

function finishRound({ winner }) {
  roundOver = true;
  isPlayerTurn = false;
  clearAiTimeout();
  Array.from(boardElement.children).forEach((cell) => {
    cell.disabled = true;
  });

  if (winner === HUMAN) {
    playerScore += 1;
    statusElement.className = 'status win';
    statusElement.textContent = 'You won this round! Neon victory!';
  } else if (winner === AI) {
    aiScore += 1;
    statusElement.className = 'status loss';
    statusElement.textContent = 'AI won this round. Recalibrate and strike back!';
  } else {
    statusElement.className = 'status';
    statusElement.textContent = 'Draw round. No points awarded.';
  }

  updateScoreboard();
  evaluateMatchState();
}

function updateScoreboard() {
  playerScoreElement.textContent = String(playerScore);
  aiScoreElement.textContent = String(aiScore);
  roundCountElement.textContent = `${Math.min(round, 3)} / 3`;
}

function evaluateMatchState() {
  const maxRoundsPlayed = round >= 3;
  const hasWinner = playerScore === 2 || aiScore === 2;

  if (hasWinner || maxRoundsPlayed) {
    matchOver = true;
    nextRoundBtn.hidden = true;
    playAgainBtn.hidden = false;

    if (playerScore > aiScore) {
      statusElement.className = 'status win';
      statusElement.textContent = '🏆 You won the match! Best of three champion!';
    } else if (aiScore > playerScore) {
      statusElement.className = 'status loss';
      statusElement.textContent = '🤖 AI won the match. Try again, runner!';
    } else {
      statusElement.className = 'status';
      statusElement.textContent = 'Match tied. Run it back?';
    }

    return;
  }

  nextRoundBtn.hidden = false;
  playAgainBtn.hidden = true;
}

function startNextRound() {
  if (matchOver) return;

  clearAiTimeout();
  round += 1;
  board = Array(9).fill('');
  roundOver = false;
  isPlayerTurn = true;
  nextRoundBtn.hidden = true;
  statusElement.className = 'status';
  statusElement.textContent = 'Next round engaged. Your turn.';
  initBoard();
  updateScoreboard();
}

function resetMatch() {
  clearAiTimeout();
  board = Array(9).fill('');
  playerScore = 0;
  aiScore = 0;
  round = 1;
  roundOver = false;
  matchOver = false;
  isPlayerTurn = true;
  nextRoundBtn.hidden = true;
  playAgainBtn.hidden = true;
  statusElement.className = 'status';
  statusElement.textContent = 'Fresh match loaded. Your turn. Place an X.';
  initBoard();
  updateScoreboard();
}

nextRoundBtn.addEventListener('click', startNextRound);
playAgainBtn.addEventListener('click', resetMatch);

resetMatch();
