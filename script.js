// ============================================
// BLOCKCHAIN NETWORK ANIMATION (Canvas)
// ============================================
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
// MODAL FUNCTIONALITY
// ============================================
const enterEventBtn = document.getElementById('enterEventBtn');
const registrationModal = document.getElementById('registrationModal');
const closeModal = document.getElementById('closeModal');
const registrationForm = document.getElementById('registrationForm');

enterEventBtn.addEventListener('click', () => {
    registrationModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeModal.addEventListener('click', () => {
    registrationModal.classList.remove('active');
    document.body.style.overflow = '';
});

registrationModal.addEventListener('click', (e) => {
    if (e.target === registrationModal) {
        registrationModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================
// FORM SUBMISSION & DASHBOARD
// ============================================
const landingPage = document.getElementById('landingPage');
const dashboard = document.getElementById('dashboard');
const profileTeamName = document.getElementById('profileTeamName');
const profileMemberCount = document.getElementById('profileMemberCount');

registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const teamName = document.getElementById('teamName').value.trim();
    const memberCount = document.getElementById('memberCount').value;

    if (!teamName || !memberCount) {
        alert('Please fill in all fields');
        return;
    }

    // Store in localStorage
    const teamData = {
        name: teamName,
        members: memberCount,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('yantra_team', JSON.stringify(teamData));

    // Update profile popup
    profileTeamName.textContent = teamName;
    profileMemberCount.textContent = `Members: ${memberCount}`;

    // Hide modal and landing, show dashboard
    registrationModal.classList.remove('active');
    landingPage.style.display = 'none';
    dashboard.classList.add('active');
    document.body.style.overflow = '';

    // Launch confetti
    launchConfetti();
});

// ============================================
// PROFILE POPUP
// ============================================
const profileCircle = document.getElementById('profileCircle');
const profilePopup = document.getElementById('profilePopup');
const closeProfile = document.getElementById('closeProfile');

profileCircle.addEventListener('click', () => {
    profilePopup.classList.toggle('active');
});

closeProfile.addEventListener('click', () => {
    profilePopup.classList.remove('active');
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    if (!profileCircle.contains(e.target) && !profilePopup.contains(e.target)) {
        profilePopup.classList.remove('active');
    }
});

// ============================================
// SIDEBAR NAVIGATION
// ============================================
const navItems = document.querySelectorAll('.nav-item');
const roundSections = document.querySelectorAll('.round-section');

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

// ============================================
// FILE UPLOAD (Round 3)
// ============================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadedFile = document.getElementById('uploadedFile');
const fileNameDisplay = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');
const submitUpload = document.getElementById('submitUpload');

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

submitUpload.addEventListener('click', () => {
    if (selectedFile) {
        alert(`File "${selectedFile.name}" submitted successfully!`);
        // Reset upload
        selectedFile = null;
        fileInput.value = '';
        uploadArea.style.display = 'block';
        uploadedFile.style.display = 'none';
        submitUpload.disabled = true;
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

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        registrationModal.classList.remove('active');
        profilePopup.classList.remove('active');
        document.body.style.overflow = '';
    }
});
