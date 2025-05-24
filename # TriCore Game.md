# TriCore Game

**Live Demo:** [Play TriCore Game](https://surajsk2003.github.io/Tricore/) <!-- Replace with your actual live demo link if different -->

## Overview
TriCore is a 2-player strategic triangle-placement game played on a 9×9 hexagonal board. Players take turns placing triangle-shaped pieces that point in different directions. The goal is to earn points by forming larger structures like hexagons, triangle clusters, and capturing central zones called fortresses.

## Game Rules

### Players
*   **Player 1:** Red Triangles 🔺
*   **Player 2:** Blue Triangles 🔻 (or Computer in AI mode)

### Triangle Orientations
Each triangle has one of six orientations:
*   🔺 Pointing Up (default)
*   🔻 Pointing Down
*   ◀️ Pointing Left
*   ▶️ Pointing Right
*   🔼 Pointing Top-left
*   🔽 Pointing Bottom-right

### Gameplay
1.  Select game mode: Human vs Human or Human vs Computer.
2.  Players take turns placing triangles on empty hexagonal cells.
3.  Choose the orientation of your triangle before placing it.
4.  Once placed, triangles cannot be moved (unless using the undo feature).
5.  After each placement, the game checks for scoring patterns.

### Scoring
*   **Hexagon Completion (6 points):** Form a perfect hexagon with 6 triangles of the same color.
*   **Macro Triangle (4 points):** Form a large triangle with 3 triangles of the same color pointing in the same direction.
*   **Fortress Capture (10 points):** Surround a central fortress zone with your triangles.

### Game End
The game ends when:
*   All cells are filled, OR
*   A player reaches 50 points, OR
*   A player resigns (this feature is not currently implemented).

The player with the highest score wins. In case of a tie, the player who made more hexagons wins.

## Features
*   Two game modes: Human vs Human and Human vs Computer.
*   Interactive hexagonal game board.
*   Six different triangle orientations.
*   Visual indicators for completed scoring patterns.
*   Undo functionality to revert the last move.
*   Animated background.
*   Comprehensive rules section accessible in-game.
*   Responsive design (basic).

## Technical Details

### Technologies Used
*   HTML5
*   CSS3 (with animations)
*   JavaScript (ES6+)
*   Google Fonts (Poppins)

### Game Architecture
*   **Board Representation:** 9×9 grid of hexagonal cells.
*   **Player Tokens:** Triangular pieces with 6 possible orientations.
*   **Scoring Detection:** Algorithms to detect hexagons, macro triangles, and fortress captures.
*   **Computer AI:** Random move generator (in Human vs Computer mode).

### Key Implementation Details
*   Hexagonal grid implementation using CSS.
*   Triangle orientation using CSS transforms.
*   Game state management in JavaScript.
*   Pattern detection algorithms for scoring.
*   Modal system for game mode selection and rules.

## Development

### Prerequisites
*   A modern web browser with JavaScript enabled.

### Local Setup
1.  Clone the repository:
    ```bash
    git clone https://github.com/surajsk2003/Tricore.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd Tricore
    ```
3.  Open `index.html` in your web browser.

### Project Structure
*   `index.html` - Main HTML file with game structure.
*   `styles.css` - CSS styling including hexagonal grid and animations.
*   `script.js` - Game logic and interactive functionality.

## Future Improvements
*   Enhanced computer AI with strategic decision-making.
*   More robust mobile-optimized responsive design.
*   Local game state saving (e.g., using localStorage).
*   Online multiplayer functionality.
*   Additional scoring patterns or game mechanics.
*   Customizable board sizes or themes.

## Credits
*   Developed by Surajsk2003
*   Hexagonal grid inspiration from various open-source projects.
*   Icon design and game concept developed independently.

## License
This project is available under the MIT License. See the `LICENSE` file for more details. (You'll need to create a `LICENSE` file if you haven't already, typically containing the MIT License text).