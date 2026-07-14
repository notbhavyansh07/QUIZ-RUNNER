# 🏃 QuizRunner — Run Fast, Think Faster!

A browser-based quiz runner game inspired by Subway Surfers. Run down the track, dodge wrong answers, and prove your brain is lightning fast!

---

## 🎮 How to Play

| Control | Action |
|---------|--------|
| `A` or `←` | Move left |
| `D` or `→` | Move right |
| Swipe left/right | Mobile movement |

- A question appears at the top of the screen
- Three answer cards drop down — one in each lane (left, center, right)
- **Run into the correct answer** to score points!
- **Wrong answer = Game Over** 💀
- Combos multiply your score 🔥
- Speed increases every 5 correct answers 🚀

---

## 🚀 How to Run

### Method 1 — Just Double-Click (Easiest)
1. Navigate to the project folder
2. Double-click `index.html`
3. It opens in your browser — done!

### Method 2 — Using VS Code Live Server
1. Install [VS Code](https://code.visualstudio.com/)
2. Install the **Live Server** extension
3. Open the project folder in VS Code
4. Right-click `index.html` → **Open with Live Server**

### Method 3 — Using Python (no install needed)
```bash
# In the project folder, run:
python -m http.server 8080
# Then open: http://localhost:8080
```

---

## 📁 Folder Structure

```
QuizRunner/
├── index.html          ← Entry point — open this to play!
├── README.md           ← You are here
│
├── css/
│   └── style.css       ← All styling, animations, responsive design
│
├── js/
│   ├── audio.js        ← Sound effects via Web Audio API (no files needed!)
│   └── game.js         ← Core game engine (physics, collision, scoring)
│
└── data/
    └── questions.js    ← Question bank — add your own questions here!
```

---

## ➕ Adding Your Own Questions

Edit `data/questions.js` and add to the `QUESTIONS` array:

```js
{
  question: "Your question text here?",
  image: null,           // or "https://..." for an image
  options: ["Wrong 1", "Correct", "Wrong 2"],
  correctIndex: 1,       // 0=first, 1=second, 2=third option
  category: "Science"    // shown above the question
}
```

> **Note:** The options are automatically shuffled each game, so the correct answer will appear in a random lane every time!

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🏃 Subway Surfers style | Auto-run with left/right lane switching |
| ❓ 20 built-in questions | Math, Science, Geography, General Knowledge |
| 🔀 Random shuffle | Options shuffle every question |
| 💯 Score system | 100pts × combo multiplier |
| 🪙 Coins | Earned per correct answer, more at higher levels |
| 🔥 Combo system | Chain correct answers for score multipliers |
| 📈 5 levels | Rookie → Explorer → Pro → Elite → Legend |
| 🚄 Speed increase | Gets faster every 5 correct answers |
| 🎵 Sound effects | Web Audio API — no sound files needed |
| 🎊 Particle effects | CSS particle burst on correct answers |
| 📱 Mobile ready | Touch swipe + on-screen buttons |
| 🖥️ Desktop ready | Keyboard (A/D or Arrow keys) |
| 🎨 Dark mode UI | Premium glassmorphism design |

---

## 🖥️ Tech Stack

- **HTML5** — Structure & semantics
- **CSS3** — Animations, glassmorphism, responsive design
- **Vanilla JavaScript** — Zero dependencies, no frameworks
- **Web Audio API** — Procedurally generated sound effects
- **Inline SVG** — Animated character (no image files needed)

No npm, no build step, no dependencies. Just open `index.html`!

---

## 🛠️ Customization Ideas

- Change `SPEED_LEVELS` in `game.js` to adjust difficulty
- Edit `CORRECT_MSGS` and `WRONG_MSGS` for custom feedback messages
- Set `nextLevelAt` in `State` to change how often speed increases
- Add questions with images by setting `image: "https://your-url.jpg"`

---

## 🎯 Scoring

```
Score = 100 × combo_multiplier
Coins = base_coins × min(combo, 3)
```

| Combo | Multiplier |
|-------|-----------|
| 1x | Normal score |
| 2x | 2× score + 2× coins |
| 3x+ | 3× score + 3× coins |

---

Made with ❤️ — No frameworks, pure HTML/CSS/JS!
