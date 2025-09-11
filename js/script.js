// Note: Used ChatGPT for assistance with game logic optimization and class structure

const GAME_CONFIG = {
  MIN_BUTTONS: 3,
  MAX_BUTTONS: 7,
  DEFAULT_BUTTONS: 3,
  STARTING_NUMBER: 1,
  BUTTON_WIDTH: 10, // em
  BUTTON_HEIGHT: 5, // em
  SCRAMBLE_INTERVAL: 2000, // ms
  DISPLAY_PAUSE_MULTIPLIER: 1000, // ms
  ANIMATION_DURATION: 500,
  COLORS: [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
  ], // Red, Green, Blue, Yellow, Magenta, Cyan, Orange
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

// Button class to represent individual game buttons
class GameButton {
  constructor(number, color) {
    this.number = number;
    this.color = color;
    this.element = null;
    this.currentPosition = { x: 0, y: 0 };
    this.isClickable = false;
  }

  createElement() {
    this.element = document.createElement("button");
    this.element.className = "game-button";
    this.element.textContent = this.number;
    this.element.style.backgroundColor = this.color;
    this.element.style.left = this.currentPosition.x + "px";
    this.element.style.top = this.currentPosition.y + "px";

    // Add click event listener
    this.element.addEventListener("click", () => {
      if (this.isClickable) {
        game.handleButtonClick(this.number);
      }
    });

    return this.element;
  }

  setPosition(x, y) {
    this.currentPosition = { x, y };
    if (this.element) {
      this.element.style.left = x + "px";
      this.element.style.top = y + "px";
    }
  }

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

  hideNumber() {
    if (this.element) {
      this.element.textContent = "";
    }
  }

  showNumber() {
    if (this.element) {
      this.element.textContent = this.number;
    }
  }

  setClickable(clickable) {
    this.isClickable = clickable;
    if (this.element) {
      this.element.style.cursor = clickable ? "pointer" : "default";
      this.element.style.opacity = clickable ? "1" : "0.8";
    }
  }
}

// Game controller class
class MemoryGame {
  constructor() {
    this.buttons = [];
    this.gameArea = document.getElementById("game-area");
    this.messageArea = document.getElementById("message-area");
    this.currentClickIndex = 0;
    this.isGameActive = false;
    this.isScrambling = false;
  }

  getUniqueColors(count) {
    const availableColors = [...GAME_CONFIG.COLORS];
    const selectedColors = [];

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      selectedColors.push(availableColors[randomIndex]);
      availableColors.splice(randomIndex, 1); // Remove the picked color
    }

    return selectedColors;
  }

  isOverlapping(rect1, rect2, buffer = POSITIONING_CONFIG.MIN_SPACING) {
    return !(
      rect1.right + buffer < rect2.left ||
      rect2.right + buffer < rect1.left ||
      rect1.bottom + buffer < rect2.top ||
      rect2.bottom + buffer < rect1.top
    );
  }

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

  async createButtons(count) {
    this.clearGame();
    this.buttons = [];

    // Get unique colors for all buttons
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

      const element = button.createElement();
      this.gameArea.appendChild(element);

      currentX += buttonWidth + horizontalSpacing;
    });
  }

  async scrambleButtons(count) {
    this.isScrambling = true;
    this.showMessage(MESSAGES.SCRAMBLING);

    for (let i = 0; i < count; i++) {
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

  startMemoryTest() {
    this.buttons.forEach((button) => {
      button.hideNumber();
      button.setClickable(true);
    });

    this.showMessage(MESSAGES.CLICK_IN_ORDER);
    this.isGameActive = true;
    this.currentClickIndex = 0;
  }

  waitForTime(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  clearGame() {
    this.gameArea.innerHTML = "";
    this.messageArea.textContent = "";
    this.buttons = [];
    this.currentClickIndex = 0;
    this.isGameActive = false;
    this.isScrambling = false;
  }

  showMessage(message, className = "") {
    this.messageArea.textContent = message;
    this.messageArea.className = className;
  }

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

  revealAllNumbers() {
    this.buttons.forEach((button) => {
      button.showNumber();
      button.setClickable(false);
    });
  }
}

// Input validator class
class InputValidator {
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

// Initialize game
let game;

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

async function startGame() {
  const input = document.getElementById("buttonCount").value;
  const buttonCount = InputValidator.validateButtonCount(input);
  document.getElementById("buttonCount").value = buttonCount;

  await game.createButtons(buttonCount);
}
