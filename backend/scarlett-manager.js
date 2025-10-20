const EventEmitter = require('events');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ScarlettManager extends EventEmitter {
    constructor() {
        super();

        this.scarlettName = null;
        this.connected = false;
        this.sampleRate = 48000;
        this.inputChannels = 0;
        this.outputChannels = 0;
        this.peakLevel = 0;
        this.monitoring = false;

        this.detectScarlett();
    }

    async detectScarlett() {
        try {
            const { stdout } = await execPromise('system_profiler SPAudioDataType');

            // Look for Scarlett device
            const lines = stdout.split('\n');
            let foundScarlett = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/scarlett/i) && lines[i].includes(':')) {
                    this.scarlettName = lines[i].trim().replace(':', '');
                    foundScarlett = true;

                    // Extract device info from following lines
                    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                        if (lines[j].includes('Current SampleRate:')) {
                            this.sampleRate = parseInt(lines[j].split(':')[1].trim());
                        }
                        if (lines[j].includes('Input Channels:')) {
                            this.inputChannels = parseInt(lines[j].split(':')[1].trim());
                        }
                        if (lines[j].includes('Output Channels:')) {
                            this.outputChannels = parseInt(lines[j].split(':')[1].trim());
                        }
                    }
                    break;
                }
            }

            if (foundScarlett) {
                this.connected = true;
                console.log(`Scarlett Solo detected: ${this.scarlettName}`);
                console.log(`  Sample Rate: ${this.sampleRate} Hz`);
                console.log(`  Channels: ${this.inputChannels} in, ${this.outputChannels} out`);
                this.emit('connected', this.getInfo());
            } else {
                this.connected = false;
                console.log('Scarlett Solo not detected');
            }
        } catch (error) {
            console.error('Error detecting Scarlett:', error);
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected;
    }

    getInfo() {
        return {
            name: this.scarlettName,
            connected: this.connected,
            sampleRate: this.sampleRate,
            inputChannels: this.inputChannels,
            outputChannels: this.outputChannels
        };
    }

    async setAsDefaultDevice() {
        // macOS requires GUI interaction to set default device
        // Open System Settings to Sound preferences
        try {
            await execPromise('open "x-apple.systempreferences:com.apple.preference.sound"');
            console.log('Opened System Settings - please set Scarlett as default manually');
            return true;
        } catch (error) {
            console.error('Error opening System Settings:', error);
            return false;
        }
    }

    async checkSampleRate() {
        try {
            const { stdout } = await execPromise('system_profiler SPAudioDataType');
            const scarlettInfo = stdout.split('\n')
                .slice(stdout.indexOf(this.scarlettName))
                .slice(0, 15)
                .join('\n');

            const rateMatch = scarlettInfo.match(/Current SampleRate:\s+(\d+)/);
            if (rateMatch) {
                const rate = parseInt(rateMatch[1]);
                if (rate !== 48000) {
                    console.warn(`Scarlett sample rate is ${rate} Hz (recommended: 48000 Hz)`);
                    this.emit('sample-rate-warning', rate);
                    return false;
                }
                return true;
            }
        } catch (error) {
            console.error('Error checking sample rate:', error);
        }
        return false;
    }

    startMonitoring(interval = 100) {
        if (this.monitoring) return;

        this.monitoring = true;
        console.log('Started Scarlett level monitoring');

        // In a real implementation, this would use CoreAudio or similar
        // to get actual input levels. For now, we'll emit simulated data.
        this.monitorInterval = setInterval(() => {
            // Simulate audio level (in production, read from actual device)
            const level = Math.random() * 100;
            this.peakLevel = Math.max(this.peakLevel * 0.95, level);

            this.emit('input-level', {
                instantaneous: level,
                peak: this.peakLevel,
                db: level > 0 ? 20 * Math.log10(level / 100) : -Infinity
            });
        }, interval);
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitoring = false;
            console.log('Stopped Scarlett level monitoring');
        }
    }

    async getGainRecommendation(currentLevel) {
        // Provide gain adjustment recommendations
        const db = currentLevel > 0 ? 20 * Math.log10(currentLevel / 100) : -Infinity;

        if (db > -3) {
            return {
                status: 'too_high',
                message: 'Gain too high - reduce GAIN knob',
                color: 'red',
                action: 'Turn down GAIN knob 1-2 notches'
            };
        } else if (db > -12) {
            return {
                status: 'optimal',
                message: 'Optimal gain level',
                color: 'green',
                action: 'No adjustment needed'
            };
        } else if (db > -20) {
            return {
                status: 'low',
                message: 'Gain could be higher',
                color: 'yellow',
                action: 'Turn up GAIN knob slightly'
            };
        } else {
            return {
                status: 'too_low',
                message: 'Gain too low - increase GAIN knob',
                color: 'red',
                action: 'Turn up GAIN knob significantly'
            };
        }
    }

    async verifyRouting() {
        // Verify complete audio routing chain
        const checks = {
            scarlett: false,
            blackhole: false,
            loopback: false,
            multiOutput: false
        };

        try {
            const { stdout } = await execPromise('system_profiler SPAudioDataType');

            checks.scarlett = stdout.includes(this.scarlettName);
            checks.blackhole = stdout.includes('BlackHole 2ch');
            checks.loopback = stdout.includes('Loopback Audio');
            checks.multiOutput = stdout.includes('Multi-Output');

            const allOk = Object.values(checks).every(v => v);

            this.emit('routing-check', {
                checks,
                status: allOk ? 'complete' : 'incomplete',
                message: allOk
                    ? 'All audio devices present and configured'
                    : 'Some audio devices missing'
            });

            return checks;
        } catch (error) {
            console.error('Error verifying routing:', error);
            return checks;
        }
    }

    cleanup() {
        this.stopMonitoring();
        console.log('Scarlett manager cleaned up');
    }
}

module.exports = ScarlettManager;
