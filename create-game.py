#!/usr/bin/env python3
import re

print("🎮 Creating interactive tomato chat game...")

# Read source file
with open('public/brb-tomato-game.html', 'r') as f:
    html = f.read()

# 1. Update title
html = html.replace(
    '<title>BRB - Tomato Throwing Game</title>',
    '<title>Take Down Bibi - Interactive Tomato Game</title>'
)

# 2. Update main heading
html = html.replace(
    '<div class="brb-title">BE RIGHT BACK</div>',
    '<div class="brb-title">TAKE DOWN BIBI!</div>'
)

# 3. Update instructions
html = html.replace(
    '🍅 <span>Click anywhere</span> to throw tomatoes! 🍅',
    '🎮 <span>Q/W/E/A/S/D/Z/X/C</span> zones • <span>T</span> random • <span>H</span> zones'
)

# 4. Add new CSS before </style>
css_insert = '''
        /* CTA Popup */
        .cta-popup {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95); border: 4px solid #ff6347;
            box-shadow: 0 0 40px rgba(255,99,71,0.8);
            padding: 40px 60px; border-radius: 20px;
            z-index: 500; text-align: center;
        }
        .cta-text { font-size: 2.5em; color: #fff; margin-bottom: 20px; }
        .cta-instructions { font-size: 1.5em; color: #ff6347; }
        .zone-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 25; background: rgba(0,0,0,0.3); display: none;
        }
        .zone-grid {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) translateY(-20px);
            width: 600px; height: 700px; display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
        }
        .zone-cell {
            border: 2px dashed rgba(255,255,255,0.5);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 1.5em; text-shadow: 2px 2px 4px #000;
        }
        .encouragement {
            position: fixed; bottom: 150px; left: 50%;
            transform: translateX(-50%); background: rgba(255,99,71,0.9);
            border: 3px solid #fff; padding: 15px 30px; border-radius: 15px;
            font-size: 2em; color: #fff; z-index: 250;
            box-shadow: 0 0 30px rgba(255,99,71,0.8);
            opacity: 0; transition: opacity 0.3s;
        }
        .encouragement.show { opacity: 1; }
    </style>'''

html = html.replace('</style>', css_insert)

# 5. Add new HTML before </body>
html_insert = '''
    <div class="cta-popup" id="ctaPopup" style="display:none;">
        <div class="cta-text">🍅 Throw Tomatoes to Activate the Stream! 🍅</div>
        <div class="cta-instructions">Press T to throw • Type !throw in chat</div>
    </div>
    <div class="zone-overlay" id="zoneOverlay">
        <div class="zone-grid">
            <div class="zone-cell">Q - TL</div><div class="zone-cell">W - TC</div><div class="zone-cell">E - TR</div>
            <div class="zone-cell">A - ML</div><div class="zone-cell">S - C</div><div class="zone-cell">D - MR</div>
            <div class="zone-cell">Z - BL</div><div class="zone-cell">X - BC</div><div class="zone-cell">C - BR</div>
        </div>
    </div>
    <div class="encouragement" id="encouragement"></div>
    <audio id="finishHimAudio" preload="auto"><source src="/mk_finish_him.mp3" type="audio/mpeg"></audio>
'''

html = html.replace('</body>', html_insert + '\n</body>')

# 6. Add zone system and keyboard handler before the closing script tag
zone_code = '''
        // Zone system
        const ZONES = {
            Q: {x: 150, y: 175}, W: {x: 300, y: 175}, E: {x: 450, y: 175},
            A: {x: 150, y: 350}, S: {x: 300, y: 350}, D: {x: 450, y: 350},
            Z: {x: 150, y: 525}, X: {x: 300, y: 525}, C: {x: 450, y: 525}
        };
        let showZones = false;
        let lastFinishHim = 0;
        const finishAudio = document.getElementById('finishHimAudio');
        if (finishAudio) finishAudio.volume = 0.8;
        
        function showEncouragement(h) {
            const msgs = h > 75 ? ['Keep going!', 'Nice shot!'] :
                        h > 50 ? ['Making progress!', 'Almost there!'] :
                        h > 25 ? ['Critical damage!', 'Finish Him!'] :
                        ['ONE MORE HIT!', 'SO CLOSE!'];
            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            const el = document.getElementById('encouragement');
            if (el) {
                el.textContent = msg;
                el.classList.add('show');
                if (msg === 'Finish Him!' && soundEnabled && finishAudio) {
                    const now = Date.now();
                    if (now - lastFinishHim > 5000) {
                        finishAudio.currentTime = 0;
                        finishAudio.play().catch(() => {});
                        lastFinishHim = now;
                    }
                }
                setTimeout(() => el.classList.remove('show'), 2000);
            }
        }
'''

# Find the keyboard shortcuts section and replace it
keyboard_pattern = r'// Keyboard shortcuts.*?}\);'
new_keyboard = '''// Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            if (ZONES[key]) {
                e.preventDefault();
                const zone = ZONES[key];
                const rect = targetContainer.getBoundingClientRect();
                const variance = 50;
                const x = rect.left + zone.x + (Math.random() * variance * 2 - variance);
                const y = rect.top + zone.y + (Math.random() * variance * 2 - variance);
                throwTomato(x, y);
            } else if (key === 'T') {
                e.preventDefault();
                const rect = targetContainer.getBoundingClientRect();
                throwTomato(rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height);
            } else if (key === 'R') {
                e.preventDefault();
                resetGame();
            } else if (key === 'H') {
                e.preventDefault();
                showZones = !showZones;
                const overlay = document.getElementById('zoneOverlay');
                if (overlay) overlay.style.display = showZones ? 'block' : 'none';
            } else if (e.key === ' ') {
                e.preventDefault();
                const rect = targetContainer.getBoundingClientRect();
                throwTomato(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
        });'''

html = re.sub(keyboard_pattern, new_keyboard, html, flags=re.DOTALL)

# 7. Add zone code and encouragement call
html = html.replace('// Game State', zone_code + '\n        // Game State')
html = html.replace('if (health <= 0) {\n                showKO();',
                   'showEncouragement(health);\n            \n            if (health <= 0) {\n                showKO();')

# 8. Add CTA popup on load
html = html.replace('// Initialize\n        createBackgroundParticles();',
                   '''// Initialize
        createBackgroundParticles();
        setTimeout(() => {
            const cta = document.getElementById('ctaPopup');
            if (cta) {
                cta.style.display = 'block';
                setTimeout(() => {
                    cta.style.opacity = '0';
                    setTimeout(() => cta.style.display = 'none', 500);
                }, 8000);
            }
        }, 100);''')

# Write output
with open('public/tomato-chat-game.html', 'w') as f:
    f.write(html)

print("✅ Interactive game created successfully!")
print("   File: public/tomato-chat-game.html")
print("\n📝 Features added:")
print("   ✓ Zone-based keyboard controls (Q/W/E/A/S/D/Z/X/C)")
print("   ✓ Call-to-action popup (8 seconds)")
print("   ✓ Zone overlay (toggle with H)")
print("   ✓ Encouragement messages")
print("   ✓ 'Finish Him!' audio integration")
print("   ✓ Updated title and instructions")
print("\n✨ Ready to test!")
