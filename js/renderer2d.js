// ============================================================
// renderer2d.js — Custom 2D Canvas Engine for QuizRunner (Subway Surfers Style)
// ============================================================

const Renderer2D = {
    canvas: null,
    ctx: null,
    obstacles: [],
    particles: [],
    playerX: 0,   // Interpolated: -1 (Left), 0 (Center), 1 (Right)
    baseY: 0,     // Interpolated: 0 (Ground), 1 (Sky)
    bgOffset: 0,
    skyStars: [],
    stateIsFlying: false,

    init() {
        const container = document.getElementById('game-container');
        if (!container) return;

        // Create Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'game-canvas-2d';
        
        container.prepend(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Initial sizing
        this.onWindowResize();
        window.addEventListener('resize', () => this.onWindowResize());

        // Initialize Stars/Clouds for parallax background
        this.skyStars = [];
        for (let i = 0; i < 45; i++) {
            this.skyStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.45),
                size: 1 + Math.random() * 2,
                speed: 0.1 + Math.random() * 0.35
            });
        }
    },

    onWindowResize() {
        const container = document.getElementById('game-container');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    },

    spawnObstacles(shuffledOptions, isFlying) {
        // Spawn 3 answer gates at the horizon (t = 0)
        const set = shuffledOptions.map((optData, index) => ({
            laneIndex: index,
            text: optData.text,
            isCorrect: optData.isCorrect,
            t: 0,          // Progress along the path (0 -> 1)
            isSky: isFlying,
            type: 'obstacle'
        }));
        this.obstacles.push(set);
    },

    spawnJetpack() {
        const jetpack = {
            laneIndex: Math.floor(Math.random() * 3),
            text: "🚀 JETPACK",
            t: 0.2,        
            isSky: false,
            type: 'jetpack'
        };
        this.obstacles.push([jetpack]);
    },

    spawnDodgeObstacle() {
        const laneIndex = Math.floor(Math.random() * 3);
        const rand = Math.random();

        if (rand < 0.45) {
            // Spawn rotating gold coins in a row
            const set = [];
            for (let i = 0; i < 3; i++) {
                set.push({
                    laneIndex,
                    t: -i * 0.14, 
                    isSky: false,
                    type: 'coin'
                });
            }
            this.obstacles.push(set);
        } else {
            // Spawn hurdle, overhead sign, oncoming train, OR a rare magnet/multiplier power-up!
            const randType = Math.random();
            let type = 'barrier';

            if (randType < 0.3) type = 'barrier';
            else if (randType < 0.6) type = 'overhead';
            else if (randType < 0.88) type = 'train';
            else if (randType < 0.94) type = 'magnet';
            else type = 'multiplier';

            const set = [{
                laneIndex,
                t: 0,
                isSky: false,
                type
            }];

            // Sometimes spawn a coin in another lane as a reward
            if (Math.random() < 0.6) {
                const coinLane = (laneIndex + 1 + Math.floor(Math.random() * 2)) % 3;
                set.push({
                    laneIndex: coinLane,
                    t: -0.05,
                    isSky: false,
                    type: 'coin'
                });
            }

            this.obstacles.push(set);
        }
    },

    clearObstacles() {
        this.obstacles = [];
    },

    spawnParticles(x, y, z, color) {
        let colStr = '#4ade80'; // default green
        if (color) {
            if (typeof color === 'number') {
                colStr = '#' + color.toString(16).padStart(6, '0');
            } else {
                colStr = color;
            }
        }

        // Spawn at player's approximate location
        const px = this.canvas.width * (0.5 + this.playerX * 0.3);
        const py = this.canvas.height * (this.stateIsFlying ? 0.45 : 0.85);

        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.particles.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: colStr,
                size: 3 + Math.random() * 5,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    },

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.15 * dt; // Gravity
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    update(dt, state) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const horizonY = H * 0.4;
        const centerX = W / 2;

        this.stateIsFlying = state.isFlying;

        // 1. Move Player Horizontally
        const targetX = state.targetLane - 1; // -1, 0, 1
        this.playerX += (targetX - this.playerX) * 0.22 * dt;

        // 2. Move Player Vertically (Jetpack flying physics)
        const targetY = state.isFlying ? 1 : 0;
        this.baseY += (targetY - this.baseY) * 0.12 * dt;

        // 3. Update DOM character positions and squash/tilt animations
        const charDOM = document.getElementById('character');
        if (charDOM) {
            const leftPct = 50 + this.playerX * 30; // 20%, 50%, 80%
            
            // Apply sine curve jump visual offset in pixels
            let jumpY = 0;
            if (state.isJumping) {
                const progress = state.jumpTime / 0.7;
                jumpY = Math.sin(progress * Math.PI) * 130;
            }

            // Train roof elevation offset
            const trainHeightOffset = state.isOnTrain ? 75 : 0;
            const bottomPx = 70 + this.baseY * 180 + trainHeightOffset + jumpY;  // float up when flying, jumping, or on train
            charDOM.style.left = `${leftPct}%`;
            charDOM.style.bottom = `${bottomPx}px`;

            // Transform matrix: squash down on ducking, rotate/tilt on lane shifts
            let transformStr = `translateX(-50%)`;
            if (state.isDucking) {
                transformStr += ` scaleY(0.42)`; // Squat visual height shrink
            } else {
                const tilt = (this.playerX - targetX) * 12;
                transformStr += ` rotate(${tilt}deg)`;
            }
            charDOM.style.transform = transformStr;
            
            // Apply active aura glows
            charDOM.classList.remove('aura-magnet', 'aura-multiplier');
            if (state.magnetActive) {
                charDOM.classList.add('aura-magnet');
            } else if (state.multiplierActive) {
                charDOM.classList.add('aura-multiplier');
            }
        }

        // 4. Slow down background scrolling during Quiz Phase to give time to answer
        const speedMultiplier = state.mode === 'quiz' ? 0.38 : 1.0; 
        const bgSpeed = state.speed * speedMultiplier * dt * 1.5;
        this.bgOffset += bgSpeed;

        this.skyStars.forEach(star => {
            star.y += star.speed * bgSpeed * 0.5;
            if (star.y > horizonY) {
                star.y = 0;
                star.x = Math.random() * W;
            }
        });

        // 5. Update and render particles
        this.updateParticles(dt);

        // 6. Draw everything
        this.drawScene(W, H, horizonY, centerX, state);

        // 7. Update obstacles and check collisions (also slowed down during Quiz phase)
        let collision = null;
        const moveStep = state.speed * speedMultiplier * dt * 0.0085;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const set = this.obstacles[i];
            let setPassed = false;

            set.forEach(obs => {
                obs.t += moveStep;

                // Pull coin to player if magnet is active
                if (state.magnetActive && obs.type === 'coin' && obs.t >= 0.35) {
                    obs.laneIndex = state.targetLane;
                }

                // Only check collision if obstacle is at player's Y coordinate (t is around 0.82 to 0.90)
                if (!collision && obs.t >= 0.82 && obs.t <= 0.90) {
                    if (obs.laneIndex === state.targetLane) {
                        if (obs.type === 'coin') {
                            collision = { type: 'coin', laneIndex: obs.laneIndex };
                        } else if (obs.type === 'jetpack') {
                            collision = { type: 'jetpack', laneIndex: obs.laneIndex };
                        } else if (obs.type === 'magnet') {
                            collision = { type: 'magnet', laneIndex: obs.laneIndex };
                        } else if (obs.type === 'multiplier') {
                            collision = { type: 'multiplier', laneIndex: obs.laneIndex };
                        } else if (obs.type === 'barrier') {
                            // Player must jump to clear hurdles
                            if (!state.isJumping && !state.isFlying && !state.isOnTrain) {
                                collision = { type: 'obstacle', isCorrect: false, laneIndex: obs.laneIndex };
                            }
                        } else if (obs.type === 'overhead') {
                            // Player must duck to clear overhead signs
                            if (!state.isDucking && !state.isFlying && !state.isOnTrain) {
                                collision = { type: 'obstacle', isCorrect: false, laneIndex: obs.laneIndex };
                            }
                        } else if (obs.type === 'train') {
                            // Trains block the lane entirely.
                            if (!state.isFlying && !state.isOnTrain) {
                                // Can jump ON TOP of the train if timed correctly
                                let jumpY = 0;
                                if (state.isJumping) {
                                    const progress = state.jumpTime / 0.7;
                                    jumpY = Math.sin(progress * Math.PI) * 130;
                                }

                                if (jumpY >= 50) {
                                    // Land on top of train!
                                    state.isOnTrain = true;
                                    state.trainLane = obs.laneIndex;
                                    state.isJumping = false;
                                    state.jumpTime = 0;
                                    AudioManager.playSwipe(); // landing sound
                                } else {
                                    // Hit the front of the train
                                    collision = { type: 'obstacle', isCorrect: false, laneIndex: obs.laneIndex };
                                }
                            }
                        } else if (obs.type === 'obstacle') {
                            // Quiz answer gates
                            const obstacleInSky = obs.isSky;
                            const playerInSky = this.baseY > 0.5;

                            if (obstacleInSky === playerInSky) {
                                collision = { 
                                    type: 'quiz_gate', 
                                    isCorrect: obs.isCorrect, 
                                    laneIndex: obs.laneIndex,
                                    pos: { x: 0, y: 0, z: 0 }
                                };
                            }
                        }
                    }
                }

                // If the train carriage the player is running on scrolls off screen, they fall off
                if (obs.t > 1.05) {
                    setPassed = true;
                    if (state.isOnTrain && obs.type === 'train' && obs.laneIndex === state.trainLane) {
                        state.isOnTrain = false;
                    }
                }
            });

            if (collision || setPassed) {
                const wasObstacle = set.some(obs => obs.type === 'obstacle' || obs.type === 'train' || obs.type === 'barrier' || obs.type === 'overhead' || obs.type === 'magnet' || obs.type === 'multiplier');
                
                // If collision was just a coin/powerup, only remove that item, don't clear the obstacle set
                if (collision && (collision.type === 'coin' || collision.type === 'magnet' || collision.type === 'multiplier')) {
                    const idx = set.findIndex(obs => (obs.type === 'coin' || obs.type === 'magnet' || obs.type === 'multiplier') && obs.t >= 0.75 && obs.t <= 0.95);
                    if (idx !== -1) set.splice(idx, 1);
                } else {
                    this.obstacles.splice(i, 1);
                }

                // If player is flying and safely passes over obstacles, trigger next question/dodge cycle
                if (!collision && wasObstacle && state.isFlying) {
                    if (window.handleBypass) {
                        window.handleBypass();
                    }
                }
            }
        }

        // Jetpack flame particles
        if (state.isFlying && Math.random() < 0.4) {
            const pX = W * (0.5 + this.playerX * 0.3);
            const pY = H - (70 + this.baseY * 180) + 55;
            for (let k = 0; k < 3; k++) {
                this.particles.push({
                    x: pX + (Math.random() - 0.5) * 15,
                    y: pY,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 2 + Math.random() * 3,
                    color: Math.random() < 0.6 ? '#f59e0b' : '#ef4444',
                    size: 4 + Math.random() * 4,
                    life: 0.6,
                    decay: 0.05
                });
            }
        }

        // Hoverboard trail sparks
        if (state.hoverboardActive && Math.random() < 0.35) {
            const pX = W * (0.5 + this.playerX * 0.3);
            const pY = H - (70 + this.baseY * 180 + (state.isOnTrain ? 75 : 0)) + 8;
            for (let k = 0; k < 2; k++) {
                this.particles.push({
                    x: pX + (Math.random() - 0.5) * 35,
                    y: pY,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: -1 - Math.random() * 1.5,
                    color: state.equippedBoardParticle || '#4ade80',
                    size: 2.5 + Math.random() * 3,
                    life: 0.5,
                    decay: 0.05
                });
            }
        }

        return collision;
    },

    drawScene(W, H, horizonY, centerX, state) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, W, H);

        // ── SKY GRADIENT ──
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#050510'); 
        skyGrad.addColorStop(0.6, '#180f30'); 
        skyGrad.addColorStop(1, '#3c1042'); 
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, horizonY);

        // Draw Stars
        ctx.fillStyle = '#ffffff';
        this.skyStars.forEach(star => {
            ctx.globalAlpha = star.speed * 2.0; 
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Giant Synthwave Retro Sun
        this.drawSynthwaveSun(ctx, W, H, horizonY, centerX);

        // Draw Vector Skyline Background (Skyscrapers)
        this.drawSkyline(ctx, W, H, horizonY);

        // ── GROUND ──
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
        groundGrad.addColorStop(0, '#100c24'); 
        groundGrad.addColorStop(1, '#05030f'); 
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, W, H - horizonY);

        // ── RAILROAD BED ──
        const roadW = W * 0.9;
        ctx.fillStyle = '#171526'; 
        ctx.beginPath();
        ctx.moveTo(centerX - 10, horizonY);
        ctx.moveTo(centerX + 10, horizonY);
        ctx.lineTo(centerX + roadW / 2, H);
        ctx.lineTo(centerX - roadW / 2, H);
        ctx.closePath();
        ctx.fill();

        // ── WOODEN TIES (PARALLAX SCROLL) ──
        const numTies = 14;
        for (let i = 0; i < numTies; i++) {
            const t = ((i / numTies) + (this.bgOffset * 0.04)) % 1;
            const t_vis = t * t; 
            const y = horizonY + (H - horizonY) * t_vis;
            const w = roadW * t_vis;
            
            ctx.strokeStyle = '#3e2723'; 
            ctx.lineWidth = Math.max(1.5, 7 * t_vis);
            ctx.beginPath();
            ctx.moveTo(centerX - w * 0.48, y);
            ctx.lineTo(centerX + w * 0.48, y);
            ctx.stroke();
        }

        // ── STEEL RAILS & LANE HIGHLIGHTS ──
        const lanes = [-0.3, 0, 0.3];
        lanes.forEach(offset => {
            const bottomLaneCenterX = centerX + roadW * offset;
            const railWidth = roadW * 0.07; 
            
            ctx.strokeStyle = '#78909c'; 
            ctx.lineWidth = 2.5;

            // Left Rail
            ctx.beginPath();
            ctx.moveTo(centerX, horizonY);
            ctx.lineTo(bottomLaneCenterX - railWidth, H);
            ctx.stroke();

            // Right Rail
            ctx.beginPath();
            ctx.moveTo(centerX, horizonY);
            ctx.lineTo(bottomLaneCenterX + railWidth, H);
            ctx.stroke();

            // Neon Lane Highlights
            let color = 'rgba(59, 130, 246, 0.05)'; 
            if (offset < 0) color = 'rgba(239, 68, 68, 0.05)'; 
            if (offset > 0) color = 'rgba(16, 185, 129, 0.05)'; 

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, horizonY);
            ctx.lineTo(bottomLaneCenterX + railWidth * 1.5, H);
            ctx.lineTo(bottomLaneCenterX - railWidth * 1.5, H);
            ctx.closePath();
            ctx.fill();
        });

        // ── GLOWING NEON SUBWAY ARCHES (SIDE SCENERY) ──
        const archCount = 8;
        for (let i = 0; i < archCount; i++) {
            const t = ((i / archCount) + (this.bgOffset * 0.04)) % 1;
            const t_vis = t * t; 
            const y = horizonY + (H - horizonY) * t_vis;
            const w = roadW * t_vis;
            
            const xLeft = centerX - w * 0.48;
            const xRight = centerX + w * 0.48;
            const pillarH = (H * 0.32) * t_vis; 
            
            // Left Pillar
            ctx.fillStyle = '#0f0e26'; 
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 1 * t_vis;
            ctx.beginPath();
            this.drawRoundedRect(ctx, xLeft - 6 * t_vis, y - pillarH, 12 * t_vis, pillarH, 2 * t_vis);
            ctx.fill();
            ctx.stroke();
            
            // Right Pillar
            ctx.beginPath();
            this.drawRoundedRect(ctx, xRight - 6 * t_vis, y - pillarH, 12 * t_vis, pillarH, 2 * t_vis);
            ctx.fill();
            ctx.stroke();
            
            // Connect with Arch
            ctx.strokeStyle = '#100c2a'; 
            ctx.lineWidth = 10 * t_vis + 1;
            ctx.beginPath();
            ctx.arc(centerX, y - pillarH, w * 0.48, Math.PI, 0);
            ctx.stroke();

            // Neon glowing pink line on the arch
            ctx.strokeStyle = '#db2777'; 
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 4 * t_vis;
            ctx.lineWidth = 2 * t_vis + 0.5;
            ctx.beginPath();
            ctx.arc(centerX, y - pillarH, w * 0.48, Math.PI, 0);
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        }

        // ── OBSTACLES, COINS & POWER-UPS ──
        this.obstacles.forEach(set => {
            set.forEach(obs => {
                if (obs.t < 0.02) return; 

                const t_vis = obs.t * obs.t;
                const yBase = horizonY + (H * 0.83 - horizonY) * t_vis;
                const laneBottomX = centerX + roadW * (obs.laneIndex - 1) * 0.3;
                const x = centerX + (laneBottomX - centerX) * t_vis;

                let floatOffset = obs.isSky ? (H * 0.3) * t_vis : 0;
                
                // Stagger coins on train top
                if (obs.type === 'coin' && !obs.isSky) {
                    const hasTrain = this.obstacles.some(s => s.some(o => o.type === 'train' && o.laneIndex === obs.laneIndex && Math.abs(o.t - obs.t) < 0.25));
                    if (hasTrain) {
                        floatOffset = 70 * t_vis; 
                    }
                }

                const y = yBase - floatOffset;
                const sizeScale = Math.min(2.0, t_vis * 1.1);

                if (obs.type === 'coin') {
                    this.drawCoin(ctx, x, y, sizeScale);
                } else if (obs.type === 'jetpack') {
                    this.drawJetpackIcon(ctx, x, y, sizeScale);
                } else if (obs.type === 'magnet') {
                    this.drawMagnet(ctx, x, y, sizeScale);
                } else if (obs.type === 'multiplier') {
                    this.drawMultiplier(ctx, x, y, sizeScale);
                } else if (obs.type === 'barrier') {
                    this.drawBarrier(ctx, x, y, sizeScale);
                } else if (obs.type === 'overhead') {
                    this.drawOverheadSign(ctx, x, y, sizeScale);
                } else if (obs.type === 'train') {
                    this.drawTrain(ctx, x, y, sizeScale, W);
                } else {
                    // Quiz Gate
                    this.draw3DBox(ctx, x, y, sizeScale, obs, W);
                }
            });
        });

        // ── PARTICLES ──
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // ── WIND SPEED VELOCITY LINES ──
        if (state.isFlying || state.speed > 1.4) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 1.5;
            
            const lineCount = 12;
            const scrollTime = performance.now() * 0.015 * state.speed;

            for (let k = 0; k < lineCount; k++) {
                // Stagger lines across the left and right borders of the screen
                const isLeft = k < lineCount / 2;
                const borderX = isLeft ? Math.random() * (W * 0.15) : W - Math.random() * (W * 0.15);
                const lineY = ((k * (H / lineCount)) + scrollTime) % H;
                const lineLen = 40 + Math.random() * 80;

                ctx.beginPath();
                ctx.moveTo(borderX, lineY);
                ctx.lineTo(borderX, lineY + lineLen);
                ctx.stroke();
            }
            ctx.restore();
        }
    },

    drawSynthwaveSun(ctx, W, H, horizonY, centerX) {
        const radius = horizonY * 0.72; 
        ctx.save();
        ctx.translate(centerX, horizonY);

        // Sun Glow
        const sunGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.5);
        sunGlow.addColorStop(0, 'rgba(244, 63, 94, 0.35)'); 
        sunGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)'); 
        sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Clip to draw sun half (above horizon)
        ctx.beginPath();
        ctx.rect(-radius * 1.5, -radius * 1.5, radius * 3, radius * 1.5);
        ctx.clip();

        // Gradient for sun: Neon Pink to Bright Yellow
        const grad = ctx.createLinearGradient(0, -radius, 0, 0);
        grad.addColorStop(0, '#f43f5e'); 
        grad.addColorStop(0.5, '#ec4899'); 
        grad.addColorStop(1, '#fbbf24'); 
        ctx.fillStyle = grad;

        // Draw sun circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Synthwave horizontal cut lines
        ctx.fillStyle = '#050510'; 
        const lineCount = 7;
        for (let i = 0; i < lineCount; i++) {
            const yOffset = -radius * (i / lineCount);
            const lineH = Math.max(1, (i + 1) * (1.6 * (horizonY / 480)));
            ctx.fillRect(-radius * 1.1, yOffset, radius * 2.2, lineH);
        }

        ctx.restore();
    },

    drawSkyline(ctx, W, H, horizonY) {
        ctx.save();

        // 1. Far building silhouettes (Deep purple, very dark)
        ctx.fillStyle = '#0e0b1f'; 
        const farWidths = [W * 0.14, W * 0.10, W * 0.16, W * 0.08, W * 0.15, W * 0.12];
        const farHeights = [horizonY * 0.45, horizonY * 0.55, horizonY * 0.35, horizonY * 0.65, horizonY * 0.40, horizonY * 0.50];
        
        let fx = 0;
        for (let i = 0; i < 8; i++) {
            const w = farWidths[i % farWidths.length];
            const h = farHeights[i % farHeights.length];
            ctx.fillRect(fx, horizonY - h, w, h);
            fx += w * 0.85; 
        }

        // 2. Near building silhouettes (Lighter violet)
        ctx.fillStyle = '#17112c';
        const nearWidths = [W * 0.12, W * 0.15, W * 0.09, W * 0.14, W * 0.11, W * 0.13];
        const nearHeights = [horizonY * 0.25, horizonY * 0.38, horizonY * 0.30, horizonY * 0.48, horizonY * 0.33, horizonY * 0.42];

        let nx = 0;
        for (let i = 0; i < 9; i++) {
            const w = nearWidths[i % nearWidths.length];
            const h = nearHeights[i % nearHeights.length];
            ctx.fillRect(nx, horizonY - h, w, h);

            // Draw tiny neon windows inside the near buildings
            ctx.fillStyle = Math.random() < 0.5 ? '#fef08a' : '#06b6d4'; 
            ctx.globalAlpha = 0.35; 
            
            const rows = Math.floor(h / (13 * W / 480));
            const cols = Math.floor(w / (10 * W / 480));
            
            for (let r = 1; r < rows - 1; r++) {
                for (let c = 1; c < cols - 1; c++) {
                    const noise = Math.sin(nx + r * 5 + c * 10);
                    if (noise > 0.4) {
                        const wx = nx + c * (w / cols);
                        const wy = horizonY - h + r * (h / rows);
                        ctx.fillRect(wx, wy, 2 * W / 480, 3.5 * W / 480);
                    }
                }
            }

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#17112c'; 
            nx += w * 0.9;
        }

        ctx.restore();
    },

    drawCoin(ctx, x, y, scale) {
        const radius = 18 * scale;
        if (radius < 2) return;
        const angle = (performance.now() * 0.006) % (Math.PI * 2);
        const spinScale = Math.sin(angle); 

        ctx.save();
        ctx.translate(x, y);

        // Gold Glow
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 1.6);
        glow.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
        glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.6, 0, Math.PI*2);
        ctx.fill();

        // Gold Disk
        const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        grad.addColorStop(0, '#fef08a'); 
        grad.addColorStop(0.5, '#eab308'); 
        grad.addColorStop(1, '#ca8a04'); 
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, radius * Math.abs(spinScale)), radius, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = Math.max(0.5, 1.5 * scale);
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, radius * Math.abs(spinScale)), radius, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, radius * 0.6 * Math.abs(spinScale)), radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    },

    drawMagnet(ctx, x, y, scale) {
        const size = 26 * scale;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((performance.now() * 0.004) % (Math.PI * 2));

        // Horseshoe Magnet (U-shape)
        ctx.lineWidth = 8 * scale;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ef4444'; 
        
        ctx.beginPath();
        ctx.arc(0, -size * 0.1, size * 0.45, Math.PI, 0, true);
        ctx.lineTo(size * 0.45, size * 0.4);
        ctx.moveTo(-size * 0.45, -size * 0.1);
        ctx.lineTo(-size * 0.45, size * 0.4);
        ctx.stroke();

        // Silver Tips
        ctx.strokeStyle = '#e2e8f0'; 
        ctx.lineWidth = 8 * scale;
        ctx.beginPath();
        ctx.moveTo(-size * 0.45, size * 0.2);
        ctx.lineTo(-size * 0.45, size * 0.4);
        ctx.moveTo(size * 0.45, size * 0.2);
        ctx.lineTo(size * 0.45, size * 0.4);
        ctx.stroke();

        // Glow ring
        ctx.strokeStyle = 'rgba(254, 240, 122, 0.45)';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    },

    drawMultiplier(ctx, x, y, scale) {
        const radius = 24 * scale;
        ctx.save();
        ctx.translate(x, y);

        // Blue sphere glow
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 1.5);
        glow.addColorStop(0, 'rgba(167, 139, 250, 0.65)');
        glow.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // "×2" text inside
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, Math.round(15 * scale))}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("×2", 0, 0);

        ctx.restore();
    },

    drawBarrier(ctx, x, y, scale) {
        const w = 100 * scale;
        const h = 40 * scale;
        const fl = x - w / 2;
        const fr = x + w / 2;
        const fb = y + h * 0.3;

        ctx.save();

        // Legs
        ctx.strokeStyle = '#475569'; 
        ctx.lineWidth = Math.max(1.5, 3.5 * scale);
        ctx.beginPath();
        ctx.moveTo(fl + w * 0.15, fb);
        ctx.lineTo(fl + w * 0.15, fb - h * 0.9);
        ctx.moveTo(fr - w * 0.15, fb);
        ctx.lineTo(fr - w * 0.15, fb - h * 0.9);
        ctx.stroke();

        // Striped board
        const beamY = fb - h * 0.7;
        const beamH = 14 * scale;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fl, beamY - beamH / 2, w, beamH);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeRect(fl, beamY - beamH / 2, w, beamH);

        ctx.fillStyle = '#ef4444'; 
        const stripeW = 10 * scale;
        for (let sx = fl + stripeW; sx < fr; sx += stripeW * 2) {
            ctx.beginPath();
            ctx.moveTo(sx, beamY - beamH / 2);
            ctx.lineTo(sx + stripeW * 0.7, beamY - beamH / 2);
            ctx.lineTo(sx + stripeW * 0.7 - 5*scale, beamY + beamH / 2);
            ctx.lineTo(sx - 5*scale, beamY + beamH / 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    drawOverheadSign(ctx, x, y, scale) {
        const w = 140 * scale;
        const h = 32 * scale;
        const fl = x - w / 2;
        const fr = x + w / 2;

        ctx.save();

        // Gantry Frame
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = Math.max(1, 2.5 * scale);
        ctx.beginPath();
        ctx.moveTo(fl - 10*scale, y + 40*scale); 
        ctx.lineTo(fl - 10*scale, y - 10*scale);
        ctx.moveTo(fr + 10*scale, y + 40*scale);
        ctx.lineTo(fr + 10*scale, y - 10*scale);
        ctx.moveTo(fl - 12*scale, y - 10*scale);
        ctx.lineTo(fr + 12*scale, y - 10*scale);
        ctx.stroke();

        // Warning Sign
        const signH = 26 * scale;
        const signY = y - 5*scale;

        const grad = ctx.createLinearGradient(fl, signY, fl, signY + signH);
        grad.addColorStop(0, '#facc15'); 
        grad.addColorStop(1, '#eab308');
        ctx.fillStyle = grad;
        this.drawRoundedRect(ctx, fl, signY, w, signH, 4 * scale);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 1.8 * scale);
        ctx.stroke();

        // Chevron Stripes
        ctx.fillStyle = '#000000';
        const stripeW = 8 * scale;
        for (let sx = fl + 12*scale; sx < fr - 12*scale; sx += 40*scale) {
            ctx.beginPath();
            ctx.moveTo(sx, signY);
            ctx.lineTo(sx + stripeW, signY);
            ctx.lineTo(sx + stripeW - 5*scale, signY + signH);
            ctx.lineTo(sx - 5*scale, signY + signH);
            ctx.closePath();
            ctx.fill();
        }

        // Text
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.max(6, Math.round(9 * scale))}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.fillText("⚠️ CAUTION", x, signY + signH / 2 + 1 * scale);

        ctx.restore();
    },

    drawTrain(ctx, x, y, scale, W) {
        const wfront = 140 * scale;
        const hfront = 100 * scale;

        const fl = x - wfront / 2;
        const fr = x + wfront / 2;
        const ft = y - hfront / 2;
        const fb = y + hfront / 2;

        const depthFactor = 0.83; 
        const vanishingX = W / 2;
        const vanishingY = this.canvas.height * 0.4;

        const bl = vanishingX + (fl - vanishingX) * depthFactor;
        const br = vanishingX + (fr - vanishingX) * depthFactor;
        const bt = vanishingY + (ft - vanishingY) * depthFactor;
        const bb = vanishingY + (fb - vanishingY) * depthFactor;

        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + hfront * 0.46, wfront * 0.52, hfront * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side body
        ctx.fillStyle = '#1e3a8a'; 
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        if (x > vanishingX) {
            ctx.moveTo(fl, ft); ctx.lineTo(bl, bt); ctx.lineTo(bl, bb); ctx.lineTo(fl, fb);
        } else {
            ctx.moveTo(fr, ft); ctx.lineTo(br, bt); ctx.lineTo(br, bb); ctx.lineTo(fr, fb);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Roof
        ctx.fillStyle = '#3b82f6'; 
        ctx.beginPath();
        ctx.moveTo(fl, ft); ctx.lineTo(fr, ft); ctx.lineTo(br, bt); ctx.lineTo(bl, bt);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front Panel
        const frontGrad = ctx.createLinearGradient(fl, ft, fl, fb);
        frontGrad.addColorStop(0, '#2563eb'); 
        frontGrad.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = frontGrad;
        this.drawRoundedRect(ctx, fl, ft, wfront, hfront, 12 * scale);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * scale;
        ctx.stroke();

        // Window/Windshield
        ctx.fillStyle = '#0f172a'; 
        this.drawRoundedRect(ctx, fl + 14 * scale, ft + 14 * scale, wfront - 28 * scale, hfront * 0.38, 6 * scale);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.stroke();

        // Windshield shine
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(fl + 14*scale, ft + 14*scale);
        ctx.lineTo(fl + 40*scale, ft + 14*scale);
        ctx.lineTo(fl + 26*scale, ft + 14*scale + hfront*0.38);
        ctx.lineTo(fl + 14*scale, ft + 14*scale + hfront*0.38);
        ctx.closePath();
        ctx.fill();

        // Headlights
        const headlightRadius = 6.5 * scale;
        const headlightY = fb - 20 * scale;
        
        ctx.fillStyle = '#fef08a'; 
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8 * scale;

        ctx.beginPath();
        ctx.arc(fl + 26 * scale, headlightY, headlightRadius, 0, Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(fr - 26 * scale, headlightY, headlightRadius, 0, Math.PI*2);
        ctx.fill();

        ctx.shadowBlur = 0; 

        // Destination Screen
        ctx.fillStyle = '#22c55e'; 
        ctx.fillRect(x - 26*scale, ft + 5*scale, 52*scale, 6.5*scale);
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.max(4, Math.round(5 * scale))}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText("METRO LINE 1", x, ft + 10.5*scale);

        ctx.restore();
    },

    drawJetpackIcon(ctx, x, y, scale) {
        const w = 45 * scale;
        const h = 55 * scale;

        ctx.save();
        ctx.translate(x, y);

        // Neon violet jetpack glow
        const glowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, w * 1.5);
        glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
        glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, w * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Left Tank
        ctx.fillStyle = '#db2777'; 
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * scale;
        this.drawRoundedRect(ctx, -w * 0.4, -h * 0.4, w * 0.35, h * 0.8, 5 * scale);
        ctx.fill();
        ctx.stroke();

        // Right Tank
        this.drawRoundedRect(ctx, w * 0.05, -h * 0.4, w * 0.35, h * 0.8, 5 * scale);
        ctx.fill();
        ctx.stroke();

        // Connector
        ctx.fillStyle = '#fbbf24'; 
        ctx.fillRect(-w * 0.1, -h * 0.2, w * 0.2, h * 0.4);
        ctx.strokeRect(-w * 0.1, -h * 0.2, w * 0.2, h * 0.4);

        // Flame sparks
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, h * 0.4);
        ctx.lineTo(-w * 0.32, h * 0.7);
        ctx.lineTo(-w * 0.12, h * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w * 0.22, h * 0.4);
        ctx.lineTo(w * 0.12, h * 0.7);
        ctx.lineTo(w * 0.32, h * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(7, Math.round(11 * scale))}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.fillText("🚀 JETPACK", 0, -h * 0.55);

        ctx.restore();
    },

    draw3DBox(ctx, x, y, scale, obs, W) {
        const wfront = 140 * scale;
        const hfront = 85 * scale;

        let primaryColor = obs.isSky ? '#06b6d4' : '#d97706'; 
        let topColor = obs.isSky ? '#0891b2' : '#b45309';
        let sideColor = obs.isSky ? '#0e7490' : '#92400e';
        
        ctx.save();

        if (!obs.isSky) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(x, y + hfront * 0.45, wfront * 0.48, hfront * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const fl = x - wfront / 2;
        const fr = x + wfront / 2;
        const ft = y - hfront / 2;
        const fb = y + hfront / 2;

        const depthFactor = 0.88; 
        const vanishingX = W / 2;
        const vanishingY = this.canvas.height * 0.4;

        const bl = vanishingX + (fl - vanishingX) * depthFactor;
        const br = vanishingX + (fr - vanishingX) * depthFactor;
        const bt = vanishingY + (ft - vanishingY) * depthFactor;
        const bb = vanishingY + (fb - vanishingY) * depthFactor;

        // Side Face
        ctx.fillStyle = sideColor;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        if (x > vanishingX) {
            ctx.moveTo(fl, ft); ctx.lineTo(bl, bt); ctx.lineTo(bl, bb); ctx.lineTo(fl, fb);
        } else {
            ctx.moveTo(fr, ft); ctx.lineTo(br, bt); ctx.lineTo(br, bb); ctx.lineTo(fr, fb);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Top Face
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(fl, ft); ctx.lineTo(fr, ft); ctx.lineTo(br, bt); ctx.lineTo(bl, bt);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front Face
        const frontGrad = ctx.createLinearGradient(fl, ft, fl, fb);
        frontGrad.addColorStop(0, primaryColor);
        frontGrad.addColorStop(1, this.adjustBrightness(primaryColor, -25));
        ctx.fillStyle = frontGrad;

        this.drawRoundedRect(ctx, fl, ft, wfront, hfront, 8 * scale);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Border highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1 * scale;
        this.drawRoundedRect(ctx, fl + 3*scale, ft + 3*scale, wfront - 6*scale, hfront - 6*scale, 5*scale);
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4 * scale;
        ctx.shadowOffsetX = 1 * scale;
        ctx.shadowOffsetY = 1.5 * scale;
        
        const fontSize = Math.max(7, Math.round(14 * scale));
        ctx.font = `bold ${fontSize}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.drawWrappedText(ctx, obs.text, x, y, wfront - 16 * scale, fontSize * 1.25);

        ctx.restore();
    },

    drawRoundedRect(ctx, x, y, w, h, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h - radius);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = String(text).split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        const totalHeight = lines.length * lineHeight;
        let startY = y - totalHeight / 2 + lineHeight / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, x, startY + index * lineHeight);
        });
    },

    adjustBrightness(hex, percent) {
        let num = parseInt(hex.replace("#",""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
    }
};
