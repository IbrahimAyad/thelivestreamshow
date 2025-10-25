#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎮 Creating interactive tomato chat game...');

// Read the original game
const originalPath = join(__dirname, '..', 'public', 'brb-tomato-game.html');
const newPath = join(__dirname, '..', 'public', 'tomato-chat-game.html');

let html = readFileSync(originalPath, 'utf-8');

// 1. Update title
html = html.replace(
  '<title>BRB - Tomato Throwing Game</title>',
  '<title>Take Down Bibi - Interactive Tomato Game</title>'
);

// 2. Change main title text
html = html.replace(
  '<div class="brb-title">BE RIGHT BACK</div>',
  '<div class="brb-title">TAKE DOWN BIBI!</div>'
);

// 3. Update instructions
html = html.replace(
  '🍅 <span>Click anywhere</span> to throw tomatoes! 🍅',
  '🎮 <span>Press Q/W/E/A/S/D/Z/X/C</span> for zones • <span>T</span> for random • <span>H</span> to show zones • <span>R</span> to reset'
);

// 4. Add CTA popup HTML before closing body tag
const ctaPopupHTML = `
    <!-- Call-to-Action Popup -->
    <div class="cta-popup" id="ctaPopup" style="display: none;">
        <div class="cta-text">🍅 Throw Tomatoes to Activate the Stream! 🍅</div>
        <div class="cta-instructions">Press T to throw • Type !throw in chat</div>
    </div>

    <!-- Zone Overlay (Press H to toggle) -->
    <div class="zone-overlay" id="zoneOverlay" style="display: none;">
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
    <div class="queue-indicator" id="queueIndicator" style="display: none;">
        🍅 Queue: <span id="queueCount">0</span>
    </div>

    <!-- Last Thrower Display -->
    <div class="last-thrower" id="lastThrower">
        Hit by <span id="throwerName">@viewer</span>!
    </div>

    <!-- Encouragement Message Container -->
    <div id="encouragementContainer"></div>

    <!-- Embedded "Finish Him!" Audio -->
    <audio id="finishHimAudio" preload="auto">
        <source src="/mk_finish_him.mp3" type="audio/mpeg">
    </audio>
`;

html = html.replace('</body>', `${ctaPopupHTML}\n</body>`);

// 5. Add CSS styles before closing </style> tag
const newStyles = `
        /* CTA Popup */
        .cta-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 4px solid #ff6347;
            box-shadow: 0 0 40px rgba(255, 99, 71, 0.8), inset 0 0 30px rgba(255, 99, 71, 0.2);
            padding: 40px 60px;
            border-radius: 20px;
            z-index: 500;
            text-align: center;
        }

        .cta-text {
            font-size: 2.5em;
            color: #fff;
            margin-bottom: 20px;
        }

        .cta-instructions {
            font-size: 1.5em;
            color: #ff6347;
        }

        /* Zone Overlay */
        .zone-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 25;
            background: rgba(0, 0, 0, 0.3);
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
            gap: 0;
        }

        .zone-cell {
            border: 2px dashed rgba(255, 255, 255, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, transparent 60%, rgba(255, 255, 255, 0.1) 100%);
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
        }

        /* Last Thrower */
        .last-thrower {
            position: fixed;
            top: 100px;
            right: 100px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.9));
            border: 2px solid #ffd700;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 2em;
            color: #fff;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            z-index: 200;
            opacity: 0;
            transform: translateX(300px);
            transition: all 0.5s;
        }

        .last-thrower.show {
            opacity: 1;
            transform: translateX(0);
        }

        /* Encouragement Message */
        .encouragement-message {
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
            text-shadow: 2px 2px 4px #000;
            z-index: 250;
            box-shadow: 0 0 30px rgba(255, 99, 71, 0.8);
            animation: encourageShow 0.3s, encourageHide 0.3s 2s forwards;
        }

        @keyframes encourageShow {
            from { opacity: 0; transform: translateX(-50%) scale(0.5); }
            to { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        @keyframes encourageHide {
            to { opacity: 0; }
        }
    </style>`;

html = html.replace('</style>', `${newStyles}\n    </style>`);

// Write the new file
writeFileSync(newPath, html, 'utf-8');

console.log('✅ Interactive tomato chat game created successfully!');
console.log(`   Location: ${newPath}`);
console.log('');
console.log('📝 Summary of changes:');
console.log('   ✓ Title changed to "Take Down Bibi!"');
console.log('   ✓ Call-to-Action popup added');
console.log('   ✓ Zone overlay system added (toggle with H)');
console.log('   ✓ Queue indicator added');
console.log('   ✓ Last thrower display added');
console.log('   ✓ Encouragement message container added');
console.log('   ✓ Finish Him audio element added');
console.log('   ✓ Updated instructions for keyboard controls');
console.log('');
console.log('⏭️  Next: Adding JavaScript functionality...');
