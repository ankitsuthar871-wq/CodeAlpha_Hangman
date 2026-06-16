# Cyber Hangman 3D 🎮🤖

A premium, full-stack **3D Hangman game** built with a **Python (Flask) backend** and an interactive **Three.js + HTML/CSS/JS frontend**. Designed with a high-end cyber/synthwave theme, glassmorphism UI components, responsive layout, and synthesized sound effects, this project demonstrates professional engineering practices for recruiter review.

---

## ✨ Features

1. **Immersive 3D Graphics (Three.js)**:
   - Real-time 3D rendering of the wooden gallows and the hangman character.
   - Interactive orbit controls allowing players to drag to rotate and scroll to zoom in the 3D space.
   - Smooth, animated transitions: body parts scale up dynamically when incorrect guesses occur.
   - Unique animations for game states (swinging idle motion, floating celebratory victory dance, dead red neon light on defeat).

2. **Secure Backend-Driven Logic (Python & Flask)**:
   - Secret word selection, guess evaluation, and remaining attempts are processed securely on the server-side.
   - Prevents cheating (no secret word data is sent to the client or exposed in HTML source / Network inspector until the game finishes).
   - Keeps track of game states dynamically in server sessions.

3. **Persistent SQLite Leaderboard**:
   - Stores game statistics (Agent username, wins, losses, and active win streaks) in an SQLite database.
   - Display of the top player records directly in a clean table in the terminal dashboard.

4. **Synthesized Web Audio SFX**:
   - Uses the native browser Web Audio API to synthesize retro 8-bit sound effects (success chime, buzzer, victory arpeggio, defeat sweep) in real-time.
   - High performance with zero external asset loading dependencies.

5. **Responsive Glassmorphism UI**:
   - A cybernetic dark-mode dashboard styled with CSS glassmorphism features (`backdrop-filter`).
   - Adapts to mobile/desktop screens (desktop places controls side-by-side with the 3D model; mobile stacks them vertically).
   - Supports both physical and virtual keyboards with visual state markings.

---

## 🛠️ Architecture & Tech Stack

```
hangman_game/
├── app.py              # Flask server, session routing, API endpoints
├── database.py         # SQLite connection setup, schema init, data seeding & queries
├── hangman.db          # Auto-generated SQLite database
├── templates/
│   └── index.html      # Main page setup, HTML structure, CDN scripts
├── static/
│   ├── css/
│   │   └── style.css   # Neon-cyber styles, responsive layout rules
│   └── js/
│       ├── renderer.js # Three.js render loops, materials, gallows meshes, animations
│       └── game.js     # Sound synthesis, network fetch services, keyboard bindings
└── README.md           # Documentation
```

- **Backend**: Python 3, Flask, SQLite3
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism), Vanilla JavaScript, Three.js (via CDN), OrbitControls (via CDN)

---

## 🚀 Installation & Local Run

Follow these simple steps to run the game locally:

### 1. Prerequisites
Make sure you have **Python 3** installed on your system.

### 2. Install Dependencies
Install Flask (the only required external library):
```bash
pip install flask
```

### 3. Initialize & Start the Server
Run the Flask server. This will automatically set up and seed the database if it doesn't already exist:
```bash
python app.py
```

### 4. Play the Game
Open your web browser and navigate to:
```
http://localhost:5000
```

---

## 🧑‍💻 Design Decisions & Technical Excellence (For Interviewers)

- **Security Focus**: Instead of choosing the easy route of running the entire game in JavaScript (exposing the word to the DOM/network logs), we designed a RESTful architecture where the client is merely an interface. The backend validates attempts, maintaining secure sessions.
- **Asset Independence**: To avoid latency, HTTP request overhead, and broken links, sound effects are generated programmatically on-the-fly using the oscillator nodes of the browser's Web Audio API.
- **Resource Management**: Uses Three.js primitives and standard materials to deliver high-quality 3D visual fidelity without large `.gltf` or `.obj` 3D model download requirements, keeping the application lightweight, quick to load, and extremely responsive.
- **Relational Integrity**: Utilizes SQLite database schemas to securely manage and persist usernames, tracking win percentages and streaks without data loss on server restart.
