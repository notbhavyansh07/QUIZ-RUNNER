// ============================================================
// questions.js — Question Bank for QuizRunner
// Add your own questions here in the same format!
// ============================================================

const QUESTIONS = [

  // ── 📸 Image Questions ─────────────────────────────────────
  {
    question: "Which planet is shown CLOSEST to the Sun?",
    image: "images/solar_system.png",
    options: ["Venus", "Mars", "Mercury"],
    correctIndex: 2,
    category: "🌍 Science",
    difficulty: "easy"
  },
  {
    question: "In which CITY is this famous landmark?",
    image: "images/eiffel_tower.png",
    options: ["London", "Paris", "Rome"],
    correctIndex: 1,
    category: "🗺️ Geography",
    difficulty: "easy"
  },
  {
    question: "What formula does this diagram show?",
    image: "images/pythagoras.png",
    options: ["Euler's Formula", "Pythagorean Theorem", "Quadratic Formula"],
    correctIndex: 1,
    category: "📐 Math",
    difficulty: "medium"
  },
  {
    question: "What is the chemical symbol of this element?",
    image: "images/gold_element.png",
    options: ["Go", "Au", "Ag"],
    correctIndex: 1,
    category: "⚗️ Chemistry",
    difficulty: "medium"
  },

  // ── 🔢 Math ────────────────────────────────────────────────
  { question: "What is 2 + 2?",           image: null, options: ["3","4","5"],          correctIndex: 1, category: "🔢 Math", difficulty: "easy" },
  { question: "What is 7 × 8?",           image: null, options: ["54","56","64"],        correctIndex: 1, category: "🔢 Math", difficulty: "medium" },
  { question: "What is √144?",            image: null, options: ["11","13","12"],         correctIndex: 2, category: "🔢 Math", difficulty: "medium" },
  { question: "What is 15% of 200?",      image: null, options: ["25","30","35"],        correctIndex: 1, category: "🔢 Math", difficulty: "medium" },
  { question: "What is 2⁸?",             image: null, options: ["128","256","512"],      correctIndex: 1, category: "🔢 Math", difficulty: "hard" },
  { question: "What is 12 × 12?",         image: null, options: ["124","144","164"],     correctIndex: 1, category: "🔢 Math", difficulty: "easy" },
  { question: "What is 100 ÷ 4?",         image: null, options: ["20","25","30"],        correctIndex: 1, category: "🔢 Math", difficulty: "easy" },
  { question: "What is the value of π (pi) approx?", image: null, options: ["3.14","2.71","1.61"], correctIndex: 0, category: "🔢 Math", difficulty: "easy" },
  { question: "What is 9²?",              image: null, options: ["72","81","90"],         correctIndex: 1, category: "🔢 Math", difficulty: "easy" },
  { question: "Prime number between 10–15?", image: null, options: ["12","11","14"],    correctIndex: 1, category: "🔢 Math", difficulty: "hard" },

  // ── 🔬 Science ─────────────────────────────────────────────
  { question: "What planet is closest to the Sun?",    image: null, options: ["Venus","Earth","Mercury"],       correctIndex: 2, category: "🔬 Science", difficulty: "easy" },
  { question: "Chemical symbol for Gold?",             image: null, options: ["Go","Au","Ag"],                  correctIndex: 1, category: "🔬 Science", difficulty: "easy" },
  { question: "How many bones in the adult body?",     image: null, options: ["196","206","216"],               correctIndex: 1, category: "🔬 Science", difficulty: "medium" },
  { question: "What gas do plants absorb?",            image: null, options: ["Oxygen","Nitrogen","CO₂"],       correctIndex: 2, category: "🔬 Science", difficulty: "easy" },
  { question: "Speed of light (approx)?",              image: null, options: ["3×10⁸ m/s","3×10⁶ m/s","3×10⁵ m/s"], correctIndex: 0, category: "🔬 Science", difficulty: "hard" },
  { question: "What is the powerhouse of the cell?",   image: null, options: ["Nucleus","Mitochondria","Ribosome"], correctIndex: 1, category: "🔬 Science", difficulty: "easy" },
  { question: "How many planets in our solar system?", image: null, options: ["7","8","9"],                    correctIndex: 1, category: "🔬 Science", difficulty: "easy" },
  { question: "What is H₂O?",                         image: null, options: ["Hydrogen","Water","Oxygen"],     correctIndex: 1, category: "🔬 Science", difficulty: "easy" },
  { question: "Closest star to Earth?",                image: null, options: ["Sirius","Proxima Centauri","The Sun"], correctIndex: 2, category: "🔬 Science", difficulty: "medium" },
  { question: "Which blood type is universal donor?",  image: null, options: ["A","O-","AB+"],                 correctIndex: 1, category: "🔬 Science", difficulty: "hard" },

  // ── 🗺️ Geography ──────────────────────────────────────────
  { question: "Capital of Japan?",                     image: null, options: ["Osaka","Tokyo","Kyoto"],         correctIndex: 1, category: "🗺️ Geography", difficulty: "easy" },
  { question: "Longest river in the world?",           image: null, options: ["Amazon","Nile","Yangtze"],       correctIndex: 1, category: "🗺️ Geography", difficulty: "easy" },
  { question: "Country with most natural lakes?",      image: null, options: ["Russia","USA","Canada"],         correctIndex: 2, category: "🗺️ Geography", difficulty: "hard" },
  { question: "Smallest country in the world?",        image: null, options: ["Monaco","Vatican City","San Marino"], correctIndex: 1, category: "🗺️ Geography", difficulty: "medium" },
  { question: "Largest country by area?",              image: null, options: ["China","USA","Russia"],          correctIndex: 2, category: "🗺️ Geography", difficulty: "easy" },
  { question: "Capital of Australia?",                 image: null, options: ["Sydney","Melbourne","Canberra"], correctIndex: 2, category: "🗺️ Geography", difficulty: "hard" },
  { question: "Which country has the most population?",image: null, options: ["India","China","USA"],           correctIndex: 1, category: "🗺️ Geography", difficulty: "easy" },
  { question: "Mount Everest is in which range?",      image: null, options: ["Andes","Alps","Himalayas"],      correctIndex: 2, category: "🗺️ Geography", difficulty: "easy" },
  { question: "Sahara Desert is on which continent?",  image: null, options: ["Asia","Africa","Australia"],     correctIndex: 1, category: "🗺️ Geography", difficulty: "easy" },

  // ── 💻 Technology ──────────────────────────────────────────
  { question: "What does 'CPU' stand for?",            image: null, options: ["Central Processing Unit","Computer Power Unit","Core Processing Utility"], correctIndex: 0, category: "💻 Tech", difficulty: "easy" },
  { question: "Who founded Microsoft?",                image: null, options: ["Steve Jobs","Bill Gates","Elon Musk"], correctIndex: 1, category: "💻 Tech", difficulty: "easy" },
  { question: "What does 'www' stand for?",            image: null, options: ["World Wide Web","Wide World Web","Web World Wide"], correctIndex: 0, category: "💻 Tech", difficulty: "easy" },
  { question: "Which language powers most websites?",  image: null, options: ["Python","JavaScript","Java"],    correctIndex: 1, category: "💻 Tech", difficulty: "medium" },
  { question: "What is 1 Byte made of?",               image: null, options: ["4 bits","8 bits","16 bits"],    correctIndex: 1, category: "💻 Tech", difficulty: "medium" },
  { question: "What does 'AI' stand for?",             image: null, options: ["Automated Interface","Artificial Intelligence","Advanced Integration"], correctIndex: 1, category: "💻 Tech", difficulty: "easy" },
  { question: "First programmable computer name?",     image: null, options: ["ENIAC","UNIVAC","Apple I"],      correctIndex: 0, category: "💻 Tech", difficulty: "hard" },

  // ── 🎬 Pop Culture ─────────────────────────────────────────
  { question: "Who plays Iron Man in MCU?",            image: null, options: ["Chris Evans","Robert Downey Jr","Mark Ruffalo"], correctIndex: 1, category: "🎬 Pop Culture", difficulty: "easy" },
  { question: "Which band sang 'Bohemian Rhapsody'?",  image: null, options: ["Led Zeppelin","Queen","The Beatles"], correctIndex: 1, category: "🎬 Pop Culture", difficulty: "easy" },
  { question: "Harry Potter's school is called?",      image: null, options: ["Beauxbatons","Durmstrang","Hogwarts"], correctIndex: 2, category: "🎬 Pop Culture", difficulty: "easy" },
  { question: "Who wrote 'Romeo and Juliet'?",         image: null, options: ["Charles Dickens","Shakespeare","Jane Austen"], correctIndex: 1, category: "🎬 Pop Culture", difficulty: "easy" },
  { question: "'Just Do It' is the slogan of?",        image: null, options: ["Adidas","Puma","Nike"],          correctIndex: 2, category: "🎬 Pop Culture", difficulty: "easy" },

  // ── ⚽ Sports ──────────────────────────────────────────────
  { question: "How many players on a soccer team?",    image: null, options: ["9","11","13"],                   correctIndex: 1, category: "⚽ Sports", difficulty: "easy" },
  { question: "Which country invented cricket?",       image: null, options: ["India","Australia","England"],   correctIndex: 2, category: "⚽ Sports", difficulty: "medium" },
  { question: "Olympics held every how many years?",   image: null, options: ["2","4","6"],                     correctIndex: 1, category: "⚽ Sports", difficulty: "easy" },
  { question: "Most Grand Slam singles titles (men)?", image: null, options: ["Federer","Djokovic","Nadal"],    correctIndex: 1, category: "⚽ Sports", difficulty: "hard" },
  { question: "Swimming: how many strokes exist?",     image: null, options: ["3","4","5"],                     correctIndex: 1, category: "⚽ Sports", difficulty: "medium" },

  // ── 🧠 Brain Teasers ───────────────────────────────────────
  { question: "How many sides does a hexagon have?",   image: null, options: ["5","7","6"],                     correctIndex: 2, category: "🧠 Trivia", difficulty: "easy" },
  { question: "How many seconds in one hour?",         image: null, options: ["3000","3600","4200"],             correctIndex: 1, category: "🧠 Trivia", difficulty: "easy" },
  { question: "What comes after a trillion?",          image: null, options: ["Zillion","Quadrillion","Billion"], correctIndex: 1, category: "🧠 Trivia", difficulty: "medium" },
  { question: "Hottest planet in our solar system?",   image: null, options: ["Mercury","Mars","Venus"],        correctIndex: 2, category: "🧠 Trivia", difficulty: "medium" },
  { question: "Which metal is liquid at room temp?",   image: null, options: ["Iron","Mercury","Copper"],       correctIndex: 1, category: "🧠 Trivia", difficulty: "hard" },
  { question: "How many teeth does an adult have?",    image: null, options: ["28","32","36"],                   correctIndex: 1, category: "🧠 Trivia", difficulty: "medium" },

  // ── 📜 History ─────────────────────────────────────────────
  { question: "Who painted the Mona Lisa?",            image: null, options: ["Michelangelo","Leonardo da Vinci","Raphael"], correctIndex: 1, category: "📜 History", difficulty: "easy" },
  { question: "WWII ended in which year?",             image: null, options: ["1943","1947","1945"],             correctIndex: 2, category: "📜 History", difficulty: "medium" },
  { question: "First man on the Moon?",                image: null, options: ["Buzz Aldrin","Yuri Gagarin","Neil Armstrong"], correctIndex: 2, category: "📜 History", difficulty: "easy" },
  { question: "Ancient wonder: Great Pyramid is in?",  image: null, options: ["Greece","Egypt","Rome"],         correctIndex: 1, category: "📜 History", difficulty: "easy" },
  { question: "Who was the first US President?",       image: null, options: ["Abraham Lincoln","Thomas Jefferson","George Washington"], correctIndex: 2, category: "📜 History", difficulty: "medium" },
  { question: "Titanic sank in which year?",           image: null, options: ["1910","1912","1915"],             correctIndex: 1, category: "📜 History", difficulty: "medium" },
];
