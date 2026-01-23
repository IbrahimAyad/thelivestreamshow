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

        // ElevenLabs configuration
        this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || 'sk_97a034f5f818f41867c429f5492f0eb97466afafa5eb3dde';
        this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || 'DTKMou8ccj1ZaWGBiotd'; // Jamahal - Professional male voice

        this.active = false;
        this.voice = this.elevenLabsVoiceId; // Use ElevenLabs voice ID
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
            // Generate speech using ElevenLabs TTS (professional broadcast quality)
            console.log('🎤 [BetaBot] Generating TTS with ElevenLabs...');
            console.log(`📝 Text length: ${text.length} chars`);
            console.log(`🎙️ Voice ID: ${this.elevenLabsVoiceId}`);

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': this.elevenLabsApiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_turbo_v2_5', // Fastest model for live streaming
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ [BetaBot] TTS response received');

            // Get audio buffer
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Save to temp file
            const tempFile = path.join(__dirname, 'temp_audio.mp3');
            await fs.promises.writeFile(tempFile, buffer);

            // Play audio through BlackHole or system output
            await this.playAudio(tempFile);

            // Clean up
            await fs.promises.unlink(tempFile);

            console.log('✅ [BetaBot] Playback finished');
            this.state = 'listening';
            this.emit('listening');
        } catch (error) {
            console.error('❌ [BetaBot] Error in text-to-speech:', error);
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
