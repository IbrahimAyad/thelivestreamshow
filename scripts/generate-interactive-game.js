const fs = require('fs');
const path = require('path');

console.log('🎮 Generating interactive tomato chat game...\n');

// Read original file
const originalPath = path.join(__dirname, '..', 'public', 'brb-tomato-game.html');
const outputPath = path.join(__dirname, '..', 'public', 'tomato-chat-game.html');

let html = fs.readFileSync(originalPath, 'utf-8');

// 1. Update title
html = html.replace(
  '<title>BRB - Tomato Throwing Game</title>',
  '<title>Take Down Bibi - Interactive Tomato Game</title>'
);

// 2. Update main heading
html = html.replace(
  '<div class="brb-title">BE RIGHT BACK</div>',
  '<div class="brb-title">TAKE DOWN BIBI!</div>'
);

// 3. Update instructions
html = html.replace(
  '🍅 <span>Click anywhere</span> to throw tomatoes! 🍅',
  '🎮 <span>Q/W/E/A/S/D/Z/X/C</span> zones • <span>T</span> random • <span>H</span> toggle zones'
);

// 4. Add new CSS before closing </style>
const additionalCSS = `
        /* CTA Popup */
        .cta-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 4px solid #ff6347;
            box-shadow: 0 0 40px rgba(255, 99, 71, 0.8);
            padding: 40px 60px;
            border-radius: 20px;
            z-index: 500;
            text-align: center;
        }
        .cta-text { font-size: 2.5em; color: #fff; margin-bottom: 20px; }
        .cta-instructions { font-size: 1.5em; color: #ff6347; }
        
        /* Zone Overlay */
        .zone-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 25;
            background: rgba(0, 0, 0, 0.3);
            display: none;
        }
        .zone-grid {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateY(-20px);
            width: 600px;
            height: 700px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
        }
        .zone-cell {
            border: 2px dashed rgba(255, 255, 255, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 1.5em;
            text-shadow: 2px 2px 4px #000;
        }
        
        /* Queue Indicator */
        .queue-indicator {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #4ade80;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 1.2em;
            color: #4ade80;
            z-index: 150;
            display: none;
        }
        
        /* Last Thrower */
        .last-thrower {
            position: fixed;
            top: 100px;
            right: 100px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ffd700;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 2em;
            color: #fff;
            z-index: 200;
            opacity: 0;
            transition: opacity 0.5s;
        }
        .last-thrower.show { opacity: 1; }
        
        /* Encouragement */
        .encouragement {
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 99, 71, 0.9);
            border: 3px solid #fff;
            padding: 15px 30px;
            border-radius: 15px;
            font-size: 2em;
            color: #fff;
            z-index: 250;
            box-shadow: 0 0 30px rgba(255, 99, 71, 0.8);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .encouragement.show { opacity: 1; }
`;

html = html.replace('</style>', additionalCSS + '\n    </style>');

// 5. Add new HTML elements before </body>
const additionalHTML = `
    <!-- CTA Popup -->
    <div class="cta-popup" id="ctaPopup" style="display: none;">
        <div class="cta-text">🍅 Throw Tomatoes to Activate the Stream! 🍅</div>
        <div class="cta-instructions">Press T to throw • Type !throw in chat</div>
    </div>

    <!-- Zone Overlay -->
    <div class="zone-overlay" id="zoneOverlay">
        <div class="zone-grid">
            <div class="zone-cell">Q - TL</div>
            <div class="zone-cell">W - TC</div>
            <div class="zone-cell">E - TR</div>
            <div class="zone-cell">A - ML</div>
            <div class="zone-cell">S - C</div>
            <div class="zone-cell">D - MR</div>
            <div class="zone-cell">Z - BL</div>
            <div class="zone-cell">X - BC</div>
            <div class="zone-cell">C - BR</div>
        </div>
    </div>

    <!-- Queue Indicator -->
    <div class="queue-indicator" id="queueIndicator">
        🍅 Queue: <span id="queueCount">0</span>
    </div>

    <!-- Last Thrower -->
    <div class="last-thrower" id="lastThrower">
        Hit by <span id="throwerName">@viewer</span>!
    </div>

    <!-- Encouragement -->
    <div class="encouragement" id="encouragement"></div>

    <!-- Finish Him Audio -->
    <audio id="finishHimAudio" preload="auto">
        <source src="/mk_finish_him.mp3" type="audio/mpeg">
    </audio>
`;

html = html.replace('</body>', additionalHTML + '\n</body>');

// 6. Replace keyboard handler and add zone system
const newKeyboardCode = `
        // Zone configuration
        const ZONES = {
            Q: { x: 150, y: 175 }, W: { x: 300, y: 175 }, E: { x: 450, y: 175 },
            A: { x: 150, y: 350 }, S: { x: 300, y: 350 }, D: { x: 450, y: 350 },
            Z: { x: 150, y: 525 }, X: { x: 300, y: 525 }, C: { x: 450, y: 525 }
        };
        
        let showZones = false;
        let lastFinishHimPlay = 0;
        const finishHimAudio = document.getElementById('finishHimAudio');
        if (finishHimAudio) finishHimAudio.volume = 0.8;
        
        // Encouragement messages
        function showEncouragement(health) {
            const msgs = health > 75 ? ['Keep going!', 'Nice shot!'] :
                        health > 50 ? ['Making progress!', 'Almost there!'] :
                        health > 25 ? ['Critical damage!', 'Finish Him!'] :
                        ['ONE MORE HIT!', 'SO CLOSE!'];
            
            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            const el = document.getElementById('encouragement');
            if (el) {
                el.textContent = msg;
                el.classList.add('show');
                
                // Play Finish Him audio
                if (msg === 'Finish Him!' && soundEnabled && finishHimAudio) {
                    const now = Date.now();
                    if (now - lastFinishHimPlay > 5000) {
                        finishHimAudio.currentTime = 0;
                        finishHimAudio.play().catch(() => {});
                        lastFinishHimPlay = now;
                    }
                }
                
                setTimeout(() => el.classList.remove('show'), 2000);
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            
            // Zone throws
            if (ZONES[key]) {
                e.preventDefault();
                const zone = ZONES[key];
                const rect = targetContainer.getBoundingClientRect();
                const variance = 50;
                const x = rect.left + zone.x + (Math.random() * variance * 2 - variance);
                const y = rect.top + zone.y + (Math.random() * variance * 2 - variance);
                throwTomato(x, y);
            }
            // Random throw
            else if (key === 'T') {
                e.preventDefault();
                const rect = targetContainer.getBoundingClientRect();
                const x = rect.left + Math.random() * rect.width;
                const y = rect.top + Math.random() * rect.height;
                throwTomato(x, y);
            }
            // Reset
            else if (key === 'R') {
                e.preventDefault();
                resetGame();
            }
            // Toggle zones
            else if (key === 'H') {
                e.preventDefault();
                showZones = !showZones;
                const overlay = document.getElementById('zoneOverlay');
                if (overlay) overlay.style.display = showZones ? 'block' : 'none';
            }
            // Space for center
            else if (e.key === ' ') {
                e.preventDefault();
                const rect = targetContainer.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                throwTomato(x, y);
            }
        });`;

html = html.replace(
  /\/\/ Keyboard shortcuts[\s\S]*?}\);/,
  newKeyboardCode
);

// 7. Modify handleHit to show encouragement
html = html.replace(
  'if (health <= 0) {\n                showKO();',
  `showEncouragement(health);\n            \n            if (health <= 0) {\n                showKO();`
);

// 8. Add CTA popup on load
html = html.replace(
  '// Initialize\n        createBackgroundParticles();',
  `// Initialize
        createBackgroundParticles();
        
        // Show CTA popup
        setTimeout(() => {
            const cta = document.getElementById('ctaPopup');
            if (cta) {
                cta.style.display = 'block';
                setTimeout(() => {
                    cta.style.opacity = '0';
                    setTimeout(() => cta.style.display = 'none', 500);
                }, 8000);
            }
        }, 100);`
);

// Write output
fs.writeFileSync(outputPath, html, 'utf-8');

console.log('✅ Interactive game created successfully!');
console.log(`   Output: ${outputPath}`);
console.log('\n📋 Features added:');
console.log('   ✓ Zone-based keyboard controls (Q/W/E/A/S/D/Z/X/C)');
console.log('   ✓ Call-to-action popup (8 seconds)');
console.log('   ✓ Zone overlay (toggle with H)');
console.log('   ✓ Encouragement messages');
console.log('   ✓ "Finish Him!" audio integration');
console.log('   ✓ Updated title and instructions');
console.log('\n✨ Game ready for testing!\n');
