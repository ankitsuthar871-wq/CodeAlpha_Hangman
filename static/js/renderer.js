/* =========================================================
   RENDERER — Interactive 3D Plexus Particle Network
   Three.js based, mouse-reactive, premium background
   ========================================================= */

(function () {
    const PARTICLE_COUNT = 160;
    const LINK_DISTANCE = 3.8;
    const MOUSE_ATTRACT_RADIUS = 6;

    let scene, camera, renderer;
    let points, lineMesh;
    let positions = [];
    let velocities = [];
    let mouseNDC = { x: 0, y: 0 };

    function init3D() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e1a);
        scene.fog = new THREE.FogExp2(0x0a0e1a, 0.022);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 15);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        buildParticles();
        buildLines();
        buildFloatingShapes();

        window.addEventListener('resize', onResize);
        document.addEventListener('mousemove', onMouse);
        document.addEventListener('touchmove', onTouch, { passive: true });

        animate();
    }

    /* ---- Particles ---- */
    function buildParticles() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        const cols = new Float32Array(PARTICLE_COUNT * 3);

        const palette = [
            new THREE.Color(0x818cf8),
            new THREE.Color(0xa78bfa),
            new THREE.Color(0x34d399),
            new THREE.Color(0x38bdf8),
        ];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const v = new THREE.Vector3(
                (Math.random() - 0.5) * 28,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 14
            );
            positions.push(v);
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.008
            ));
            pos.set([v.x, v.y, v.z], i * 3);
            const c = palette[i % palette.length];
            cols.set([c.r, c.g, c.b], i * 3);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

        /* Glow dot texture */
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 32, 32);

        const mat = new THREE.PointsMaterial({
            size: 0.18,
            map: new THREE.CanvasTexture(c),
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        points = new THREE.Points(geo, mat);
        scene.add(points);
    }

    /* ---- Lines ---- */
    function buildLines() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(2400 * 3);  // 800 line segments
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.LineBasicMaterial({
            color: 0x818cf8,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
        });

        lineMesh = new THREE.LineSegments(geo, mat);
        scene.add(lineMesh);
    }

    /* ---- Floating shapes ---- */
    function buildFloatingShapes() {
        const geos = [
            new THREE.OctahedronGeometry(1),
            new THREE.IcosahedronGeometry(0.8),
            new THREE.TetrahedronGeometry(0.9),
        ];
        const mats = [
            new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true, transparent: true, opacity: 0.12 }),
            new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.12 }),
            new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.12 }),
        ];
        for (let i = 0; i < 5; i++) {
            const m = new THREE.Mesh(geos[i % geos.length], mats[i % mats.length]);
            m.position.set(
                (Math.random() - 0.5) * 22,
                (Math.random() - 0.5) * 16,
                -5 - Math.random() * 8
            );
            m.rotation.set(Math.random() * 6, Math.random() * 6, 0);
            m.userData = {
                rx: (Math.random() - 0.5) * 0.003,
                ry: (Math.random() - 0.5) * 0.003,
                sy: m.position.y,
                spd: 0.0004 + Math.random() * 0.0003
            };
            scene.add(m);
            floatingMeshes.push(m);
        }
    }
    const floatingMeshes = [];

    /* ---- Events ---- */
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function onMouse(e) {
        mouseNDC.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseNDC.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }
    function onTouch(e) {
        if (e.touches.length) {
            mouseNDC.x = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
            mouseNDC.y = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2;
        }
    }

    /* ---- Render Loop ---- */
    function animate() {
        requestAnimationFrame(animate);

        const pArr = points.geometry.attributes.position.array;

        /* Move particles */
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = positions[i], v = velocities[i];

            /* Mouse attraction */
            const mx = mouseNDC.x * 10, my = mouseNDC.y * 7;
            const dx = mx - p.x, dy = my - p.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < MOUSE_ATTRACT_RADIUS && d > 0.01) {
                p.x += dx * 0.0008;
                p.y += dy * 0.0008;
            }

            p.add(v);
            if (p.x < -16 || p.x > 16) v.x = -v.x;
            if (p.y < -12 || p.y > 12) v.y = -v.y;
            if (p.z < -10 || p.z > 10) v.z = -v.z;

            pArr[i * 3] = p.x;
            pArr[i * 3 + 1] = p.y;
            pArr[i * 3 + 2] = p.z;
        }
        points.geometry.attributes.position.needsUpdate = true;

        /* Draw connection lines */
        const lArr = lineMesh.geometry.attributes.position.array;
        let li = 0;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                if (li >= 2380) break;
                if (positions[i].distanceTo(positions[j]) < LINK_DISTANCE) {
                    lArr[li * 3] = positions[i].x;
                    lArr[li * 3 + 1] = positions[i].y;
                    lArr[li * 3 + 2] = positions[i].z;
                    li++;
                    lArr[li * 3] = positions[j].x;
                    lArr[li * 3 + 1] = positions[j].y;
                    lArr[li * 3 + 2] = positions[j].z;
                    li++;
                }
            }
        }
        lineMesh.geometry.attributes.position.needsUpdate = true;
        lineMesh.geometry.setDrawRange(0, li);

        /* Floating shapes */
        floatingMeshes.forEach(m => {
            m.rotation.x += m.userData.rx;
            m.rotation.y += m.userData.ry;
            m.position.y = m.userData.sy + Math.sin(Date.now() * m.userData.spd) * 0.6;
        });

        /* Camera parallax */
        camera.position.x += (mouseNDC.x * 1.5 - camera.position.x) * 0.03;
        camera.position.y += (mouseNDC.y * 1.0 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    /* Expose init */
    window.init3D = init3D;
})();
