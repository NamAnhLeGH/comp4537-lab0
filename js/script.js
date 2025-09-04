// Main script file: js/script.js
// Note: Using ChatGPT for code structure assistance

// Constants
const MIN_BUTTONS = 3;
const MAX_BUTTONS = 7;
const BUTTON_WIDTH = 160; // 10em in pixels (approximately)
const BUTTON_HEIGHT = 80; // 5em in pixels (approximately)
const SCRAMBLE_INTERVAL = 2000; // 2 seconds
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// Button class for individual game buttons
class GameButton {
    constructor(order, color) {
        this.order = order;
        this.originalOrder = order;
        this.color = color;
        this.element = null;
        this.isClickable = false;
        this.currentPosition = { x: 0, y: 0 };
        this.createButton();
    }

    createButton() {
        this.element = document.createElement('button');
        this.element.className = 'game-button';
        this.element.style.backgroundColor = this.color;
        this.element.style.width = '10em';
        this.element.style.height = '5em';
        this.element.style.position = 'absolute';
        this.element.textContent = this.order;
        this.element.addEventListener('click', () => this.handleClick());
    }

    setPosition(x, y) {
        this.currentPosition = { x, y };
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    makeClickable() {
        this.isClickable = true;
        this.element.classList.add('clickable');
        this.element.style.cursor = 'pointer';
    }

    makeUnclickable() {
        this.isClickable = false;
        this.element.classList.remove('clickable');
        this.element.style.cursor = 'default';
    }

    hideNumber() {
        this.element.textContent = '';
    }

    showNumber() {
        this.element.textContent = this.order;
    }

    handleClick() {
        if (this.isClickable && window.game) {
            window.game.handleButtonClick(this);
        }
    }

    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Position manager class for handling button positioning
class PositionManager {
    constructor() {
        this.gameArea = document.getElementById('game-area');
    }

    getWindowDimensions() {
        const rect = this.gameArea.getBoundingClientRect();
        return {
            width: rect.width - BUTTON_WIDTH,
            height: rect.height - BUTTON_HEIGHT
        };
    }

    getInitialPositions(buttonCount) {
        const positions = [];
        const startX = 20;
        const startY = 20;
        const spacing = BUTTON_WIDTH + 20;

        for (let i = 0; i < buttonCount; i++) {
            positions.push({
                x: startX + (i * spacing),
                y: startY
            });
        }
        return positions;
    }

    getRandomPosition() {
        const dimensions = this.getWindowDimensions();
        return {
            x: Math.floor(Math.random() * Math.max(0, dimensions.width)),
            y: Math.floor(Math.random() * Math.max(0, dimensions.height))
        };
    }
}

// Main game class
class MemoryGame {
    constructor() {
        this.buttons = [];
        this.currentClickIndex = 0;
        this.gameState = 'idle'; // 'idle', 'displaying', 'scrambling', 'playing', 'ended'
        this.positionManager = new PositionManager();
        this.scrambleCount = 0;
        this.maxScrambles = 0;
        this.initializeEventListeners();
        this.initializeUI();
    }

    initializeUI() {
        document.getElementById('button-count-label').textContent = MESSAGES.BUTTON_COUNT_LABEL;
    }

    initializeEventListeners() {
        document.getElementById('go-button').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('button-count').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startNewGame();
            }
        });
    }

    startNewGame() {
        const buttonCount = this.getValidatedButtonCount();
        if (buttonCount === null) return;

        this.resetGame();
        this.createButtons(buttonCount);
        this.displayInitialButtons();
        this.scheduleScrambling(buttonCount);
    }

    getValidatedButtonCount() {
        const input = document.getElementById('button-count');
        const value = parseInt(input.value);

        if (isNaN(value) || value < MIN_BUTTONS || value > MAX_BUTTONS) {
            this.displayMessage(MESSAGES.INVALID_INPUT, 'error-message');
            return null;
        }
        return value;
    }

    resetGame() {
        this.buttons.forEach(button => button.remove());
        this.buttons = [];
        this.currentClickIndex = 0;
        this.gameState = 'idle';
        this.scrambleCount = 0;
        this.clearMessage();
    }

    createButtons(count) {
        for (let i = 1; i <= count; i++) {
            const color = COLORS[(i - 1) % COLORS.length];
            const button = new GameButton(i, color);
            this.buttons.push(button);
            document.getElementById('game-area').appendChild(button.element);
        }
    }

    displayInitialButtons() {
        this.gameState = 'displaying';
        const positions = this.positionManager.getInitialPositions(this.buttons.length);
        
        this.buttons.forEach((button, index) => {
            button.setPosition(positions[index].x, positions[index].y);
            button.makeUnclickable();
            button.showNumber();
        });

        this.displayMessage(MESSAGES.GAME_INSTRUCTIONS);
    }

    scheduleScrambling(buttonCount) {
        this.maxScrambles = buttonCount;
        
        // Wait for the initial display period
        setTimeout(() => {
            this.gameState = 'scrambling';
            this.scrambleButtons();
        }, buttonCount * 1000);
    }

    scrambleButtons() {
        if (this.scrambleCount >= this.maxScrambles) {
            this.startGamePhase();
            return;
        }

        // Get fresh window dimensions before each scramble
        const dimensions = this.positionManager.getWindowDimensions();
        
        // Move each button to a new random position within bounds
        this.buttons.forEach(button => {
            const newPosition = this.positionManager.getRandomPosition();
            button.setPosition(newPosition.x, newPosition.y);
        });

        this.scrambleCount++;
        
        // Schedule next scramble
        setTimeout(() => {
            this.scrambleButtons();
        }, SCRAMBLE_INTERVAL);
    }

    startGamePhase() {
        this.gameState = 'playing';
        this.buttons.forEach(button => {
            button.hideNumber();
            button.makeClickable();
        });
        this.displayMessage(MESSAGES.CLICK_IN_ORDER);
    }

    handleButtonClick(clickedButton) {
        if (this.gameState !== 'playing') return;

        const expectedOrder = this.currentClickIndex + 1;
        
        if (clickedButton.originalOrder === expectedOrder) {
            // Correct button clicked
            clickedButton.showNumber();
            clickedButton.makeUnclickable();
            this.currentClickIndex++;

            if (this.currentClickIndex === this.buttons.length) {
                // All buttons clicked correctly
                this.gameState = 'ended';
                this.displayMessage(MESSAGES.EXCELLENT_MEMORY, 'success-message');
            }
        } else {
            // Wrong button clicked
            this.gameState = 'ended';
            this.revealAllButtons();
            this.displayMessage(MESSAGES.WRONG_ORDER, 'error-message');
        }
    }

    revealAllButtons() {
        this.buttons.forEach(button => {
            button.showNumber();
            button.makeUnclickable();
        });
    }

    displayMessage(message, className = '') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.className = className;
    }

    clearMessage() {
        const messageElement = document.getElementById('message');
        messageElement.textContent = '';
        messageElement.className = '';
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryGame();
});