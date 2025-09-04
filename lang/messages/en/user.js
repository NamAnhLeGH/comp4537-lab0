// Messages file: lang/messages/en/user.js
// Note: Using ChatGPT for code structure assistance

const MESSAGES = {
    BUTTON_COUNT_LABEL: "How many buttons to create?",
    INVALID_INPUT: "Please enter a number between 3 and 7",
    EXCELLENT_MEMORY: "Excellent memory!",
    WRONG_ORDER: "Wrong order!",
    GAME_INSTRUCTIONS: "Remember the order of the buttons!",
    CLICK_IN_ORDER: "Click the buttons in their original order"
};

// Export messages for use in main script
if (typeof window !== 'undefined') {
    window.MESSAGES = MESSAGES;
}