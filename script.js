/* =============================================
   QR MUSIC PLAYER - SCRIPT.JS
   Logika pemutar musik dengan visualizer,
   partikel animasi, dan efek premium
   ============================================= */

// =============================================
// 1. DATA PLAYLIST
// =============================================
// 📝 CARA MENAMBAH LAGU:
// Tambahkan objek baru ke array ini dengan format:
// {
//     title: "Judul Lagu",
//     artist: "Nama Artis",
//     src: "music/nama-file.mp3",
//     cover: "images/nama-cover.jpg"   // opsional, akan auto-detect jika tidak ada
// }
// Pastikan file MP3 sudah ada di folder music/

const playlist = [
    {
        title: "Lagu Pertama",
        artist: "Artis 1",
        src: "music/112.mp3",
        cover: "images/placeholder.svg" // Bisa diisi path cover spesifik, atau biarkan auto-detect
    },
    {
        title: "Lagu Kedua",
        artist: "Artis 2",
        src: "music/113.mp3",
        cover: "images/placeholder.svg" // Bisa diisi path cover spesifik, atau biarkan auto-detect
    },
    {
        title: "Lagu Ketiga",
        artist: "Artis 3",
        src: "music/114.mp3",
        cover: "images/placeholder.svg" // Bisa diisi path cover spesifik, atau biarkan auto-detect
    }
];

// =============================================
// 2. STATE APLIKASI
// =============================================
const state = {
    currentIndex: 0,
    isPlaying: false,
    isShuffled: false,
    repeatMode: 'all', // default: loop all songs
    volume: 0.75,
    isMuted: false,
    previousVolume: 0.75,
    autoplayAllowed: false,
    consecutiveErrors: 0,
    // Visualizer state
    audioContext: null,
    analyserNode: null,
    sourceNode: null,
    visualizerRunning: false,
    visualizerGradient: null,
    // Background animation
    bgAngle: 135,
    bgTime: 0,
    // Particle state
    particles: [],
    particleColor: [108, 92, 231],
    particleAnimationId: null
};

// =============================================
// 3. ELEMEN DOM
// =============================================
const audio = document.getElementById('audioPlayer');
const elements = {
    autoplayOverlay: document.getElementById('autoplayOverlay'),
    btnEnablePlay: document.getElementById('btnEnablePlay'),
    albumCover: document.getElementById('albumCover'),
    vinylRecord: document.getElementById('vinylRecord'),
    playIndicator: document.getElementById('playIndicator'),
    songTitle: document.getElementById('songTitle'),
    songArtist: document.getElementById('songArtist'),
    bgBlur: document.getElementById('bgBlur'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    progressThumb: document.getElementById('progressThumb'),
    progressGlow: document.getElementById('progressGlow'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    btnPlay: document.getElementById('btnPlay'),
    playIcon: document.getElementById('playIcon'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnShuffle: document.getElementById('btnShuffle'),
    btnRepeat: document.getElementById('btnRepeat'),
    btnMute: document.getElementById('btnMute'),
    volumeIcon: document.getElementById('volumeIcon'),
    volumeWave: document.getElementById('volumeWave'),
    volumeRange: document.getElementById('volumeRange'),
    volumeFill: document.getElementById('volumeFill'),
    volumePercent: document.getElementById('volumePercent'),
    playlist: document.getElementById('playlist'),
    playlistCount: document.getElementById('playlistCount'),
    // Visualizer
    visualizer: document.getElementById('visualizer'),
    visualizerSection: document.getElementById('visualizerSection'),
    // Particles
    particleCanvas: document.getElementById('particleCanvas')
};

// =============================================
// 4. FUNGSI UTILITY
// =============================================

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Mengekstrak nama file tanpa ekstensi dari path
 */
function getFilenameWithoutExt(filepath) {
    return filepath.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '');
}

/**
 * Auto-detect cover image dari nama file MP3
 * Mencoba beberapa format file gambar umum
 * @param {string} mp3Src - Path file MP3
 * @returns {string} Path cover yang terdeteksi
 */
/**
 * Ekstensi gambar yang akan dicoba untuk auto-detect cover
 */
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Auto-detect cover image dari nama file MP3
 * Mengembalikan array kandidat path gambar yang mungkin
 * @param {string} mp3Src - Path file MP3
 * @returns {string[]} Array path cover candidates
 */
function autoDetectCovers(mp3Src) {
    const basename = getFilenameWithoutExt(mp3Src);
    return COVER_EXTENSIONS.map(ext => `images/${basename}.${ext}`);
}

/**
 * Auto-detect cover (shortcut, hanya mengembalikan path .jpg pertama)
 * @param {string} mp3Src
 * @returns {string}
 */
function autoDetectCover(mp3Src) {
    const basename = getFilenameWithoutExt(mp3Src);
    return `images/${basename}.jpg`;
}

/**
 * Menampilkan notifikasi toast
 * @param {string} message - Pesan yang ditampilkan
 * @param {string} type - 'error' atau 'info'
 */
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'rgba(255, 71, 87, 0.92)' : 'rgba(108, 92, 231, 0.92)'};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 999;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        animation: toastIn 0.3s ease;
        text-align: center;
        max-width: 90%;
        pointer-events: none;
        font-family: 'Inter', sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, type === 'error' ? 3500 : 2000);
}

// =============================================
// 5. PARTICLE BACKGROUND SYSTEM
// =============================================

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.baseSize = Math.random() * 4 + 2;
        this.size = this.baseSize;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
        // Glow: beberapa partikel punya glow lebih besar
        this.hasGlow = Math.random() > 0.7;
        this.glowSize = this.baseSize * (Math.random() * 4 + 3);
    }

    update() {
        this.x += this.speedX + Math.sin(state.bgTime * 0.3 + this.pulse) * 0.1;
        this.y += this.speedY + Math.cos(state.bgTime * 0.2 + this.pulse) * 0.1;
        this.pulse += this.pulseSpeed;

        // Lebar-kecil animasi
        this.size = this.baseSize * (0.8 + 0.2 * Math.sin(this.pulse * 2));

        // Wrap around edges
        if (this.x < -20) this.x = this.canvas.width + 20;
        if (this.x > this.canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = this.canvas.height + 20;
        if (this.y > this.canvas.height + 20) this.y = -20;

        // Pulse opacity
        this.currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.pulse));
    }

    draw(ctx) {
        const [r, g, b] = state.particleColor;

        // Glow effect (untuk partikel tertentu)
        if (this.hasGlow) {
            const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowSize);
            glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.currentOpacity * 0.3})`);
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
        }

        // Core particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)}, ${this.currentOpacity})`;
        ctx.fill();

        // Bright center
        if (this.size > 2) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.currentOpacity * 0.5})`;
            ctx.fill();
        }
    }
}

function initParticles() {
    if (!elements.particleCanvas) return;
    const canvas = elements.particleCanvas;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    // Buat partikel
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 60);
    state.particles = [];
    for (let i = 0; i < count; i++) {
        state.particles.push(new Particle(canvas));
    }

    // Animasi loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        state.particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        // Gambar garis antar partikel yang berdekatan
        for (let i = 0; i < state.particles.length; i++) {
            for (let j = i + 1; j < state.particles.length; j++) {
                const dx = state.particles[i].x - state.particles[j].x;
                const dy = state.particles[i].y - state.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    const [r, g, b] = state.particleColor;
                    const opacity = (1 - dist / 120) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(state.particles[i].x, state.particles[i].y);
                    ctx.lineTo(state.particles[j].x, state.particles[j].y);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // --- Animasi background gradient ---
        // Rotasi perlahan sudut gradien dan geser warna
        state.bgTime += 0.002;
        state.bgAngle = 135 + Math.sin(state.bgTime * 0.5) * 25;

        const shift = Math.sin(state.bgTime) * 12;
        const shift2 = Math.cos(state.bgTime * 0.7) * 8;

        // Semua warna bergeser perlahan untuk efek hidup
        const r1 = Math.max(0, Math.min(255, _bgDarkColor[0] + shift));
        const g1 = Math.max(0, Math.min(255, _bgDarkColor[1] + shift2));
        const b1 = Math.max(0, Math.min(255, _bgDarkColor[2] + shift));
        const r2 = Math.max(0, Math.min(255, _bgMidColor[0] + shift2));
        const g2 = Math.max(0, Math.min(255, _bgMidColor[1] + shift));
        const b2 = Math.max(0, Math.min(255, _bgMidColor[2] + shift2));

        elements.bgBlur.style.background = `
            linear-gradient(${state.bgAngle}deg,
                rgb(${r1}, ${g1}, ${b1}) 0%,
                rgb(${r2}, ${g2}, ${b2}) 50%,
                rgb(${_bgLightColor[0]}, ${_bgLightColor[1]}, ${_bgLightColor[2]}) 100%
            )
        `;

        state.particleAnimationId = requestAnimationFrame(animateParticles);
    }

    animateParticles();
}

/**
 * Update warna partikel berdasarkan warna cover lagu
 */
function updateParticleColor(r, g, b) {
    state.particleColor = [r, g, b];
}

// =============================================
// 6. AUDIO VISUALIZER
// =============================================

/**
 * Inisialisasi Web Audio API untuk visualizer
 */
function initVisualizer() {
    if (state.audioContext) return;

    try {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        state.analyserNode = state.audioContext.createAnalyser();
        state.analyserNode.fftSize = 128;

        // Hubungkan audio element ke analyser
        state.sourceNode = state.audioContext.createMediaElementSource(audio);
        state.sourceNode.connect(state.analyserNode);
        state.analyserNode.connect(state.audioContext.destination);

        // Setup canvas gradient
        updateVisualizerGradient([108, 92, 231], [162, 155, 254]);

        startVisualizer();
    } catch (err) {
        console.warn('Visualizer tidak tersedia:', err);
    }
}

/**
 * Resume AudioContext (harus dari user gesture)
 */
function resumeVisualizer() {
    if (state.audioContext && state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
}

/**
 * Update gradient warna visualizer
 */
function updateVisualizerGradient(color1, color2) {
    const canvas = elements.visualizer;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`);
    gradient.addColorStop(0.5, `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`);
    gradient.addColorStop(1, `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`);
    state.visualizerGradient = gradient;
}

/**
 * Mendapatkan ukuran visualizer canvas yang tepat
 */
function resizeVisualizer() {
    const canvas = elements.visualizer;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
}

/**
 * Memulai animasi visualizer
 */
function startVisualizer() {
    if (state.visualizerRunning) return;
    state.visualizerRunning = true;

    const canvas = elements.visualizer;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    elements.visualizer.classList.add('active');

    function draw() {
        if (!state.visualizerRunning) return;

        // Hitung ulang dimensi setiap frame untuk mengantisipasi resize
        const currentWidth = canvas.width / (window.devicePixelRatio || 1);
        const currentHeight = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, currentWidth, currentHeight);

        if (state.analyserNode) {
            const bufferLength = state.analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            state.analyserNode.getByteFrequencyData(dataArray);

            const barWidth = (currentWidth / bufferLength) * 1.5;
            const centerY = currentHeight / 2;

            // Gambar bar dengan efek rounded
            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i] / 255;
                const barHeight = Math.max(2, value * currentHeight * 0.85);
                const x = i * barWidth + 2;

                // Efek gradient vertikal per bar
                const grad = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2);
                const opacity = 0.4 + value * 0.6;
                grad.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`);
                grad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
                grad.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.3})`);

                // Bar dengan rounded top/bottom (dengan fallback roundRect)
                const barW = Math.max(1, barWidth - 2);
                const radius = Math.min(barW / 2, 3);
                const barY = centerY - barHeight / 2;

                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(x, barY, barW, barHeight, radius);
                } else {
                    // Fallback untuk browser tua
                    ctx.rect(x, barY, barW, barHeight);
                }
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        state.visualizerAnimationId = requestAnimationFrame(draw);
    }

    draw();
}

/**
 * Hentikan visualizer
 */
function stopVisualizer() {
    state.visualizerRunning = false;
    if (state.visualizerAnimationId) {
        cancelAnimationFrame(state.visualizerAnimationId);
        state.visualizerAnimationId = null;
    }
    elements.visualizer.classList.remove('active');

    // Bersihkan canvas
    const canvas = elements.visualizer;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// =============================================
// 7. AUTOPLAY HANDLER
// =============================================

function checkAutoplay() {
    audio.volume = 0;
    audio.play()
        .then(() => {
            state.autoplayAllowed = true;
            audio.pause();
            audio.volume = state.volume;
            audio.currentTime = 0;
            elements.autoplayOverlay.classList.remove('active');
            loadSong(state.currentIndex);
            togglePlay();
        })
        .catch(() => {
            state.autoplayAllowed = false;
            audio.volume = state.volume;
            elements.autoplayOverlay.classList.add('active');
            loadSong(state.currentIndex);
        });
}

elements.btnEnablePlay.addEventListener('click', () => {
    elements.autoplayOverlay.classList.remove('active');
    togglePlay();
});

// =============================================
// 8. FUNGSI MANAJEMEN LAGU
// =============================================

/**
 * Memuat lagu berdasarkan index
 * @param {number} index - Index lagu di playlist
 */
function loadSong(index) {
    const song = playlist[index];
    if (!song) return;

    // Update sumber audio
    audio.src = song.src;
    audio.load();

    // Update tampilan
    elements.songTitle.textContent = song.title;
    elements.songArtist.textContent = song.artist;

    // Load cover image — jika punya cover spesifik, coba dulu
    const coverPath = song.cover || autoDetectCover(song.src);
    loadCoverImage(coverPath, song);

    // Update background blur (dengan path awal, akan diupdate lagi jika cover ditemukan)
    updateBackground(coverPath);

    // Update playlist highlight
    updatePlaylistActive(index);

    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.progressThumb.style.left = '0%';
    elements.progressGlow.style.width = '0%';
    elements.currentTime.textContent = '0:00';
    elements.duration.textContent = '0:00';

    state.currentIndex = index;
    document.title = `${song.title} - ${song.artist} | 🎵 QR Music Player`;

    // Reset error counter saat pindah lagu
    state.consecutiveErrors = 0;
}

/**
 * Mencoba memuat cover image dengan fallback ke multiple format
 * Urutan: auto-detect (.jpg, .jpeg, .png, .webp) -> explicit cover path -> placeholder
 *
 * Jika song.cover === 'images/placeholder.svg' (default), langsung mulai dari auto-detect
 * agar cover asli bisa ditemukan jika file gambarnya ada.
 */
function loadCoverImage(primaryPath, song) {
    const candidates = [];

    // Jika primaryPath adalah placeholder default, jadikan auto-detect sebagai prioritas
    if (primaryPath === 'images/placeholder.svg') {
        candidates.push(...autoDetectCovers(song.src));
    } else {
        candidates.push(primaryPath);
        const detectedCandidates = autoDetectCovers(song.src);
        if (!detectedCandidates.includes(primaryPath)) {
            candidates.push(...detectedCandidates);
        }
    }

    // Tambahkan placeholder sebagai fallback terakhir
    candidates.push('images/placeholder.svg');

    tryLoadCover(0, candidates, song);
}

/**
 * Rekursif mencoba memuat cover dari daftar kandidat
 */
function tryLoadCover(index, candidates, song) {
    if (index >= candidates.length) return;

    const img = new Image();
    img.onload = function () {
        elements.albumCover.src = candidates[index];
        elements.albumCover.alt = `${song.title} - ${song.artist}`;
        elements.albumCover.onerror = null;
        // Update background dengan cover yang berhasil dimuat
        updateBackground(candidates[index]);
    };
    img.onerror = function () {
        // Coba kandidat berikutnya
        tryLoadCover(index + 1, candidates, song);
    };
    img.src = candidates[index];
}

/**
 * Mengekstrak warna dominan dari gambar cover
 * Mengambil sampel dari grid 5x5 pixel rata-rata
 * @param {string} coverSrc - Path ke gambar cover
 * @returns {Promise<number[]>} [r, g, b]
 */
function extractDominantColor(coverSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = coverSrc;

        img.onload = function () {
            const canvas = document.createElement('canvas');
            const size = 5; // Grid 5x5
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);

            const imageData = ctx.getImageData(0, 0, size, size).data;
            let totalR = 0, totalG = 0, totalB = 0, count = 0;

            for (let i = 0; i < imageData.length; i += 4) {
                totalR += imageData[i];
                totalG += imageData[i + 1];
                totalB += imageData[i + 2];
                count++;
            }

            resolve([
                Math.round(totalR / count),
                Math.round(totalG / count),
                Math.round(totalB / count)
            ]);
        };

        img.onerror = function () {
            resolve([108, 92, 231]); // Default purple
        };
    });
}

/**
 * Memperbarui background blur dengan ekstraksi warna dari cover
 */
// Warna background yang tersimpan untuk animasi
let _bgDarkColor = [0, 0, 15];
let _bgMidColor = [26, 26, 46];
let _bgLightColor = [10, 10, 15];

function updateBackground(coverSrc) {
    extractDominantColor(coverSrc).then(([r, g, b]) => {
        // Simpan warna untuk animasi
        _bgDarkColor = [Math.max(r - 50, 0), Math.max(g - 50, 0), Math.max(b - 50, 0)];
        _bgMidColor = [r, g, b];
        _bgLightColor = [Math.max(r - 30, 0), Math.max(g - 30, 0), Math.max(b - 30, 0)];

        // Set initial background
        elements.bgBlur.style.background = `
            linear-gradient(${state.bgAngle}deg,
                rgb(${_bgDarkColor[0]}, ${_bgDarkColor[1]}, ${_bgDarkColor[2]}) 0%,
                rgb(${_bgMidColor[0]}, ${_bgMidColor[1]}, ${_bgMidColor[2]}) 50%,
                rgb(${_bgLightColor[0]}, ${_bgLightColor[1]}, ${_bgLightColor[2]}) 100%
            )
        `;

        // Update visualizer gradient
        updateVisualizerGradient(
            [Math.min(r + 40, 255), Math.min(g + 40, 255), Math.min(b + 40, 255)],
            [r, g, b]
        );

        // Update particle color
        updateParticleColor(
            Math.min(r + 30, 255),
            Math.min(g + 30, 255),
            Math.min(b + 30, 255)
        );
    });
}

function getNextIndex() {
    if (state.repeatMode === 'one') {
        return state.currentIndex;
    }

    let nextIndex;
    if (state.isShuffled) {
        do {
            nextIndex = Math.floor(Math.random() * playlist.length);
        } while (nextIndex === state.currentIndex && playlist.length > 1);
    } else {
        nextIndex = state.currentIndex + 1;
        if (nextIndex >= playlist.length) {
            if (state.repeatMode === 'all') {
                nextIndex = 0;
            } else {
                return state.currentIndex;
            }
        }
    }
    return nextIndex;
}

function getPrevIndex() {
    if (state.isShuffled) {
        return Math.floor(Math.random() * playlist.length);
    }
    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
        prevIndex = playlist.length - 1;
    }
    return prevIndex;
}

// =============================================
// 9. FUNGSI PLAYBACK
// =============================================

function togglePlay() {
    if (audio.src === '' || !audio.src) {
        loadSong(0);
    }

    if (audio.paused) {
        // Inisialisasi visualizer saat pertama kali play
        if (!state.audioContext) {
            initVisualizer();
        } else {
            resumeVisualizer();
        }

        audio.play().catch(err => {
            console.warn('Playback gagal:', err);
            elements.autoplayOverlay.classList.add('active');
        });
    } else {
        audio.pause();
    }
}

function updatePlayButton() {
    if (audio.paused) {
        state.isPlaying = false;
        elements.playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        elements.vinylRecord.classList.remove('playing');
        elements.playIndicator.classList.remove('active');
        elements.btnPlay.setAttribute('aria-label', 'Putar');
        elements.btnPlay.title = 'Putar';
    } else {
        state.isPlaying = true;
        elements.playIcon.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';
        elements.vinylRecord.classList.add('playing');
        elements.playIndicator.classList.add('active');
        elements.btnPlay.setAttribute('aria-label', 'Jeda');
        elements.btnPlay.title = 'Jeda';
    }
}

function playNext() {
    const nextIndex = getNextIndex();
    loadSong(nextIndex);
    audio.play().catch(err => console.warn('Playback gagal:', err));
}

function playPrev() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    const prevIndex = getPrevIndex();
    loadSong(prevIndex);
    audio.play().catch(err => console.warn('Playback gagal:', err));
}

function setVolume(value) {
    state.volume = Math.max(0, Math.min(1, value));
    audio.volume = state.volume;
    state.isMuted = false;

    elements.volumeFill.style.width = `${state.volume * 100}%`;
    elements.volumeRange.value = state.volume;
    elements.volumePercent.textContent = `${Math.round(state.volume * 100)}%`;

    updateVolumeIcon();
}

function toggleMute() {
    if (state.isMuted) {
        state.isMuted = false;
        setVolume(state.previousVolume || 0.75);
    } else {
        state.isMuted = true;
        state.previousVolume = state.volume;
        audio.volume = 0;
        elements.volumeFill.style.width = '0%';
        elements.volumeRange.value = 0;
        elements.volumePercent.textContent = '0%';
        updateVolumeIcon();
    }
}

function updateVolumeIcon() {
    if (state.isMuted || state.volume === 0) {
        elements.volumeIcon.innerHTML = `
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"/>
        `;
        elements.volumeWave.style.display = 'none';
    } else if (state.volume < 0.5) {
        elements.volumeIcon.innerHTML = `
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        `;
        elements.volumeWave.style.display = 'block';
    } else {
        elements.volumeIcon.innerHTML = `
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        `;
        elements.volumeWave.style.display = 'block';
    }
}

// =============================================
// 10. FUNGSI PLAYLIST UI
// =============================================

function renderPlaylist() {
    elements.playlist.innerHTML = '';
    elements.playlistCount.textContent = `${playlist.length} lagu`;

    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.style.listStyle = 'none';

        const button = document.createElement('button');
        button.className = 'playlist-item';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', index === state.currentIndex);
        button.dataset.index = index;

        const numSpan = document.createElement('span');
        numSpan.className = 'playlist-num';
        numSpan.textContent = index + 1;

        const playingIcon = document.createElement('span');
        playingIcon.className = 'playlist-playing-icon';

        // Thumbnail kecil — pakai placeholder.svg sebagai default,
        // lalu coba auto-detect cover dari nama file MP3
        const img = document.createElement('img');
        img.className = 'playlist-item-img';
        img.alt = song.title;
        img.loading = 'lazy';

        const isDefaultCover = !song.cover || song.cover === 'images/placeholder.svg';

        if (isDefaultCover) {
            // Mulai dari auto-detect (jpg, jpeg, png, webp), fallback ke placeholder
            const candidates = autoDetectCovers(song.src);
            let attempt = 0;
            img.src = candidates[0];
            img.onerror = function () {
                attempt++;
                if (attempt < candidates.length) {
                    this.src = candidates[attempt];
                } else {
                    this.src = 'images/placeholder.svg';
                    this.onerror = null;
                }
            };
        } else {
            // Ada cover eksplisit, coba dulu, baru fallback
            img.src = song.cover;
            img.onerror = function () {
                // Coba auto-detect
                const candidates = autoDetectCovers(song.src);
                this.src = candidates[0];
                let attempt = 0;
                this.onerror = function () {
                    attempt++;
                    if (attempt < candidates.length) {
                        this.src = candidates[attempt];
                    } else {
                        this.src = 'images/placeholder.svg';
                        this.onerror = null;
                    }
                };
            };
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'playlist-item-info';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'playlist-item-title';
        titleDiv.textContent = song.title;

        const artistDiv = document.createElement('div');
        artistDiv.className = 'playlist-item-artist';
        artistDiv.textContent = song.artist;

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(artistDiv);

        button.appendChild(numSpan);
        button.appendChild(playingIcon);
        button.appendChild(img);
        button.appendChild(infoDiv);

        button.addEventListener('click', () => {
            if (index === state.currentIndex) {
                togglePlay();
            } else {
                // Resize visualizer saat pindah lagu (ukuran canvas mungkin berubah)
                loadSong(index);
                audio.play().catch(err => console.warn('Playback gagal:', err));
            }
        });

        li.appendChild(button);
        elements.playlist.appendChild(li);
    });

    updatePlaylistActive(state.currentIndex);
}

function updatePlaylistActive(index) {
    const items = elements.playlist.querySelectorAll('.playlist-item');
    items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
        item.setAttribute('aria-selected', i === index);
    });
}

// =============================================
// 11. FUNGSI PROGRESS BAR
// =============================================

function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        elements.progressFill.style.width = `${percent}%`;
        elements.progressThumb.style.left = `${percent}%`;
        elements.progressGlow.style.width = `${percent}%`;
        elements.currentTime.textContent = formatTime(audio.currentTime);
        elements.duration.textContent = formatTime(audio.duration);
    }
}

function seekAudio(e) {
    const rect = elements.progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));

    if (audio.duration) {
        audio.currentTime = percent * audio.duration;
    }
}

// =============================================
// 12. FUNGSI SHUFFLE & REPEAT
// =============================================

function toggleShuffle() {
    state.isShuffled = !state.isShuffled;
    elements.btnShuffle.classList.toggle('active', state.isShuffled);
    elements.btnShuffle.setAttribute('aria-label', state.isShuffled ? 'Acak (aktif)' : 'Acak');
    elements.btnShuffle.title = state.isShuffled ? 'Acak (aktif)' : 'Acak';
}

function toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    state.repeatMode = modes[nextIndex];

    elements.btnRepeat.classList.toggle('active', state.repeatMode !== 'none');
    elements.btnRepeat.setAttribute('data-repeat', state.repeatMode);
    elements.btnRepeat.setAttribute('aria-label', `Ulangi: ${state.repeatMode}`);
    elements.btnRepeat.title = `Ulangi: ${state.repeatMode}`;

    const svg = elements.btnRepeat.querySelector('svg');
    if (state.repeatMode === 'one') {
        svg.innerHTML = `
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            <text x="13" y="18" font-size="7" font-weight="bold" fill="currentColor">1</text>
        `;
    } else {
        svg.innerHTML = `
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        `;
    }
}

// =============================================
// 13. EVENT LISTENERS
// =============================================

// --- Audio events ---
audio.addEventListener('play', updatePlayButton);
audio.addEventListener('pause', updatePlayButton);

audio.addEventListener('ended', () => {
    // Visualizer tetap jalan untuk lagu berikutnya
    playNext();
});

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', () => {
    elements.duration.textContent = formatTime(audio.duration);
    // Resize visualizer canvas saat metadata loaded
    resizeVisualizer();
});

/**
 * Handler error audio dengan pencegahan infinite loop
 */
audio.addEventListener('error', () => {
    console.warn('Gagal memuat audio:', audio.src);
    state.consecutiveErrors++;

    if (state.consecutiveErrors >= playlist.length) {
        showToast('❌ Tidak dapat memuat lagu. Pastikan file MP3 tersedia di folder /music/', 'error');
        state.isPlaying = false;
        updatePlayButton();
        return;
    }

    showToast(`❌ Gagal memuat: ${playlist[state.currentIndex]?.title || 'Lagu'}. Melewati ke lagu berikutnya...`, 'error');

    setTimeout(() => {
        playNext();
    }, 1500);
});

audio.addEventListener('playing', () => {
    state.consecutiveErrors = 0;
    // Pastikan visualizer aktif
    if (state.audioContext && state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
});

// --- Control buttons ---
elements.btnPlay.addEventListener('click', togglePlay);
elements.btnNext.addEventListener('click', playNext);
elements.btnPrev.addEventListener('click', playPrev);
elements.btnShuffle.addEventListener('click', toggleShuffle);
elements.btnRepeat.addEventListener('click', toggleRepeat);
elements.btnMute.addEventListener('click', toggleMute);

// --- Volume control ---
elements.volumeRange.addEventListener('input', (e) => {
    setVolume(parseFloat(e.target.value));
});

// --- Progress bar ---
elements.progressBar.addEventListener('click', seekAudio);

// Drag untuk progress bar (desktop)
let isDraggingProgress = false;

elements.progressBar.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    elements.progressThumb.classList.add('dragging');
    seekAudio(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) {
        seekAudio(e);
    }
});

document.addEventListener('mouseup', () => {
    if (isDraggingProgress) {
        isDraggingProgress = false;
        elements.progressThumb.classList.remove('dragging');
    }
});

// Drag untuk progress bar (mobile/touch)
elements.progressBar.addEventListener('touchstart', (e) => {
    isDraggingProgress = true;
    elements.progressThumb.classList.add('dragging');
    seekAudio(e.touches[0]);
});

elements.progressBar.addEventListener('touchmove', (e) => {
    if (isDraggingProgress) {
        e.preventDefault();
        seekAudio(e.touches[0]);
    }
}, { passive: false });

elements.progressBar.addEventListener('touchend', () => {
    if (isDraggingProgress) {
        isDraggingProgress = false;
        elements.progressThumb.classList.remove('dragging');
    }
});

// Resize visualizer saat ukuran jendela berubah
window.addEventListener('resize', resizeVisualizer);

// =============================================
// 14. KEYBOARD SHORTCUTS
// =============================================
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    switch (e.code) {
        case 'Space':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowRight':
            e.preventDefault();
            playNext();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            playPrev();
            break;
        case 'ArrowUp':
            e.preventDefault();
            setVolume(state.volume + 0.05);
            break;
        case 'ArrowDown':
            e.preventDefault();
            setVolume(state.volume - 0.05);
            break;
        case 'KeyM':
            toggleMute();
            break;
        case 'KeyS':
            toggleShuffle();
            break;
        case 'KeyR':
            toggleRepeat();
            break;
    }
});

// =============================================
// 15. INISIALISASI
// =============================================

function init() {
    // Setup partikel background
    initParticles();

    // Render playlist
    renderPlaylist();

    // Set volume awal
    setVolume(state.volume);

    // Set repeat mode default (all — loop semua lagu)
    state.repeatMode = 'all';
    elements.btnRepeat.classList.add('active');
    elements.btnRepeat.setAttribute('data-repeat', 'all');
    elements.btnRepeat.setAttribute('aria-label', 'Ulangi: semua');
    elements.btnRepeat.title = 'Ulangi: semua';

    // Setup canvas visualizer (tapi belum aktif)
    resizeVisualizer();

    // Cek autoplay
    checkAutoplay();

    console.log('🎵 QR Music Player siap!');
    console.log(`📋 ${playlist.length} lagu tersedia`);
    console.log('💡 Shortcut: Spasi=Play/Pause, ←/→=Prev/Next, ↑/↓=Volume, M=Mute, S=Shuffle, R=Repeat');
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', init);
