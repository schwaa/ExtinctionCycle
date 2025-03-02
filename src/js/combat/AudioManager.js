export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.soundPool = new Map();
        this.poolSize = 3;
        this.isMuted = false;
        this.volume = 0.5;
        
        this.initializeSounds();
    }

    initializeSounds() {
        const audio = document.getElementById('timerSound');
        if (audio) {
            this.sounds.set('timerSound', audio);
            this.createSoundPool('timerSound', audio);
        }
    }

    createSoundPool(id, originalSound) {
        const pool = [];
        for (let i = 0; i < this.poolSize; i++) {
            const clone = originalSound.cloneNode(true);
            clone.volume = this.volume;
            pool.push(clone);
        }
        this.soundPool.set(id, pool);
    }

    playSound(soundId) {
        if (this.isMuted || soundId !== 'timerSound') return;

        const pool = this.soundPool.get(soundId);
        if (!pool) return;

        // Find an available sound from the pool
        const sound = pool.find(s => s.paused) || pool[0];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`Failed to play sound ${soundId}:`, error);
            });
        }
    }

    stopSound(soundId) {
        const pool = this.soundPool.get(soundId);
        if (pool) {
            pool.forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
        }
    }

    stopAllSounds() {
        this.soundPool.forEach(pool => {
            pool.forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
        });
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.soundPool.forEach(pool => {
            pool.forEach(sound => {
                sound.volume = this.volume;
            });
        });
    }

    mute() {
        this.isMuted = true;
        this.soundPool.forEach(pool => {
            pool.forEach(sound => {
                sound.muted = true;
            });
        });
    }

    unmute() {
        this.isMuted = false;
        this.soundPool.forEach(pool => {
            pool.forEach(sound => {
                sound.muted = false;
            });
        });
    }

    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.isMuted;
    }
}
