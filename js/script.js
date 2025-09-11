const GAME_CONFIG = {
  MIN_BUTTONS: 3,
  MAX_BUTTONS: 7,
  DEFAULT_BUTTONS: 3,
  STARTING_NUMBER: 1,
  BUTTON_WIDTH: 10,
  BUTTON_HEIGHT: 5,
  SCRAMBLE_INTERVAL: 2000,
  DISPLAY_PAUSE_MULTIPLIER: 1000,
  ANIMATION_DURATION: 500,
  COLORS: [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
  ],
};

const POSITIONING_CONFIG = {
  HORIZONTAL_SPACING: 50,
  VERTICAL_SPACING: 40,
  LEFT_MARGIN: 40,
  SIDE_MARGIN: 30,
  TOP_BOTTOM_MARGIN: 20,
  MIN_SPACING: 15,
  INITIAL_Y_OFFSET: 180,
  MAX_ATTEMPTS: 50,
};

// Game button representation
class GameButton {
  constructor(number, color) {
    this.number = number;
    this.color = color;
    this.element = null;
    this.originalPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };
    this.isClickable = false;
  }

  // Create DOM element
  createElement() {
    this.element = document.createElement("button");
    this.element.className = "game-button";
    this.element.textContent = this.number;
    this.element.style.backgroundColor = this.color;
    this.element.style.left = this.currentPosition.x + "px";
    this.element.style.top = this.currentPosition.y + "px";

    this.element.addEventListener("click", () => {
      if (this.isClickable) {
        game.handleButtonClick(this.number);
      }
    });

    return this.element;
  }

  // Set button position
  setPosition(x, y) {
    this.currentPosition = { x, y };
    if (this.element) {
      this.element.style.left = x + "px";
      this.element.style.top = y + "px";
    }
  }

  // Store original position
  setOriginalPosition(x, y) {
    this.originalPosition = { x, y };
  }

  // Animate to position
  animateToPosition(x, y) {
    return new Promise((resolve) => {
      if (this.element) {
        this.element.style.transition = "all 0.5s ease-in-out";
        this.setPosition(x, y);
        setTimeout(resolve, GAME_CONFIG.ANIMATION_DURATION);
      } else {
        resolve();
      }
    });
  }

  // Hide button number
  hideNumber() {
    if (this.element) {
      this.element.textContent = "";
    }
  }

  // Show button number
  showNumber() {
    if (this.element) {
      this.element.textContent = this.number;
    }
  }

  // Set clickable state
  setClickable(clickable) {
    this.isClickable = clickable;
    if (this.element) {
      this.element.style.cursor = clickable ? "pointer" : "default";
      this.element.style.opacity = clickable ? "1" : "0.8";
    }
  }
}

// Main game controller
class MemoryGame {
  constructor() {
    this.buttons = [];
    this.gameArea = document.getElementById("game-area");
    this.messageArea = document.getElementById("message-area");
    this.currentClickIndex = 0;
    this.isGameActive = false;
    this.isScrambling = false;
  }

  // Get unique colors
  getUniqueColors(count) {
    const availableColors = [...GAME_CONFIG.COLORS];
    const selectedColors = [];

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      selectedColors.push(availableColors[randomIndex]);
      availableColors.splice(randomIndex, 1);
    }

    return selectedColors;
  }

  // Get window dimensions
  getWindowDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  // Check button overlap
  isOverlapping(rect1, rect2, buffer = POSITIONING_CONFIG.MIN_SPACING) {
    return !(
      rect1.right + buffer < rect2.left ||
      rect2.right + buffer < rect1.left ||
      rect1.bottom + buffer < rect2.top ||
      rect2.bottom + buffer < rect1.top
    );
  }

  // Get button bounds
  getButtonBounds(x, y) {
    const fontSize = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    const buttonWidth = GAME_CONFIG.BUTTON_WIDTH * fontSize;
    const buttonHeight = GAME_CONFIG.BUTTON_HEIGHT * fontSize;

    return {
      left: x,
      top: y,
      right: x + buttonWidth,
      bottom: y + buttonHeight,
    };
  }

  // Random non-overlapping position
  getRandomPositionNoOverlap(existingPositions = []) {
    const fontSize = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    const buttonWidth = GAME_CONFIG.BUTTON_WIDTH * fontSize;
    const buttonHeight = GAME_CONFIG.BUTTON_HEIGHT * fontSize;

    const gameArea = this.gameArea;
    const gameAreaRect = gameArea.getBoundingClientRect();

    const sideMargin = POSITIONING_CONFIG.SIDE_MARGIN;
    const topBottomMargin = POSITIONING_CONFIG.TOP_BOTTOM_MARGIN;
    const minSpacing = POSITIONING_CONFIG.MIN_SPACING;

    const safeWidth = gameAreaRect.width - sideMargin * 2 - buttonWidth;
    const safeHeight = gameAreaRect.height - topBottomMargin * 2 - buttonHeight;

    const maxX = Math.max(0, safeWidth);
    const maxY = Math.max(0, safeHeight);

    let attempts = 0;
    const maxAttempts = POSITIONING_CONFIG.MAX_ATTEMPTS;

    while (attempts < maxAttempts) {
      const randomX = sideMargin + Math.random() * maxX;
      const randomY = topBottomMargin + Math.random() * maxY;

      const newBounds = this.getButtonBounds(randomX, randomY);
      let hasOverlap = false;

      for (const existingPos of existingPositions) {
        const existingBounds = this.getButtonBounds(
          existingPos.x,
          existingPos.y
        );
        if (this.isOverlapping(newBounds, existingBounds, minSpacing)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        return { x: randomX, y: randomY };
      }

      attempts++;
    }

    return {
      x: sideMargin + Math.random() * maxX,
      y: topBottomMargin + Math.random() * maxY,
    };
  }

  // Get random position
  getRandomPosition() {
    const fontSize = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    const buttonWidth = GAME_CONFIG.BUTTON_WIDTH * fontSize;
    const buttonHeight = GAME_CONFIG.BUTTON_HEIGHT * fontSize;

    const gameArea = this.gameArea;
    const gameAreaRect = gameArea.getBoundingClientRect();

    const sideMargin = POSITIONING_CONFIG.SIDE_MARGIN;
    const topBottomMargin = POSITIONING_CONFIG.TOP_BOTTOM_MARGIN;

    const safeWidth = gameAreaRect.width - sideMargin * 2 - buttonWidth;
    const safeHeight = gameAreaRect.height - topBottomMargin * 2 - buttonHeight;

    const maxX = Math.max(0, safeWidth);
    const maxY = Math.max(0, safeHeight);

    const randomX = sideMargin + Math.random() * maxX;
    const randomY = topBottomMargin + Math.random() * maxY;

    return {
      x: randomX,
      y: randomY,
    };
  }

  // Create game buttons
  async createButtons(count) {
    this.clearGame();
    this.buttons = [];

    const uniqueColors = this.getUniqueColors(count);

    for (let i = 0; i < count; i++) {
      const buttonNumber = GAME_CONFIG.STARTING_NUMBER + i;
      const button = new GameButton(buttonNumber, uniqueColors[i]);
      this.buttons.push(button);
    }

    this.displayButtonsInRow();
    this.showMessage(MESSAGES.MEMORIZE_POSITIONS);

    await this.waitForTime(count * GAME_CONFIG.DISPLAY_PAUSE_MULTIPLIER);
    await this.scrambleButtons(count);
    this.startMemoryTest();
  }

  // Display buttons row
  displayButtonsInRow() {
    const fontSize = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    const buttonWidth = GAME_CONFIG.BUTTON_WIDTH * fontSize;
    const buttonHeight = GAME_CONFIG.BUTTON_HEIGHT * fontSize;
    const horizontalSpacing = POSITIONING_CONFIG.HORIZONTAL_SPACING;
    const verticalSpacing = POSITIONING_CONFIG.VERTICAL_SPACING;
    const leftMargin = POSITIONING_CONFIG.LEFT_MARGIN;

    let currentX = leftMargin;
    let currentY = POSITIONING_CONFIG.INITIAL_Y_OFFSET;

    const availableWidth = window.innerWidth - leftMargin * 2;
    const maxAllowedX = availableWidth - buttonWidth;

    this.buttons.forEach((button, index) => {
      if (currentX > maxAllowedX && index > 0) {
        currentX = leftMargin;
        currentY += buttonHeight + verticalSpacing;
      }

      button.setPosition(currentX, currentY);
      button.setOriginalPosition(currentX, currentY);

      const element = button.createElement();
      this.gameArea.appendChild(element);

      currentX += buttonWidth + horizontalSpacing;
    });
  }

  // Scramble button positions
  async scrambleButtons(count) {
    this.isScrambling = true;
    this.showMessage(MESSAGES.SCRAMBLING);

    for (let i = 0; i < count; i++) {
      this.getWindowDimensions();

      const newPositions = [];
      for (let j = 0; j < this.buttons.length; j++) {
        const newPos = this.getRandomPositionNoOverlap(newPositions);
        newPositions.push(newPos);
      }

      const scramblePromises = this.buttons.map((button, index) => {
        return button.animateToPosition(
          newPositions[index].x,
          newPositions[index].y
        );
      });

      await Promise.all(scramblePromises);

      if (i < count - 1) {
        await this.waitForTime(GAME_CONFIG.SCRAMBLE_INTERVAL);
      }
    }

    this.isScrambling = false;
  }

  // Start memory test
  startMemoryTest() {
    this.buttons.forEach((button) => {
      button.hideNumber();
      button.setClickable(true);
    });

    this.showMessage(MESSAGES.CLICK_IN_ORDER);
    this.isGameActive = true;
    this.currentClickIndex = 0;
  }

  // Wait for time
  waitForTime(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  // Clear game area
  clearGame() {
    this.gameArea.innerHTML = "";
    this.messageArea.textContent = "";
    this.buttons = [];
    this.currentClickIndex = 0;
    this.isGameActive = false;
    this.isScrambling = false;
  }

  // Show game message
  showMessage(message, className = "") {
    this.messageArea.textContent = message;
    this.messageArea.className = className;
  }

  // Handle button clicks
  handleButtonClick(buttonNumber) {
    if (!this.isGameActive || this.isScrambling) {
      return;
    }

    const expectedNumber = this.currentClickIndex + GAME_CONFIG.STARTING_NUMBER;

    if (buttonNumber === expectedNumber) {
      const button = this.buttons.find((b) => b.number === buttonNumber);
      button.showNumber();
      button.setClickable(false);
      this.currentClickIndex++;

      if (this.currentClickIndex === this.buttons.length) {
        this.showMessage(MESSAGES.EXCELLENT_MEMORY, "success-message");
        this.isGameActive = false;
      }
    } else {
      this.showMessage(MESSAGES.WRONG_ORDER, "error-message");
      this.revealAllNumbers();
      this.isGameActive = false;
    }
  }

  // Reveal all numbers
  revealAllNumbers() {
    this.buttons.forEach((button) => {
      button.showNumber();
      button.setClickable(false);
    });
  }
}

// Input validation utility
class InputValidator {
  // Validate button count
  static validateButtonCount(input) {
    let num = parseInt(input);

    if (isNaN(num)) {
      return GAME_CONFIG.DEFAULT_BUTTONS;
    }

    if (num < GAME_CONFIG.MIN_BUTTONS) {
      return GAME_CONFIG.MAX_BUTTONS;
    }

    if (num > GAME_CONFIG.MAX_BUTTONS) {
      return GAME_CONFIG.MIN_BUTTONS;
    }

    return num;
  }
}

let game;

// Initialize game setup
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("input-label").textContent = MESSAGES.INPUT_LABEL;
  document.getElementById("buttonCount").value = GAME_CONFIG.DEFAULT_BUTTONS;

  game = new MemoryGame();

  document.getElementById("goButton").addEventListener("click", startGame);
  document
    .getElementById("buttonCount")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        startGame();
      }
    });
});

// Start game function
async function startGame() {
  const input = document.getElementById("buttonCount").value;
  const buttonCount = InputValidator.validateButtonCount(input);
  document.getElementById("buttonCount").value = buttonCount;

  await game.createButtons(buttonCount);
}
