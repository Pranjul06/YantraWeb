// ============================================
// BLOCKCHAIN NETWORK ANIMATION (Canvas)
// ============================================
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";
import { updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, storage, db } from "./firebase.js"; // Import auth, storage, and db
const canvas = document.getElementById('blockchain-canvas');
const ctx = canvas.getContext('2d');

let nodes = [];
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initNodes();
}

function initNodes() {
    nodes = [];
    const nodeCount = Math.floor((canvas.width * canvas.height) / 25000);

    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            pulse: Math.random() * Math.PI * 2
        });
    }
}

function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(other => {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const opacity = (1 - distance / 150) * 0.3;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = `rgba(0, 245, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        });
    });

    nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.02;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        const pulseRadius = node.radius + Math.sin(node.pulse) * 0.5;

        const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, pulseRadius * 3
        );
        gradient.addColorStop(0, 'rgba(0, 245, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 245, 255, 0.2)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#00f5ff';
        ctx.fill();
    });

    animationId = requestAnimationFrame(drawNetwork);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawNetwork();

// ============================================
// DASHBOARD CANVAS ANIMATION (Hexagonal Network)
// ============================================
const dashboardCanvas = document.getElementById('dashboard-canvas');
if (dashboardCanvas) {
    const dashCtx = dashboardCanvas.getContext('2d');
    let dashNodes = [];
    let mouseX = 0;
    let mouseY = 0;

    function resizeDashboardCanvas() {
        dashboardCanvas.width = window.innerWidth;
        dashboardCanvas.height = window.innerHeight;
        initDashNodes();
    }

    function initDashNodes() {
        dashNodes = [];
        const nodeCount = Math.floor((dashboardCanvas.width * dashboardCanvas.height) / 35000);

        for (let i = 0; i < nodeCount; i++) {
            dashNodes.push({
                x: Math.random() * dashboardCanvas.width,
                y: Math.random() * dashboardCanvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 3 + 1,
                pulse: Math.random() * Math.PI * 2,
                hue: Math.random() * 60 + 170 // Cyan to purple range
            });
        }
    }

    function drawDashNetwork() {
        dashCtx.clearRect(0, 0, dashboardCanvas.width, dashboardCanvas.height);

        // Draw connections
        dashNodes.forEach((node, i) => {
            dashNodes.slice(i + 1).forEach(other => {
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 180) {
                    const opacity = (1 - distance / 180) * 0.25;
                    const gradient = dashCtx.createLinearGradient(node.x, node.y, other.x, other.y);
                    gradient.addColorStop(0, `hsla(${node.hue}, 100%, 60%, ${opacity})`);
                    gradient.addColorStop(1, `hsla(${other.hue}, 100%, 60%, ${opacity})`);

                    dashCtx.beginPath();
                    dashCtx.moveTo(node.x, node.y);
                    dashCtx.lineTo(other.x, other.y);
                    dashCtx.strokeStyle = gradient;
                    dashCtx.lineWidth = 0.8;
                    dashCtx.stroke();
                }
            });

            // Mouse interaction - nodes attract to mouse
            const distToMouse = Math.sqrt(
                Math.pow(node.x - mouseX, 2) + Math.pow(node.y - mouseY, 2)
            );
            if (distToMouse < 200 && distToMouse > 0) {
                const force = (200 - distToMouse) / 200 * 0.02;
                node.vx += (mouseX - node.x) * force;
                node.vy += (mouseY - node.y) * force;
            }
        });

        // Draw and animate nodes
        dashNodes.forEach(node => {
            // Apply velocity
            node.x += node.vx;
            node.y += node.vy;
            node.pulse += 0.03;

            // Dampen velocity
            node.vx *= 0.99;
            node.vy *= 0.99;

            // Bounce off walls
            if (node.x < 0 || node.x > dashboardCanvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > dashboardCanvas.height) node.vy *= -1;

            const pulseRadius = node.radius + Math.sin(node.pulse) * 1;

            // Outer glow
            const gradient = dashCtx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, pulseRadius * 4
            );
            gradient.addColorStop(0, `hsla(${node.hue}, 100%, 60%, 0.8)`);
            gradient.addColorStop(0.5, `hsla(${node.hue}, 100%, 60%, 0.2)`);
            gradient.addColorStop(1, 'transparent');

            dashCtx.beginPath();
            dashCtx.arc(node.x, node.y, pulseRadius * 4, 0, Math.PI * 2);
            dashCtx.fillStyle = gradient;
            dashCtx.fill();

            // Core
            dashCtx.beginPath();
            dashCtx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
            dashCtx.fillStyle = `hsla(${node.hue}, 100%, 70%, 1)`;
            dashCtx.fill();

            // Shift hue slowly
            node.hue = (node.hue + 0.05) % 360;
            if (node.hue < 170 || node.hue > 320) {
                node.hue = 170 + Math.random() * 150;
            }
        });

        requestAnimationFrame(drawDashNetwork);
    }

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('resize', resizeDashboardCanvas);
    resizeDashboardCanvas();
    drawDashNetwork();
}

// ============================================
// NAVIGATION - SCROLL TO SECTIONS
// ============================================
const navMappings = {
    'nav-blockchain': 'section-blockchain',
    'nav-crypto': 'section-crypto',
    'nav-nft': 'section-nft',
    'nav-dao': 'section-dao'
};

Object.entries(navMappings).forEach(([navId, sectionId]) => {
    const navElement = document.getElementById(navId);
    const sectionElement = document.getElementById(sectionId);

    if (navElement && sectionElement) {
        navElement.addEventListener('click', () => {
            sectionElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
});

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ============================================
// SIDEBAR NAVIGATION (for Dashboard rounds)
// ============================================
function initSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const roundSections = document.querySelectorAll('.round-section');

    if (navItems.length === 0 || roundSections.length === 0) {
        return; // Elements not ready yet
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetRound = item.getAttribute('data-round');

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            roundSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetRound) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Initialize sidebar navigation
initSidebarNavigation();

// ============================================
// FILE UPLOAD (Round 3)
// ============================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadedFile = document.getElementById('uploadedFile');
const fileNameDisplay = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');
const submitUpload = document.getElementById('submitUpload');
const submitUploadBtn = document.getElementById('submitUpload');

let selectedFile = null;

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds 50MB limit');
        return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    uploadArea.style.display = 'none';
    uploadedFile.style.display = 'flex';
    submitUpload.disabled = false;
}

removeFile.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    uploadedFile.style.display = 'none';
    submitUpload.disabled = true;
});

submitUpload.addEventListener('click', async () => {
    // 1. Check if user is logged in
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in!");

    // 2. Check if user is in a Team
    // (currentTeamData is the global variable we set in app.js)
    const currentTeamData = window.currentTeamData;
    if (!currentTeamData || !currentTeamData.name) {
        return alert("You must create or join a team before uploading!");
    }

    // 3. Get the file
    const file = fileInput.files[0];
    if (!file) return alert("No file selected!");

    const submitBtn = document.getElementById('submitUpload');
    submitBtn.textContent = "Uploading...";
    submitBtn.disabled = true;

    try {
        // 4. Create a Clean Team Name for the Folder
        // (Removes spaces to avoid URL issues. e.g. "Team Alpha" -> "TeamAlpha")
        const safeTeamName = currentTeamData.name.replace(/\s+/g, '');
        
        // Path: submissions / TeamName / FileName
        // Example: submissions / Avengers / Project.pdf
        const storageRef = ref(storage, `submissions/${safeTeamName}/${file.name}`);

        // 5. Upload
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 6. Save URL to the TEAM Document (Not User Document)
        // We use currentTeamData.name (which is the Team Name or ID)
        await updateDoc(doc(db, "teams", currentTeamData.name), {
            projectSubmission: downloadURL,
            submissionTime: new Date().toISOString(),
            // Optional: Mark round as complete
            round3_completed: true 
        });

        alert(`Success! File uploaded for Team: ${currentTeamData.name}`);

        // Reset UI
        document.getElementById('uploadedFile').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';

    } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed: " + error.message);
    } finally {
        submitBtn.textContent = "Submit File";
        submitBtn.disabled = false;
    }
});

// ============================================
// CONFETTI ANIMATION
// ============================================
function launchConfetti() {
    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confetti-canvas';
    confettiCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(confettiCanvas);

    const confettiCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const confetti = [];
    const colors = ['#00f5ff', '#bf00ff', '#ff0080', '#0066ff', '#00ff88'];

    for (let i = 0; i < 150; i++) {
        confetti.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.2
        });
    }

    function animateConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        let active = false;

        confetti.forEach(c => {
            if (c.y < confettiCanvas.height + 20) {
                active = true;
                c.y += c.speed;
                c.x += Math.sin(c.angle) * 2;
                c.angle += c.spin;

                confettiCtx.save();
                confettiCtx.translate(c.x, c.y);
                confettiCtx.rotate(c.angle);
                confettiCtx.fillStyle = c.color;
                confettiCtx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
                confettiCtx.restore();
            }
        });

        if (active) {
            requestAnimationFrame(animateConfetti);
        } else {
            confettiCanvas.remove();
        }
    }

    animateConfetti();
}

// Keyboard shortcuts are handled in app.js
