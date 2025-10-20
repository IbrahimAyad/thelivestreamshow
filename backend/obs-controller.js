const EventEmitter = require('events');
const OBSWebSocket = require('obs-websocket-js').default;

class OBSController extends EventEmitter {
    constructor() {
        super();
        this.obs = new OBSWebSocket();
        this.connected = false;
        this.currentScene = null;
        this.streaming = false;
        this.recording = false;

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.obs.on('ConnectionOpened', () => {
            console.log('OBS WebSocket connection opened');
            this.connected = true;
        });

        this.obs.on('ConnectionClosed', () => {
            console.log('OBS WebSocket connection closed');
            this.connected = false;
        });

        this.obs.on('ConnectionError', (error) => {
            console.error('OBS WebSocket error:', error);
            this.emit('error', error);
        });

        // Scene events
        this.obs.on('CurrentProgramSceneChanged', (data) => {
            this.currentScene = data.sceneName;
            this.emit('scene-changed', data.sceneName);
            console.log(`Scene changed to: ${data.sceneName}`);
        });

        // Streaming events
        this.obs.on('StreamStateChanged', (data) => {
            this.streaming = data.outputActive;
            if (data.outputActive) {
                this.emit('streaming-started');
                console.log('Stream started');
            } else {
                this.emit('streaming-stopped');
                console.log('Stream stopped');
            }
        });

        // Recording events
        this.obs.on('RecordStateChanged', (data) => {
            this.recording = data.outputActive;
            if (data.outputActive) {
                this.emit('recording-started');
                console.log('Recording started');
            } else {
                this.emit('recording-stopped');
                console.log('Recording stopped');
            }
        });
    }

    async connect(url, password) {
        try {
            console.log(`Connecting to OBS at ${url}...`);

            const connectionParams = { address: url };
            if (password) {
                connectionParams.password = password;
            }

            await this.obs.connect(url, password);
            this.connected = true;

            // Get initial state
            await this.updateState();

            console.log('Successfully connected to OBS');
            return true;
        } catch (error) {
            console.error('Failed to connect to OBS:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.connected) {
            await this.obs.disconnect();
            this.connected = false;
            console.log('Disconnected from OBS');
        }
    }

    isConnected() {
        return this.connected;
    }

    async updateState() {
        try {
            // Get current scene
            const sceneData = await this.obs.call('GetCurrentProgramScene');
            this.currentScene = sceneData.currentProgramSceneName;

            // Get streaming status
            const streamStatus = await this.obs.call('GetStreamStatus');
            this.streaming = streamStatus.outputActive;

            // Get recording status
            const recordStatus = await this.obs.call('GetRecordStatus');
            this.recording = recordStatus.outputActive;
        } catch (error) {
            console.error('Error updating OBS state:', error);
        }
    }

    getState() {
        return {
            connected: this.connected,
            currentScene: this.currentScene,
            streaming: this.streaming,
            recording: this.recording
        };
    }

    async getScenes() {
        try {
            const data = await this.obs.call('GetSceneList');
            return data.scenes.map(scene => scene.sceneName);
        } catch (error) {
            console.error('Error getting scenes:', error);
            throw error;
        }
    }

    async setScene(sceneName) {
        try {
            await this.obs.call('SetCurrentProgramScene', {
                sceneName: sceneName
            });
            this.currentScene = sceneName;
            console.log(`Switched to scene: ${sceneName}`);
            return true;
        } catch (error) {
            console.error('Error switching scene:', error);
            throw error;
        }
    }

    async startStreaming() {
        try {
            await this.obs.call('StartStream');
            this.streaming = true;
            console.log('Started streaming');
            return true;
        } catch (error) {
            console.error('Error starting stream:', error);
            throw error;
        }
    }

    async stopStreaming() {
        try {
            await this.obs.call('StopStream');
            this.streaming = false;
            console.log('Stopped streaming');
            return true;
        } catch (error) {
            console.error('Error stopping stream:', error);
            throw error;
        }
    }

    async startRecording() {
        try {
            await this.obs.call('StartRecord');
            this.recording = true;
            console.log('Started recording');
            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    async stopRecording() {
        try {
            await this.obs.call('StopRecord');
            this.recording = false;
            console.log('Stopped recording');
            return true;
        } catch (error) {
            console.error('Error stopping recording:', error);
            throw error;
        }
    }

    async setSourceVolume(sourceName, volume) {
        try {
            // Convert percentage (0-100) to dB
            const volumeDb = volume === 0 ? -100 : 20 * Math.log10(volume / 100);

            await this.obs.call('SetInputVolume', {
                inputName: sourceName,
                inputVolumeDb: volumeDb
            });
            return true;
        } catch (error) {
            console.error('Error setting source volume:', error);
            throw error;
        }
    }

    async muteSource(sourceName, muted) {
        try {
            await this.obs.call('SetInputMute', {
                inputName: sourceName,
                inputMuted: muted
            });
            return true;
        } catch (error) {
            console.error('Error muting source:', error);
            throw error;
        }
    }

    async getSourceVolume(sourceName) {
        try {
            const data = await this.obs.call('GetInputVolume', {
                inputName: sourceName
            });
            // Convert dB to percentage (0-100)
            const volume = data.inputVolumeDb === -100 ? 0 : Math.pow(10, data.inputVolumeDb / 20) * 100;
            return volume;
        } catch (error) {
            console.error('Error getting source volume:', error);
            throw error;
        }
    }

    async getSources() {
        try {
            const data = await this.obs.call('GetInputList');
            return data.inputs.map(input => ({
                name: input.inputName,
                kind: input.inputKind
            }));
        } catch (error) {
            console.error('Error getting sources:', error);
            throw error;
        }
    }
}

module.exports = OBSController;
