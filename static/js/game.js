/* =========================================================
   GAME.JS — Full Game Controller
   Handles API, keyboard, dropdown, SVG hangman, confetti,
   sound synthesis, score tracking, and micro-animations
   ========================================================= */

(function () {
    /* ---- State ---- */
    let category = 'Programming';
    let score = 0;
    let soundOn = true;
    let playing = false;
    let audioCtx = null;

    const BODY_PARTS = ['hm-head', 'hm-body', 'hm-larm', 'hm-rarm', 'hm-lleg', 'hm-rleg'];
    const CATEGORY_ICONS = {
        'Programming': 'fa-code',
        'Nature': 'fa-leaf',
        'Fruit': 'fa-apple-whole',
    };

    /* ============ INIT ============ */
    document.addEventListener('DOMContentLoaded', async () => {
        init3D();
        buildKeyboard();
        await loadCategories();
        setupEvents();
        startGame();
    });

    /* ============ AUDIO ============ */
    function ensureAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playTone(type) {
        if (!soundOn) return;
        ensureAudio();
        try {
            const now = audioCtx.currentTime;
            if (type === 'hit') {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'triangle';
                o.frequency.setValueAtTime(660, now);
                o.frequency.setValueAtTime(880, now + 0.06);
                g.gain.setValueAtTime(0.1, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                o.start(now); o.stop(now + 0.3);
            } else if (type === 'miss') {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(180, now);
                o.frequency.linearRampToValueAtTime(100, now + 0.2);
                g.gain.setValueAtTime(0.1, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                o.start(now); o.stop(now + 0.22);
            } else if (type === 'win') {
                [523, 659, 784, 1047, 1319].forEach((f, i) => {
                    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                    o.connect(g); g.connect(audioCtx.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(f, now + i * 0.07);
                    g.gain.setValueAtTime(0.08, now + i * 0.07);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);
                    o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.42);
                });
            } else if (type === 'lose') {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'sine';
                o.frequency.setValueAtTime(330, now);
                o.frequency.linearRampToValueAtTime(80, now + 0.7);
                g.gain.setValueAtTime(0.15, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                o.start(now); o.stop(now + 0.72);
            } else if (type === 'click') {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'sine';
                o.frequency.setValueAtTime(1200, now);
                g.gain.setValueAtTime(0.04, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                o.start(now); o.stop(now + 0.06);
            }
        } catch (e) { /* ignore */ }
    }

    /* ============ CATEGORIES ============ */
    async function loadCategories() {
        try {
            const r = await fetch('/api/categories');
            const d = await r.json();
            if (!d.success) return;
            const menu = document.getElementById('category-menu');
            menu.innerHTML = '';
            d.categories.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'dropdown-item' + (cat === category ? ' active' : '');
                item.dataset.cat = cat;
                const icon = CATEGORY_ICONS[cat] || 'fa-list';
                item.innerHTML = `<i class="fa-solid ${icon}"></i> ${cat}`;
                menu.appendChild(item);
            });
        } catch (e) { console.error(e); }
    }

    /* ============ EVENTS ============ */
    function setupEvents() {
        /* Sound toggle */
        document.getElementById('sound-toggle').addEventListener('click', () => {
            soundOn = !soundOn;
            document.getElementById('sound-icon').className =
                soundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        });

        /* New game button */
        document.getElementById('new-game-btn').addEventListener('click', () => {
            playTone('click');
            startGame();
        });

        /* Category dropdown */
        const wrapper = document.querySelector('.dropdown-wrapper');
        document.getElementById('category-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('open');
            playTone('click');
        });
        document.getElementById('category-menu').addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (!item) return;
            playTone('click');
            category = item.dataset.cat;
            document.getElementById('category-label').textContent = category;
            document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            wrapper.classList.remove('open');
            startGame();
        });
        document.addEventListener('click', () => wrapper.classList.remove('open'));

        /* Keyboard clicks */
        document.getElementById('keyboard').addEventListener('click', (e) => {
            const key = e.target.closest('.key');
            if (!key || key.classList.contains('hit') || key.classList.contains('miss')) return;
            makeGuess(key.dataset.letter);
        });

        /* Physical keyboard */
        document.addEventListener('keydown', (e) => {
            if (!playing) return;
            const modal = document.getElementById('modal-overlay');
            if (modal.classList.contains('active')) return;
            const l = e.key.toUpperCase();
            if (l.length === 1 && l >= 'A' && l <= 'Z') {
                e.preventDefault();
                makeGuess(l);
            }
        });

        /* Modal play again */
        document.getElementById('modal-play-again').addEventListener('click', () => {
            playTone('click');
            document.getElementById('modal-overlay').classList.remove('active');
            startGame();
        });
    }

    /* ============ KEYBOARD ============ */
    function buildKeyboard() {
        const kb = document.getElementById('keyboard');
        kb.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const ch = String.fromCharCode(i);
            const btn = document.createElement('button');
            btn.className = 'key';
            btn.dataset.letter = ch;
            btn.textContent = ch;
            kb.appendChild(btn);
        }
    }

    function resetKeyboard() {
        document.querySelectorAll('.key').forEach(k => {
            k.classList.remove('hit', 'miss');
            k.style.pointerEvents = '';
        });
    }

    /* ============ HANGMAN SVG ============ */
    function resetHangman() {
        BODY_PARTS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('visible');
        });
        document.getElementById('hm-face-dead').style.opacity = '0';
        document.getElementById('hm-face-alive').style.opacity = '0';
    }

    function showPart(index) {
        if (index < 0 || index >= BODY_PARTS.length) return;
        const el = document.getElementById(BODY_PARTS[index]);
        if (el) el.classList.add('visible');
    }

    function showFace(type) {
        if (type === 'dead') {
            document.getElementById('hm-face-dead').style.opacity = '1';
            document.getElementById('hm-face-alive').style.opacity = '0';
        } else {
            document.getElementById('hm-face-alive').style.opacity = '1';
            document.getElementById('hm-face-dead').style.opacity = '0';
        }
    }

    /* ============ GAME LOGIC ============ */
    async function startGame() {
        playing = false;
        resetKeyboard();
        resetHangman();
        document.getElementById('wrong-letters').innerHTML = '';
        document.getElementById('modal-overlay').classList.remove('active');

        try {
            const r = await fetch('/api/game/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            });
            const d = await r.json();
            if (!d.success) return;

            playing = true;
            renderTiles(d.masked);
            document.getElementById('hint-text').textContent = d.hint;
            document.getElementById('lives-display').textContent = d.attempts;
            document.getElementById('score-display').textContent = score;
        } catch (e) { console.error(e); }
    }

    async function makeGuess(letter) {
        if (!playing) return;
        const keyEl = document.querySelector(`.key[data-letter="${letter}"]`);
        if (!keyEl || keyEl.classList.contains('hit') || keyEl.classList.contains('miss')) return;

        try {
            const r = await fetch('/api/game/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ letter })
            });
            const d = await r.json();
            if (!d.success || d.duplicate) return;

            if (d.hit) {
                playTone('hit');
                keyEl.classList.add('hit');
                renderTiles(d.masked);
            } else {
                playTone('miss');
                keyEl.classList.add('miss');
                addWrongBadge(letter);
                const wrongCount = 6 - d.attempts;
                showPart(wrongCount - 1);
                document.getElementById('lives-display').textContent = d.attempts;
                /* Shake the hangman stage */
                const stage = document.querySelector('.hangman-stage');
                stage.classList.add('shake');
                setTimeout(() => stage.classList.remove('shake'), 500);
            }

            if (d.status === 'won') {
                playing = false;
                score++;
                document.getElementById('score-display').textContent = score;
                showFace('alive');
                playTone('win');
                fireConfetti();
                setTimeout(() => showModal(true, d.word), 900);
            } else if (d.status === 'lost') {
                playing = false;
                showFace('dead');
                playTone('lose');
                setTimeout(() => showModal(false, d.word), 900);
            }
        } catch (e) { console.error(e); }
    }

    /* ============ RENDERING ============ */
    function renderTiles(masked) {
        const track = document.getElementById('word-track');
        const existing = track.querySelectorAll('.tile');

        if (existing.length !== masked.length) {
            /* First render */
            track.innerHTML = '';
            for (let i = 0; i < masked.length; i++) {
                const t = document.createElement('div');
                t.className = 'tile';
                t.dataset.index = i;
                if (masked[i] !== '_') {
                    t.textContent = masked[i];
                    t.classList.add('revealed');
                }
                track.appendChild(t);
            }
        } else {
            /* Update existing tiles */
            existing.forEach((t, i) => {
                if (masked[i] !== '_' && !t.classList.contains('revealed')) {
                    t.textContent = masked[i];
                    t.classList.add('revealed');
                }
            });
        }
    }

    function addWrongBadge(letter) {
        const container = document.getElementById('wrong-letters');
        const b = document.createElement('span');
        b.className = 'wrong-badge';
        b.textContent = letter;
        container.appendChild(b);
    }

    function showModal(won, word) {
        const overlay = document.getElementById('modal-overlay');
        const heading = document.getElementById('modal-heading');
        const emoji = document.getElementById('modal-emoji');
        const wordEl = document.getElementById('modal-word');

        if (won) {
            emoji.textContent = '🎉';
            heading.textContent = 'Congratulations! You Win!';
            heading.className = 'modal-heading-win';
            wordEl.className = 'modal-word modal-word-win';
        } else {
            emoji.textContent = '💀';
            heading.textContent = 'You Lose!';
            heading.className = 'modal-heading-lose';
            wordEl.className = 'modal-word modal-word-lose';
        }
        wordEl.textContent = word;
        overlay.classList.add('active');
    }

    /* ============ CONFETTI ============ */
    function fireConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#818cf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#fb923c'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * canvas.height * 0.5,
                w: 6 + Math.random() * 6,
                h: 4 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 4,
                rot: Math.random() * Math.PI * 2,
                rv: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
            });
        }

        let frame;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.06;
                p.rot += p.rv;
                p.life -= 0.003;
                if (p.life <= 0) return;
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            if (alive) {
                frame = requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(frame);
            }
        }
        draw();
    }

})();
