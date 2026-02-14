const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // --- Configuration ---
    const config = {
        gravity: 0.5,
        friction: 0.938,
        groundFriction: 0.7,
        segmentLength: 11,
        iterations: 10,
        wireCount: 30,
        wireColor: '#222222',
        imgScale: 1.0,        
        attachOffsetY: 0.3   
    };

    let width, height;
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // --- Image Object ---
    const imgObj = {
        element: new Image(),
        baseWidth: 100,  
        baseHeight: 100, 
        currentWidth: 100,
        currentHeight: 100,
        loaded: false
    };

    // Placeholder SVG
    imgObj.element.src = 'https://iili.io/f8g5R3u.md.png';
    
    imgObj.element.onload = () => { 
        imgObj.loaded = true;
        imgObj.baseWidth = imgObj.element.width;
        imgObj.baseHeight = imgObj.element.height;
        updateImageSize();
        initScene(); 
    };

    function updateImageSize() {
        if (!imgObj.loaded) return;
        const MAX_BASE = 300;
        let w = imgObj.baseWidth;
        let h = imgObj.baseHeight;
        
        if (w > MAX_BASE) {
            const ratio = MAX_BASE / w;
            w = MAX_BASE;
            h = h * ratio;
        }

        imgObj.currentWidth = w * config.imgScale;
        imgObj.currentHeight = h * config.imgScale;
    }

    // --- Physics ---
    
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.oldx = x;
            this.oldy = y;
            this.pinned = false; 
        }

        update() {
            if (this.pinned) return;

            const vx = (this.x - this.oldx) * config.friction;
            const vy = (this.y - this.oldy) * config.friction;

            this.oldx = this.x;
            this.oldy = this.y;

            this.x += vx;
            this.y += vy;
            this.y += config.gravity;

            // Floor collision (height - 2 to prevent visual clipping)
            const floorLevel = height - 2; 

            if (this.y >= floorLevel) {
                this.y = floorLevel;
                const velX = this.x - this.oldx;
                this.oldx = this.x - (velX * config.groundFriction);
            }
        }

        setPos(x, y) {
            this.x = x;
            this.y = y;
            this.oldx = x; // Resetting oldx removes momentum (teleportation)
            this.oldy = y;
        }
    }

    class Stick {
        constructor(p1, p2) {
            this.p1 = p1;
            this.p2 = p2;
        }

        update() {
            const dx = this.p2.x - this.p1.x;
            const dy = this.p2.y - this.p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) return;

            const difference = config.segmentLength - distance;
            const percent = difference / distance / 2;
            const offsetX = dx * percent;
            const offsetY = dy * percent;

            if (!this.p1.pinned) {
                this.p1.x -= offsetX;
                this.p1.y -= offsetY;
            }
            if (!this.p2.pinned) {
                this.p2.x += offsetX;
                this.p2.y += offsetY;
            }
        }
    }

    class Wire {
        constructor(index, total) {
            this.index = index;
            this.total = total;
            this.points = [];
            this.sticks = [];
            
            // Random thickness
            this.thickness = 2 + Math.random() * 3;

            // Fixed Anchor Offset (Calculated once per wire!)
            // Range: -0.5 to 0.5. Multiplied by 0.7 for 70% width coverage.
            this.anchorOffsetRatio = (Math.random() - 0.5) * 0.7; 

            this.initWire();
        }

        initWire() {
            this.points = [];
            this.sticks = [];

            // Start coordinates (Cursor)
            const startX = mouse.x;
            const startY = mouse.y + (imgObj.currentHeight * config.attachOffsetY);

            // End coordinates (Wall)
            const wallZoneHeight = height / 2; 
            const step = wallZoneHeight / (this.total > 1 ? this.total - 1 : 1);
            const wallY = wallZoneHeight - (this.index * step);
            const endX = width;
            const endY = wallY;

            // Generate points
            const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const totalLength = Math.max(dist * 1.3, width * 0.8); 
            const count = Math.floor(totalLength / config.segmentLength);

            for (let i = 0; i <= count; i++) {
                const t = i / count;
                const px = startX + (endX - startX) * t;
                const py = startY + (endY - startY) * t;

                const p = new Point(px, py);
                this.points.push(p);

                if (i > 0) {
                    this.sticks.push(new Stick(this.points[i - 1], p));
                }
            }

            // Pin start point (Cursor)
            this.points[0].pinned = true;

            // Pin end point (Wall)
            const last = this.points[this.points.length - 1];
            last.pinned = true;
            last.setPos(endX, endY);
        }

        update() {
            // 1. Update Cursor Attachment
            // Using the fixed anchorOffsetRatio ensures it never moves relative to image center
            const offsetX = this.anchorOffsetRatio * imgObj.currentWidth;
            
            const attachX = mouse.x + offsetX;
            const attachY = mouse.y + (imgObj.currentHeight * config.attachOffsetY); 
            
            // Hard set the position. pinned = true prevents physics engine from moving it.
            this.points[0].setPos(attachX, attachY);

            // 2. Update Wall Attachment
            const wallZoneHeight = height / 2;
            const step = wallZoneHeight / (this.total > 1 ? this.total - 1 : 1);
            const wallY = wallZoneHeight - (this.index * step);
            
            const last = this.points[this.points.length - 1];
            last.setPos(width, wallY);

            // 3. Physics
            for (let i = 0; i < this.points.length; i++) {
                this.points[i].update();
            }
            for (let j = 0; j < config.iterations; j++) {
                for (let i = 0; i < this.sticks.length; i++) {
                    this.sticks[i].update();
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.strokeStyle = config.wireColor;
            ctx.lineWidth = this.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        }
    }

    let wires = [];

    function initScene() {
        resize();
        wires = [];
        for (let i = 0; i < config.wireCount; i++) {
            wires.push(new Wire(i, config.wireCount));
        }
    }

    function loop() {
        ctx.clearRect(0, 0, width, height);

        // Draw wires
        wires.forEach(wire => {
            wire.update();
            wire.draw();
        });

        // Draw image
        if (imgObj.loaded) {
            const w = imgObj.currentWidth;
            const h = imgObj.currentHeight;
            ctx.drawImage(imgObj.element, mouse.x - w / 2, mouse.y - h / 2, w, h);
        }

        requestAnimationFrame(loop);
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    // --- Listeners ---

    window.addEventListener('resize', () => {
        resize();
        wires.forEach(w => w.initWire());
    });

    const handleMove = (x, y) => {
        mouse.x = x;
        mouse.y = y;
    };

    window.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', e => {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }, {passive: false});

    // --- UI Logic ---

    // Toggle Panel
    const panel = document.getElementById('controls');
    const openBtn = document.getElementById('openControls');
    const closeBtn = document.getElementById('closeControls');

    openBtn.addEventListener('click', () => {
        panel.style.display = 'block';
        openBtn.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
        openBtn.style.display = 'block';
    });

    // Inputs
    document.getElementById('bgColor').addEventListener('input', (e) => {
        document.body.style.backgroundImage = 'none'; 
        document.body.style.backgroundColor = e.target.value;
    });

    document.getElementById('bgLoader').addEventListener('change', function(e) {
        if(!e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            document.body.style.backgroundImage = `url('${event.target.result}')`;
        }
        reader.readAsDataURL(e.target.files[0]);
    });

    document.getElementById('wireColorInput').addEventListener('input', (e) => {
        config.wireColor = e.target.value;
    });

    document.getElementById('imageLoader').addEventListener('change', function(e) {
        if(!e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const temp = new Image();
            temp.onload = function() {
                imgObj.element.src = temp.src;
                imgObj.baseWidth = temp.width;
                imgObj.baseHeight = temp.height;
                updateImageSize();
                initScene();
            }
            temp.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    });

    const scaleInput = document.getElementById('imgScale');
    scaleInput.addEventListener('input', (e) => {
        config.imgScale = parseFloat(e.target.value);
        document.getElementById('val-scale').textContent = Math.round(config.imgScale * 100) + '%';
        updateImageSize();
    });

    const offsetInput = document.getElementById('attachOffset');
    offsetInput.addEventListener('input', (e) => {
        config.attachOffsetY = parseFloat(e.target.value);
        const val = config.attachOffsetY;
        let text = Math.round(val * 100) + '%';
        if(val === 0.5) text = "Bottom";
        if(val === 0) text = "Center";
        if(val === -0.5) text = "Top";
        document.getElementById('val-offset').textContent = text;
    });

    function bindInput(id, obj, key, callback) {
        const el = document.getElementById(id);
        const display = document.getElementById(id.replace('wireCount', 'val-count').replace('gravity', 'val-grav').replace('segLength', 'val-len').replace('friction', 'val-fric'));
        
        el.addEventListener('input', () => {
            const val = parseFloat(el.value);
            obj[key] = val;
            if(display) display.textContent = val;
            if(callback) callback();
        });
    }

    bindInput('gravity', config, 'gravity');
    bindInput('friction', config, 'friction');
    bindInput('segLength', config, 'segmentLength', () => wires.forEach(w => w.initWire()));
    bindInput('wireCount', config, 'wireCount', () => initScene());

    // Init
    resize();
    loop();