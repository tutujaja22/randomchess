// 체스판 가져오기
const board = document.getElementById('chessboard');
const turnDisplay = document.getElementById('turn');
const phaseDisplay = document.getElementById('phase');
const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const whiteGauge = document.getElementById('white-gauge');
const blackGauge = document.getElementById('black-gauge');
const diceAnimation = document.getElementById('dice-animation');

// 체스 말 이미지
const pieceImages = {
    '♔': '<img src="https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg" width="50">',
    '♕': '<img src="https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg" width="50">',
    '♖': '<img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg" width="50">',
    '♗': '<img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg" width="50">',
    '♘': '<img src="https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg" width="50">',
    '♙': '<img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg" width="50">',
    '♚': '<img src="https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg" width="50">',
    '♛': '<img src="https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg" width="50">',
    '♜': '<img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg" width="50">',
    '♝': '<img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg" width="50">',
    '♞': '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg" width="50">',
    '♟': '<img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg" width="50">'
};

// 체스 말 배열
const pieces = [
    '♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜',
    '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙',
    '♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'
];

// 게임 상태
let boardState = pieces.slice();
let selectedSquare = null;
let moved = { whiteKing: false, whiteLeftRook: false, whiteRightRook: false, blackKing: false, blackLeftRook: false, blackRightRook: false };
let lastMove = null;
let turn = 'white';
let turnCount = 0;
let timeLeft = 30;
let timerInterval = null;
let diceTotal = { white: 0, black: 0 }; // 팀별 주사위 합 누적
let extraTurn = false; // 연속 턴 플래그
let phase = 'dice'; // 'dice' 또는 'move' 단계

// 64칸 만들기
const squares = [];
for (let i = 0; i < 64; i++) {
    const square = document.createElement('div');
    square.classList.add('square');
    if ((Math.floor(i / 8) + i) % 2 === 0) square.classList.add('white');
    else square.classList.add('black');
    square.innerHTML = boardState[i] ? pieceImages[boardState[i]] : '';
    square.dataset.index = i;
    squares.push(square);
    board.appendChild(square);
}

// 주사위 애니메이션 (합만 표시)
function rollDiceAnimation() {
    return new Promise(resolve => {
        diceAnimation.textContent = '';
        let total = 0;
        for (let i = 0; i < 3; i++) {
            total += Math.floor(Math.random() * 6) + 1; // 1~6까지 3번 합
        }
        diceAnimation.textContent = `${turn === 'white' ? '백' : '흑'}의 🎲${total}`;
        diceTotal[turn] += total; // 해당 팀에 누적
        updateGauge();
        statusDisplay.textContent = `흰말: ${diceTotal.white}, 흑말: ${diceTotal.black}`;
        if (diceTotal[turn] >= 100) {
            diceTotal[turn] = 0;
            extraTurn = true;
            statusDisplay.textContent += ' - 연속 턴 가능!';
            predictNextTurn();
        }
        setTimeout(() => {
            phase = 'move'; // 주사위 후 이동 단계
            phaseDisplay.textContent = `상태: 말 움직이기`;
            resolve(total);
        }, 1000); // 1초 대기 후 완료
    });
}

// 게이지 업데이트
function updateGauge() {
    whiteGauge.style.width = `${Math.min(diceTotal['white'], 100) / 100 * 100}%`; // 100 초과 방지
    blackGauge.style.width = `${Math.min(diceTotal['black'], 100) / 100 * 100}%`; // 100 초과 방지
    if (diceTotal['white'] >= 100) whiteGauge.style.backgroundColor = '#FF5722';
    else whiteGauge.style.backgroundColor = '#F0E68C';
    if (diceTotal['black'] >= 100) blackGauge.style.backgroundColor = '#FF5722';
    else blackGauge.style.backgroundColor = '#8B4513';
}

// 다음 턴 예측
function predictNextTurn() {
    const nextTurn = turn === 'white' ? 'black' : 'white';
    const minNextRoll = 3; // 최소 3
    const maxNextRoll = 18; // 최대 18
    if (100 - diceTotal[nextTurn] <= maxNextRoll) {
        statusDisplay.textContent += ` - 다음 차례(${nextTurn === 'white' ? '백' : '흑'}) 연속 가능!`;
    }
}

// 타이머
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = 30;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    timerInterval = setTimeout(() => {
        timeLeft--;
        timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert(`${turn === 'white' ? '백' : '흑'}의 시간 초과! 턴이 넘어갑니다.`);
            changeTurn();
            startTimer();
        } else {
            startTimer(); // 재귀 호출로 1초마다 갱신
        }
    }, 1000);
}

startTimer();

// 이동 가능 칸 하이라이트
function highlightMoves(from) {
    squares.forEach(square => square.classList.remove('highlight'));
    const validMoves = getValidMoves(from);
    validMoves.forEach(to => {
        squares[to].classList.add('highlight');
    });
}

function getValidMoves(from) {
    const moves = [];
    for (let to = 0; to < 64; to++) {
        if (isValidMove(from, to) || isValidCastling(from, to)) {
            moves.push(to);
        }
    }
    return moves;
}

// 클릭 이벤트
squares.forEach(square => {
    square.addEventListener('click', async function() {
        const index = parseInt(square.dataset.index);

        if (phase === 'dice') {
            if (diceAnimation.textContent === '') {
                rollDiceAnimation().then(() => startTimer()); // 주사위 던지기 시작
            } else {
                alert('이미 주사위를 던졌습니다! 말을 움직이세요.');
            }
            return;
        }

        if (selectedSquare === null) {
            if (boardState[index] !== '' && 
                ((turn === 'white' && boardState[index] >= '♔' && boardState[index] <= '♙') ||
                 (turn === 'black' && boardState[index] >= '♚' && boardState[index] <= '♟'))) {
                selectedSquare = index;
                square.classList.add('selected');
                highlightMoves(index);
            }
        } else {
            const fromIndex = selectedSquare;
            const toIndex = index;

            if (squares[toIndex].classList.contains('highlight') || isValidCastling(fromIndex, toIndex)) {
                const tempBoard = boardState.slice();
                let isCastling = isValidCastling(fromIndex, toIndex);

                if (isCastling) {
                    handleCastling(fromIndex, toIndex);
                } else {
                    if (isEnPassant(fromIndex, toIndex)) {
                        handleEnPassant(fromIndex, toIndex);
                    } else {
                        boardState[toIndex] = boardState[fromIndex];
                        boardState[fromIndex] = '';
                        squares[toIndex].innerHTML = pieceImages[boardState[toIndex]];
                        squares[fromIndex].innerHTML = '';
                        if (isPawnPromotion(toIndex)) {
                            boardState[toIndex] = (turn === 'white') ? '♕' : '♛';
                            squares[toIndex].innerHTML = pieceImages[boardState[toIndex]];
                        }
                    }
                }

                updateMovedStatus(fromIndex);
                lastMove = { from: fromIndex, to: toIndex };

                if (isKingInCheck(turn === 'white' ? 'black' : 'white')) {
                    statusDisplay.textContent = '체크 상태!';
                    if (isCheckmate(turn === 'white' ? 'black' : 'white')) {
                        clearInterval(timerInterval);
                        statusDisplay.textContent = `${turn === 'white' ? '백' : '흑'} 승리! 체크메이트!`;
                        alert(`${turn === 'white' ? '백' : '흑'} 승리! 체크메이트!`);
                        return;
                    }
                } else {
                    statusDisplay.textContent = `흰말: ${diceTotal.white}, 흑말: ${diceTotal.black}`;
                    if (isStalemate(turn === 'white' ? 'black' : 'white')) {
                        clearInterval(timerInterval);
                        statusDisplay.textContent = '무승부! 스테일메이트!';
                        alert('무승부! 스테일메이트!');
                        return;
                    }
                }

                squares.forEach(s => s.classList.remove('highlight', 'selected'));
                selectedSquare = null;
                if (!extraTurn) {
                    phase = 'dice'; // 이동 후 다시 주사위 단계
                    phaseDisplay.textContent = `상태: 주사위 던지기`;
                    changeTurn();
                    rollDiceAnimation().then(() => startTimer());
                } else {
                    extraTurn = false;
                    statusDisplay.textContent += ' - 연속 턴 사용!';
                    startTimer();
                }
            } else if (index === fromIndex) {
                squares.forEach(s => s.classList.remove('highlight', 'selected'));
                selectedSquare = null;
            }
        }
    });
});

// 이동 규칙
function isValidMove(from, to) {
    const piece = boardState[from];
    const rowDiff = Math.floor(to / 8) - Math.floor(from / 8);
    const colDiff = (to % 8) - (from % 8);
    const rowAbs = Math.abs(rowDiff);
    const colAbs = Math.abs(colDiff);
    const toPiece = boardState[to];

    if (!isPathClear(from, to)) return false;

    if (piece === '♙') {
        if (rowDiff === -1 && colDiff === 0 && toPiece === '') return true;
        if (rowDiff === -2 && colDiff === 0 && Math.floor(from / 8) === 6 && toPiece === '' && boardState[from - 8] === '') return true;
        if (rowDiff === -1 && colAbs === 1 && toPiece !== '' && toPiece >= '♚' && toPiece <= '♟') return true;
    }
    if (piece === '♟') {
        if (rowDiff === 1 && colDiff === 0 && toPiece === '') return true;
        if (rowDiff === 2 && colDiff === 0 && Math.floor(from / 8) === 1 && toPiece === '' && boardState[from + 8] === '') return true;
        if (rowDiff === 1 && colAbs === 1 && toPiece !== '' && toPiece >= '♔' && toPiece <= '♙') return true;
    }
    if ((piece === '♔' || piece === '♚') && rowAbs <= 1 && colAbs <= 1 && (rowAbs + colAbs > 0)) return true;
    if ((piece === '♕' || piece === '♛') && 
        ((rowDiff === 0 && colDiff !== 0) || (colDiff === 0 && rowDiff !== 0) || (rowAbs === colAbs))) return true;
    if ((piece === '♖' || piece === '♜') && 
        ((rowDiff === 0 && colDiff !== 0) || (colDiff === 0 && rowDiff !== 0))) return true;
    if ((piece === '♘' || piece === '♞') && 
        ((rowAbs === 2 && colAbs === 1) || (rowAbs === 1 && colAbs === 2))) return true;
    if ((piece === '♗' || piece === '♝') && (rowAbs === colAbs)) return true;

    return false;
}

// 앙파상
function isEnPassant(from, to) {
    const piece = boardState[from];
    const rowDiff = Math.floor(to / 8) - Math.floor(from / 8);
    const colDiff = (to % 8) - (from % 8);
    const colAbs = Math.abs(colDiff);

    if (lastMove && (piece === '♙' || piece === '♟')) {
        const lastFrom = lastMove.from;
        const lastTo = lastMove.to;
        const lastPiece = boardState[lastTo];

        if (piece === '♙' && rowDiff === -1 && colAbs === 1 && boardState[to] === '' &&
            lastPiece === '♟' && Math.floor(lastFrom / 8) === 1 && Math.floor(lastTo / 8) === 3 &&
            to === lastTo - 8 && Math.abs(lastFrom - from) === 1) return true;

        if (piece === '♟' && rowDiff === 1 && colAbs === 1 && boardState[to] === '' &&
            lastPiece === '♙' && Math.floor(lastFrom / 8) === 6 && Math.floor(lastTo / 8) === 4 &&
            to === lastTo + 8 && Math.abs(lastFrom - from) === 1) return true;
    }
    return false;
}

function handleEnPassant(from, to) {
    boardState[to] = boardState[from];
    boardState[from] = '';
    boardState[lastMove.to] = '';
    squares[to].innerHTML = pieceImages[boardState[to]];
    squares[from].innerHTML = '';
    squares[lastMove.to].innerHTML = '';
}

// 폰 승격
function isPawnPromotion(to) {
    const piece = boardState[to];
    return (piece === '♙' && Math.floor(to / 8) === 0) || (piece === '♟' && Math.floor(to / 8) === 7);
}

// 캐슬링
function isValidCastling(from, to) {
    const piece = boardState[from];
    if ((piece !== '♔' && piece !== '♚') || Math.abs(to - from) !== 2) return false;

    if (piece === '♔' && !moved.whiteKing && !isKingInCheck('white')) {
        if (to === 62 && !moved.whiteRightRook && boardState[61] === '' && boardState[62] === '' && !isSquareAttacked(61, 'black')) return true;
        if (to === 58 && !moved.whiteLeftRook && boardState[59] === '' && boardState[58] === '' && boardState[57] === '' && !isSquareAttacked(59, 'black')) return true;
    }
    if (piece === '♚' && !moved.blackKing && !isKingInCheck('black')) {
        if (to === 6 && !moved.blackRightRook && boardState[5] === '' && boardState[6] === '' && !isSquareAttacked(5, 'white')) return true;
        if (to === 2 && !moved.blackLeftRook && boardState[3] === '' && boardState[2] === '' && boardState[1] === '' && !isSquareAttacked(3, 'white')) return true;
    }
    return false;
}

function handleCastling(from, to) {
    if (turn === 'white') {
        if (to === 62) { boardState[62] = '♔'; boardState[61] = '♖'; boardState[60] = ''; boardState[63] = ''; }
        else if (to === 58) { boardState[58] = '♔'; boardState[59] = '♖'; boardState[60] = ''; boardState[56] = ''; }
        squares[62].innerHTML = pieceImages[boardState[62]]; squares[61].innerHTML = pieceImages[boardState[61]];
        squares[58].innerHTML = pieceImages[boardState[58]]; squares[59].innerHTML = pieceImages[boardState[59]];
        squares[60].innerHTML = ''; squares[63].innerHTML = ''; squares[56].innerHTML = '';
    } else {
        if (to === 6) { boardState[6] = '♚'; boardState[5] = '♜'; boardState[4] = ''; boardState[7] = ''; }
        else if (to === 2) { boardState[2] = '♚'; boardState[3] = '♜'; boardState[4] = ''; boardState[0] = ''; }
        squares[6].innerHTML = pieceImages[boardState[6]]; squares[5].innerHTML = pieceImages[boardState[5]];
        squares[2].innerHTML = pieceImages[boardState[2]]; squares[3].innerHTML = pieceImages[boardState[3]];
        squares[4].innerHTML = ''; squares[7].innerHTML = ''; squares[0].innerHTML = '';
    }
}

// 체크 확인
function isKingInCheck(color) {
    const king = color === 'white' ? '♔' : '♚';
    const kingPos = boardState.indexOf(king);
    const opponent = color === 'white' ? 'black' : 'white';

    for (let i = 0; i < 64; i++) {
        if (boardState[i] !== '' && 
            ((opponent === 'white' && boardState[i] >= '♔' && boardState[i] <= '♙') ||
             (opponent === 'black' && boardState[i] >= '♚' && boardState[i] <= '♟'))) {
            if (isValidMove(i, kingPos)) return true;
        }
    }
    return false;
}

function isSquareAttacked(square, byColor) {
    for (let i = 0; i < 64; i++) {
        if (boardState[i] !== '' && 
            ((byColor === 'white' && boardState[i] >= '♔' && boardState[i] <= '♙') ||
             (byColor === 'black' && boardState[i] >= '♚' && boardState[i] <= '♟'))) {
            if (isValidMove(i, square)) return true;
        }
    }
    return false;
}

// 체크메이트 확인
function isCheckmate(color) {
    if (!isKingInCheck(color)) return false;

    for (let from = 0; from < 64; from++) {
        if (boardState[from] !== '' && 
            ((color === 'white' && boardState[from] >= '♔' && boardState[from] <= '♙') ||
             (color === 'black' && boardState[from] >= '♚' && boardState[from] <= '♟'))) {
            for (let to = 0; to < 64; to++) {
                if (isValidMove(from, to) || isValidCastling(from, to)) {
                    const tempBoard = boardState.slice();
                    if (isValidCastling(from, to)) {
                        handleCastling(from, to);
                    } else {
                        boardState[to] = boardState[from];
                        boardState[from] = '';
                        if (isPawnPromotion(to)) boardState[to] = (color === 'white') ? '♕' : '♛';
                    }
                    const stillInCheck = isKingInCheck(color);
                    boardState = tempBoard;
                    if (!stillInCheck) return false;
                }
            }
        }
    }
    return true;
}

// 스테일메이트 확인
function isStalemate(color) {
    if (isKingInCheck(color)) return false;

    for (let from = 0; from < 64; from++) {
        if (boardState[from] !== '' && 
            ((color === 'white' && boardState[from] >= '♔' && boardState[from] <= '♙') ||
             (color === 'black' && boardState[from] >= '♚' && boardState[from] <= '♟'))) {
            for (let to = 0; to < 64; to++) {
                if (isValidMove(from, to) || isValidCastling(from, to)) {
                    const tempBoard = boardState.slice();
                    if (isValidCastling(from, to)) {
                        handleCastling(from, to);
                    } else {
                        boardState[to] = boardState[from];
                        boardState[from] = '';
                        if (isPawnPromotion(to)) boardState[to] = (color === 'white') ? '♕' : '♛';
                    }
                    const stillInCheck = isKingInCheck(color);
                    boardState = tempBoard;
                    if (!stillInCheck) return false;
                }
            }
        }
    }
    return true;
}

// 이동 경로 확인
function isPathClear(from, to) {
    const piece = boardState[from];
    if (piece === '♘' || piece === '♞' || piece === '♔' || piece === '♚') return true;

    const rowFrom = Math.floor(from / 8);
    const colFrom = from % 8;
    const rowTo = Math.floor(to / 8);
    const colTo = to % 8;
    const rowStep = rowTo > rowFrom ? 1 : (rowTo < rowFrom ? -1 : 0);
    const colStep = colTo > colFrom ? 1 : (colTo < colFrom ? -1 : 0);

    let currentRow = rowFrom + rowStep;
    let currentCol = colFrom + colStep;

    while (currentRow !== rowTo || currentCol !== colTo) {
        const index = currentRow * 8 + currentCol;
        if (boardState[index] !== '') return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    return true;
}

function updateMovedStatus(from) {
    const piece = boardState[from];
    if (piece === '♔') moved.whiteKing = true;
    if (piece === '♚') moved.blackKing = true;
    if (piece === '♖' && from === 56) moved.whiteLeftRook = true;
    if (piece === '♖' && from === 63) moved.whiteRightRook = true;
    if (piece === '♜' && from === 0) moved.blackLeftRook = true;
    if (piece === '♜' && from === 7) moved.blackRightRook = true;
}

// 턴 바꾸기
function changeTurn() {
    turnCount++;
    console.log("지금 " + turnCount + "번째 턴이야!");

    turn = turn === 'white' ? 'black' : 'white';
    turnDisplay.textContent = "현재 차례: " + (turn === 'white' ? '백' : '흑');
    phase = 'dice'; // 새 턴 시작 시 주사위 단계
    phaseDisplay.textContent = `상태: 주사위 던지기`;
    rollDiceAnimation().then(() => startTimer()); // 주사위 던지기 시작
}