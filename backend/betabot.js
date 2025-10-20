const EventEmitter = require('events');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class BetaBot extends EventEmitter {
    constructor() {
        super();
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.active = false;
        this.voice = process.env.BETABOT_VOICE || 'onyx';
        this.model = process.env.BETABOT_MODEL || 'gpt-4';
        this.wakeWord = process.env.BETABOT_WAKE_WORD || 'Hey BetaBot';

        this.conversationHistory = [];
        this.systemPrompt = `You are BetaBot, an AI co-host for a live stream. You're knowledgeable, friendly, and engaging. You help answer viewer questions, provide insights, and keep the conversation flowing. Keep responses concise (1-3 sentences) unless a detailed explanation is requested. Be conversational and personable.`;

        this.state = 'idle'; // idle, listening, processing, speaking
    }

    async start() {
        console.log('Starting BetaBot...');
        this.active = true;
        this.state = 'listening';
        this.emit('listening');

        // In a real implementation, this would start the audio capture
        // For now, we'll simulate it
        console.log('BetaBot is now listening via Loopback Audio');
    }

    async stop() {
        console.log('Stopping BetaBot...');
        this.active = false;
        this.state = 'idle';
        this.emit('idle');
    }

    setVoice(voice) {
        this.voice = voice;
        console.log(`BetaBot voice set to: ${voice}`);
    }

    isActive() {
        return this.active;
    }

    getState() {
        return {
            active: this.active,
            state: this.state,
            voice: this.voice,
            model: this.model
        };
    }

    async processMessage(text, sender = 'User') {
        if (!this.active) {
            return null;
        }

        console.log(`Processing message from ${sender}: ${text}`);
        this.state = 'processing';
        this.emit('processing', text);
        this.emit('conversation', { sender, message: text });

        try {
            // Add message to history
            this.conversationHistory.push({
                role: 'user',
                content: text
            });

            // Keep only last 10 messages for context
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            // Get AI response
            const response = await this.getAIResponse(text);

            // Add response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

            // Convert to speech
            await this.speak(response);

            return response;
        } catch (error) {
            console.error('Error processing message:', error);
            this.emit('error', error);
            this.state = 'idle';
            return null;
        }
    }

    async getAIResponse(message) {
        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory,
            { role: 'user', content: message }
        ];

        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 150
        });

        return completion.choices[0].message.content;
    }

    async speak(text) {
        console.log(`BetaBot speaking: ${text}`);
        this.state = 'speaking';
        this.emit('speaking', text);
        this.emit('conversation', { sender: 'BetaBot', message: text });

        try {
            // Generate speech using OpenAI TTS
            const mp3Response = await this.openai.audio.speech.create({
                model: 'tts-1',
                voice: this.voice,
                input: text,
                speed: 1.0
            });

            // Get audio buffer
            const buffer = Buffer.from(await mp3Response.arrayBuffer());

            // Save to temp file
            const tempFile = path.join(__dirname, 'temp_audio.mp3');
            await fs.promises.writeFile(tempFile, buffer);

            // In a real implementation, this would play through BlackHole
            // For now, we'll use the system's audio output
            await this.playAudio(tempFile);

            // Clean up
            await fs.promises.unlink(tempFile);

            this.state = 'listening';
            this.emit('listening');
        } catch (error) {
            console.error('Error in text-to-speech:', error);
            this.emit('error', error);
            this.state = 'idle';
        }
    }

    async playAudio(filePath) {
        return new Promise((resolve, reject) => {
            // This is a placeholder. In production, you would use:
            // - sox to play through BlackHole device
            // - or stream directly to the audio device
            // - or use a library like 'play-sound' with device selection

            const { exec } = require('child_process');

            // macOS specific: play audio through BlackHole
            const device = process.env.AUDIO_OUTPUT_DEVICE || 'BlackHole 2ch';
            const command = `afplay "${filePath}"`;

            // For routing through specific device, use sox:
            // const command = `play "${filePath}" -d "${device}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    async transcribeAudio(audioBuffer) {
        // Transcribe audio using OpenAI Whisper
        try {
            const transcription = await this.openai.audio.transcriptions.create({
                file: audioBuffer,
                model: 'whisper-1',
                language: 'en'
            });

            return transcription.text;
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    detectWakeWord(text) {
        const normalizedText = text.toLowerCase();
        const normalizedWakeWord = this.wakeWord.toLowerCase();
        return normalizedText.includes(normalizedWakeWord);
    }

    clearHistory() {
        this.conversationHistory = [];
    }
}

module.exports = BetaBot;
