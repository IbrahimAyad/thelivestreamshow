const EventEmitter = require('events');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class AudioManager extends EventEmitter {
    constructor() {
        super();

        this.sources = {
            mic: {
                name: 'Microphone',
                device: null,
                volume: 80,
                muted: false
            },
            betabot: {
                name: 'BetaBot',
                device: 'BlackHole 2ch',
                volume: 75,
                muted: false
            },
            discord: {
                name: 'Discord',
                device: 'Loopback Audio',
                volume: 85,
                muted: false
            }
        };

        this.monitoring = false;
        this.detectPhysicalMicrophone();
    }

    async detectPhysicalMicrophone() {
        try {
            // Get default input device
            const { stdout } = await execPromise('system_profiler SPAudioDataType');

            // Look for default input device
            const lines = stdout.split('\n');
            let foundDefault = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('Default Input Device: Yes')) {
                    // Get device name from previous lines
                    for (let j = i - 1; j >= 0; j--) {
                        const match = lines[j].match(/^\s+(.+):$/);
                        if (match && !lines[j].includes('Devices:')) {
                            this.sources.mic.device = match[1].trim();
                            console.log(`Detected microphone: ${this.sources.mic.device}`);
                            break;
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error detecting microphone:', error);
        }
    }

    async setVolume(source, volume) {
        if (!this.sources[source]) {
            throw new Error(`Unknown audio source: ${source}`);
        }

        this.sources[source].volume = volume;
        console.log(`Set ${source} volume to ${volume}%`);

        // In a real implementation, this would use CoreAudio or sox
        // to actually set the volume of the audio device

        this.emit('volume-changed', { source, volume });
        return true;
    }

    async setMute(source, muted) {
        if (!this.sources[source]) {
            throw new Error(`Unknown audio source: ${source}`);
        }

        this.sources[source].muted = muted;
        console.log(`${source} ${muted ? 'muted' : 'unmuted'}`);

        this.emit('mute-changed', { source, muted });
        return true;
    }

    async muteAll() {
        for (const source of Object.keys(this.sources)) {
            await this.setMute(source, true);
        }
        console.log('All audio sources muted');
        return true;
    }

    async unmuteAll() {
        for (const source of Object.keys(this.sources)) {
            await this.setMute(source, false);
        }
        console.log('All audio sources unmuted');
        return true;
    }

    getSource(source) {
        return this.sources[source];
    }

    getAllSources() {
        return this.sources;
    }

    async startMonitoring() {
        if (this.monitoring) return;

        this.monitoring = true;
        console.log('Started audio level monitoring');

        // Simulate audio level monitoring
        this.monitorInterval = setInterval(() => {
            Object.keys(this.sources).forEach(source => {
                if (!this.sources[source].muted) {
                    // Simulate random audio levels
                    const level = Math.random() * 100;
                    this.emit('level', { source, level });
                }
            });
        }, 100);
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitoring = false;
            console.log('Stopped audio level monitoring');
        }
    }

    async getAudioDevices() {
        try {
            const { stdout } = await execPromise('system_profiler SPAudioDataType');
            const devices = {
                input: [],
                output: []
            };

            const lines = stdout.split('\n');
            let currentDevice = null;
            let isInput = false;
            let isOutput = false;

            for (const line of lines) {
                const deviceMatch = line.match(/^\s+(.+):$/);
                if (deviceMatch && !line.includes('Devices:')) {
                    currentDevice = deviceMatch[1].trim();
                    isInput = false;
                    isOutput = false;
                }

                if (line.includes('Input Channels:') && currentDevice) {
                    isInput = true;
                }
                if (line.includes('Output Channels:') && currentDevice) {
                    isOutput = true;
                }

                if (line.includes('Transport:') && currentDevice) {
                    if (isInput && !devices.input.includes(currentDevice)) {
                        devices.input.push(currentDevice);
                    }
                    if (isOutput && !devices.output.includes(currentDevice)) {
                        devices.output.push(currentDevice);
                    }
                }
            }

            return devices;
        } catch (error) {
            console.error('Error getting audio devices:', error);
            return { input: [], output: [] };
        }
    }

    async verifyDevices() {
        const devices = await this.getAudioDevices();
        const status = {
            blackhole: devices.input.includes('BlackHole 2ch') && devices.output.includes('BlackHole 2ch'),
            loopback: devices.input.includes('Loopback Audio') && devices.output.includes('Loopback Audio'),
            microphone: this.sources.mic.device !== null
        };

        console.log('Audio device verification:');
        console.log('  BlackHole 2ch:', status.blackhole ? '✓' : '✗');
        console.log('  Loopback Audio:', status.loopback ? '✓' : '✗');
        console.log('  Microphone:', status.microphone ? '✓' : '✗');

        return status;
    }

    async cleanup() {
        this.stopMonitoring();
        await this.unmuteAll();
        console.log('Audio manager cleaned up');
    }
}

module.exports = AudioManager;
