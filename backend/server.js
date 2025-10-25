const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// BetaBot AI is in frontend - backend only handles audio routing
const OBSController = require('./obs-controller');
const AudioManager = require('./audio-manager');
const ScarlettManager = require('./scarlett-manager');

class BetaBotServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = process.env.PORT || 3001;

        // Audio routing only (BetaBot AI lives in frontend)
        this.obs = new OBSController();
        this.audio = new AudioManager();
        this.scarlett = new ScarlettManager();

        this.clients = new Set();
        this.settings = {
            autoRespond: true,
            showTranscripts: true,
            autoSwitchScenes: false,
            responseDelay: 500,
            wakeWord: process.env.BETABOT_WAKE_WORD || 'Hey BetaBot'
        };

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupEventHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(express.static('../web-ui'));
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                scarlett: this.scarlett.isConnected?.() || false,
                obs: this.obs.isConnected(),
                uptime: process.uptime()
            });
        });

        // Audio control routes
        this.app.post('/api/audio/mute', async (req, res) => {
            const { source, muted } = req.body;
            await this.audio.setMute(source, muted);
            res.json({ success: true });
        });

        this.app.post('/api/audio/volume', async (req, res) => {
            const { source, volume } = req.body;
            await this.audio.setVolume(source, volume);
            res.json({ success: true });
        });

        this.app.post('/api/audio/mute-all', async (req, res) => {
            await this.audio.muteAll();
            res.json({ success: true });
        });

        // Discord audio routes (for BetaBot frontend)
        this.app.post('/api/discord/send-audio', async (req, res) => {
            // Route BetaBot TTS audio to Discord panel
            const { audioData } = req.body;
            try {
                // This will route audio to BlackHole → Discord
                await this.audio.sendToDiscord(audioData);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/discord/receive-audio', async (req, res) => {
            // Stream Discord panel audio to BetaBot frontend
            try {
                // This will capture audio from Loopback (Discord output)
                const audioStream = await this.audio.captureFromDiscord();
                res.json({ success: true, streamUrl: audioStream });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // BetaBot TTS audio route - plays through BlackHole 2ch for Discord
        this.app.post('/api/betabot/play-audio', async (req, res) => {
            try {
                // Get raw audio buffer
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', async () => {
                    try {
                        const audioBuffer = Buffer.concat(chunks);
                        
                        // Save to temp file
                        const tempFile = path.join(__dirname, 'temp_betabot_audio.wav');
                        await fs.promises.writeFile(tempFile, audioBuffer);
                        
                        console.log('🎤 Playing BetaBot TTS through BlackHole 2ch...');
                        
                        // Use SwitchAudioSource or sox to route to BlackHole
                        // For now, use afplay which routes to system default
                        // TODO: Configure macOS Multi-Output Device to include BlackHole
                        const { exec } = require('child_process');
                        const util = require('util');
                        const execPromise = util.promisify(exec);
                        
                        await execPromise(`afplay "${tempFile}"`);
                        
                        console.log('✅ BetaBot audio playback complete');
                        
                        // Notify all connected clients that playback is complete
                        this.broadcast({
                            type: 'betabot_audio_complete',
                            timestamp: Date.now()
                        });
                        
                        // Clean up
                        await fs.promises.unlink(tempFile);
                        
                        res.json({ success: true });
                    } catch (error) {
                        console.error('Error playing BetaBot audio:', error);
                        res.status(500).json({ success: false, error: error.message });
                    }
                });
            } catch (error) {
                console.error('Error handling BetaBot audio request:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // OBS routes
        this.app.post('/api/obs/connect', async (req, res) => {
            const { url, password } = req.body;
            try {
                await this.obs.connect(url || process.env.OBS_WEBSOCKET_URL, password);
                this.broadcast({ type: 'obs_status', status: 'connected' });
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/obs/disconnect', async (req, res) => {
            await this.obs.disconnect();
            this.broadcast({ type: 'obs_status', status: 'disconnected' });
            res.json({ success: true });
        });

        this.app.post('/api/obs/scenes', async (req, res) => {
            try {
                const scenes = await this.obs.getScenes();
                res.json({ success: true, scenes });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/obs/scene/switch', async (req, res) => {
            const { scene } = req.body;
            try {
                await this.obs.setScene(scene);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/obs/stream/start', async (req, res) => {
            try {
                await this.obs.startStreaming();
                this.broadcast({ type: 'stream_status', status: 'streaming' });
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/obs/stream/stop', async (req, res) => {
            try {
                await this.obs.stopStreaming();
                this.broadcast({ type: 'stream_status', status: 'offline' });
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/obs/recording/start', async (req, res) => {
            try {
                await this.obs.startRecording();
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Settings routes
        this.app.post('/api/settings/update', (req, res) => {
            const { setting, value } = req.body;
            this.settings[setting] = value;
            res.json({ success: true });
        });

        this.app.get('/api/settings', (req, res) => {
            res.json(this.settings);
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('New WebSocket client connected');
            this.clients.add(ws);

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('Client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });

            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                settings: this.settings,
                scarlett: {
                    connected: this.scarlett.isConnected?.() || false
                },
                obs: this.obs.getState()
            }));
        });
    }

    setupEventHandlers() {
        // Audio events
        this.audio.on('level', (data) => {
            this.broadcast({
                type: 'audio_level',
                source: data.source,
                level: data.level
            });
        });

        // Scarlett events
        this.scarlett.on('connected', (info) => {
            console.log('Scarlett Solo connected:', info);
            this.broadcast({
                type: 'scarlett_connected',
                info: info
            });
        });

        this.scarlett.on('input-level', (level) => {
            this.broadcast({
                type: 'audio_level',
                source: 'mic',
                level: level.instantaneous,
                peak: level.peak,
                db: level.db
            });
        });

        this.scarlett.on('sample-rate-warning', (rate) => {
            this.broadcast({
                type: 'warning',
                message: `Scarlett sample rate is ${rate} Hz (recommended: 48000 Hz)`
            });
        });

        // OBS events
        this.obs.on('scene-changed', (scene) => {
            this.broadcast({ type: 'scene_changed', scene });
        });

        this.obs.on('streaming-started', () => {
            this.broadcast({ type: 'stream_status', status: 'streaming' });
        });

        this.obs.on('streaming-stopped', () => {
            this.broadcast({ type: 'stream_status', status: 'offline' });
        });
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`┌─────────────────────────────────────────────┐`);
            console.log(`│  🎙️  BetaBot Server Running                │`);
            console.log(`│  HTTP: http://localhost:${this.port}           │`);
            console.log(`│  WebSocket: ws://localhost:${this.port}        │`);
            console.log(`│  Dashboard: http://localhost:5173           │`);
            console.log(`└─────────────────────────────────────────────┘`);
        });
    }

    async stop() {
        await this.obs.disconnect();
        await this.audio.cleanup();
        this.server.close();
        console.log('Server stopped');
    }
}

// Start the server
const server = new BetaBotServer();
server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await server.stop();
    process.exit(0);
});

module.exports = BetaBotServer;
