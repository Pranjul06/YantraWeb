// ============================================
// APP.JS - Main Application Logic
// ============================================
import {
    auth,
    onAuthStateChanged,
    registerUser,
    loginUser,
    logoutUser,
    getUserData,
    createTeam,
    joinTeam,
    getTeamDetails,
    getAllTeams
} from './firebase.js';
import { getFirestore, collection, query, orderBy, getDocs, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { db } from "./firebase.js"; // Assuming you export 'db' from firebase.js

// ============================================
// GLOBAL STATE
// ============================================
let currentUser = null;
let currentUserData = null;
let currentTeamData = null;

// Expose to window for cross-module access
window.currentTeamData = null;
window.setCurrentTeamData = (data) => {
    currentTeamData = data;
    window.currentTeamData = data;
};
window.getCurrentTeamData = () => currentTeamData;

// ============================================
// DOM ELEMENTS
// ============================================
const landingPage = document.getElementById('landingPage');
const dashboard = document.getElementById('dashboard');
const enterEventBtn = document.getElementById('enterEventBtn');

// Auth Modal
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const authTabs = document.querySelectorAll('.auth-tab');
const registerFormDiv = document.getElementById('registerForm');
const loginFormDiv = document.getElementById('loginForm');
const registerFormElement = document.getElementById('registerFormElement');
const loginFormElement = document.getElementById('loginFormElement');
const registerError = document.getElementById('registerError');
const loginError = document.getElementById('loginError');

// Team Modal
const teamModal = document.getElementById('teamModal');
const teamOptions = document.getElementById('teamOptions');
const createTeamBtn = document.getElementById('createTeamBtn');
const joinTeamBtn = document.getElementById('joinTeamBtn');
const createTeamForm = document.getElementById('createTeamForm');
const joinTeamForm = document.getElementById('joinTeamForm');
const createTeamFormElement = document.getElementById('createTeamFormElement');
const joinTeamFormElement = document.getElementById('joinTeamFormElement');
const backFromCreate = document.getElementById('backFromCreate');
const backFromJoin = document.getElementById('backFromJoin');
const createTeamError = document.getElementById('createTeamError');
const joinTeamError = document.getElementById('joinTeamError');
const teamCreatedSuccess = document.getElementById('teamCreatedSuccess');
const generatedTeamCode = document.getElementById('generatedTeamCode');
const continueToEvent = document.getElementById('continueToEvent');

// Team Details Modal
const teamDetailsModal = document.getElementById('teamDetailsModal');
const closeTeamDetails = document.getElementById('closeTeamDetails');
const teamDetailsName = document.getElementById('teamDetailsName');
const teamDetailsCode = document.getElementById('teamDetailsCode');
const teamMembersList = document.getElementById('teamMembersList');
const teamDetailsBtn = document.getElementById('teamDetailsBtn');

// Profile
const profileCircle = document.getElementById('profileCircle');
const profilePopup = document.getElementById('profilePopup');
const closeProfile = document.getElementById('closeProfile');
const profileUsername = document.getElementById('profileUsername');
const profileEmail = document.getElementById('profileEmail');
const logoutBtn = document.getElementById('logoutBtn');

// ============================================
// AUTH STATE LISTENER
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const result = await getUserData(user.uid);
        if (result.success) {
            currentUserData = result.data;
            profileUsername.textContent = currentUserData.username;
            profileEmail.textContent = currentUserData.email;

            // Check if user has a team
            if (currentUserData.teamId) {
                const teamResult = await getTeamDetails(currentUserData.teamId);
                if (teamResult.success) {
                    window.setCurrentTeamData(teamResult.data);
                }
            }
        }
    } else {
        currentUser = null;
        currentUserData = null;
        window.setCurrentTeamData(null);
    }
});

// ============================================
// ENTER EVENT BUTTON
// ============================================
enterEventBtn.addEventListener('click', () => {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// ============================================
// AUTH MODAL - CLOSE
// ============================================
closeAuthModal.addEventListener('click', () => {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
    clearAuthErrors();
});

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
        clearAuthErrors();
    }
});

// ============================================
// AUTH TABS SWITCHING
// ============================================
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');

        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (tabName === 'register') {
            registerFormDiv.classList.add('active');
            loginFormDiv.classList.remove('active');
        } else {
            loginFormDiv.classList.add('active');
            registerFormDiv.classList.remove('active');
        }
        clearAuthErrors();
    });
});

// ============================================
// REGISTER FORM SUBMIT
// ============================================
registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    registerError.textContent = '';

    const result = await registerUser(email, password, username);

    if (result.success) {
        currentUser = result.user;
        authModal.classList.remove('active');
        showTeamModal();
    } else {
        registerError.textContent = result.error;
    }
});

// ============================================
// LOGIN FORM SUBMIT
// ============================================
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginError.textContent = '';

    const result = await loginUser(email, password);

    if (result.success) {
        currentUser = result.user;

        // Get user data to check team status
        const userData = await getUserData(result.user.uid);
        if (userData.success) {
            currentUserData = userData.data;
            profileUsername.textContent = currentUserData.username;
            profileEmail.textContent = currentUserData.email;

            authModal.classList.remove('active');

            if (currentUserData.teamId) {
                // User already has a team, go to dashboard
                const teamResult = await getTeamDetails(currentUserData.teamId);
                if (teamResult.success) {
                    window.setCurrentTeamData(teamResult.data);
                }
                showDashboard();
            } else {
                // User needs to create/join team
                showTeamModal();
            }
        }
    } else {
        loginError.textContent = result.error;
    }
});

// ============================================
// TEAM MODAL FUNCTIONS
// ============================================
function showTeamModal() {
    teamModal.classList.add('active');
    teamOptions.style.display = 'flex';
    createTeamForm.style.display = 'none';
    joinTeamForm.style.display = 'none';
    teamCreatedSuccess.style.display = 'none';
    document.body.style.overflow = 'hidden';
}

createTeamBtn.addEventListener('click', () => {
    teamOptions.style.display = 'none';
    createTeamForm.style.display = 'block';
});

joinTeamBtn.addEventListener('click', () => {
    teamOptions.style.display = 'none';
    joinTeamForm.style.display = 'block';
});

backFromCreate.addEventListener('click', () => {
    createTeamForm.style.display = 'none';
    teamOptions.style.display = 'flex';
    createTeamError.textContent = '';
});

backFromJoin.addEventListener('click', () => {
    joinTeamForm.style.display = 'none';
    teamOptions.style.display = 'flex';
    joinTeamError.textContent = '';
});

// ============================================
// CREATE TEAM FORM SUBMIT
// ============================================
createTeamFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const teamName = document.getElementById('teamName').value.trim();
    const teamSize = document.getElementById('teamSize').value;

    createTeamError.textContent = '';

    const result = await createTeam(teamName, teamSize, currentUser.uid);

    if (result.success) {
        generatedTeamCode.textContent = result.code;
        createTeamForm.style.display = 'none';
        teamCreatedSuccess.style.display = 'block';

        // Update current team data
        const teamResult = await getTeamDetails(result.teamId);
        if (teamResult.success) {
            window.setCurrentTeamData(teamResult.data);
        }
    } else {
        createTeamError.textContent = result.error;
    }
});

// ============================================
// JOIN TEAM FORM SUBMIT
// ============================================
joinTeamFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const teamCode = document.getElementById('teamCode').value.trim().toUpperCase();

    joinTeamError.textContent = '';

    const result = await joinTeam(teamCode, currentUser.uid);

    if (result.success) {
        // Update current team data
        const teamResult = await getTeamDetails(result.teamId);
        if (teamResult.success) {
            window.setCurrentTeamData(teamResult.data);
        }

        teamModal.classList.remove('active');
        showDashboard();
        launchConfetti();
    } else {
        joinTeamError.textContent = result.error;
    }
});

// ============================================
// CONTINUE TO EVENT
// ============================================
continueToEvent.addEventListener('click', () => {
    teamModal.classList.remove('active');
    showDashboard();
    launchConfetti();
});

// ============================================
// SHOW DASHBOARD
// ============================================
function showDashboard() {
    landingPage.style.display = 'none';
    dashboard.classList.add('active');
    document.body.style.overflow = '';
}

// ============================================
// TEAM DETAILS BUTTON
// ============================================
teamDetailsBtn.addEventListener('click', async () => {
    if (currentTeamData) {
        teamDetailsName.textContent = currentTeamData.name;
        teamDetailsCode.textContent = currentTeamData.code;

        // Populate members list
        teamMembersList.innerHTML = '';
        currentTeamData.memberDetails.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-item';
            memberDiv.innerHTML = `
                <span class="member-avatar">👤</span>
                <div class="member-info">
                    <span class="member-name">${member.username}</span>
                    <span class="member-email">${member.email}</span>
                </div>
            `;
            teamMembersList.appendChild(memberDiv);
        });

        teamDetailsModal.classList.add('active');
    }
});

closeTeamDetails.addEventListener('click', () => {
    teamDetailsModal.classList.remove('active');
});

teamDetailsModal.addEventListener('click', (e) => {
    if (e.target === teamDetailsModal) {
        teamDetailsModal.classList.remove('active');
    }
});

// ============================================
// PROFILE POPUP
// ============================================
profileCircle.addEventListener('click', () => {
    profilePopup.classList.toggle('active');
});

closeProfile.addEventListener('click', () => {
    profilePopup.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!profileCircle.contains(e.target) && !profilePopup.contains(e.target)) {
        profilePopup.classList.remove('active');
    }
});

// ============================================
// LOGOUT
// ============================================
logoutBtn.addEventListener('click', async () => {
    const result = await logoutUser();
    if (result.success) {
        currentUser = null;
        currentUserData = null;
        window.setCurrentTeamData(null);

        dashboard.classList.remove('active');
        landingPage.style.display = 'block';
        profilePopup.classList.remove('active');

        // Reset forms
        registerFormElement.reset();
        loginFormElement.reset();
        createTeamFormElement.reset();
        joinTeamFormElement.reset();
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function clearAuthErrors() {
    registerError.textContent = '';
    loginError.textContent = '';
}

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
        authModal.classList.remove('active');
        teamModal.classList.remove('active');
        teamDetailsModal.classList.remove('active');
        profilePopup.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================
const leaderboardBody = document.getElementById('leaderboardBody');
const leaderboardLoading = document.getElementById('leaderboardLoading');
const leaderboardEmpty = document.getElementById('leaderboardEmpty');
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboard');

async function loadLeaderboard() {
    if (!leaderboardBody) return;

    // Show loading
    leaderboardLoading.style.display = 'flex';
    leaderboardEmpty.style.display = 'none';

    // Clear existing rows (keep loading and empty elements)
    const existingRows = leaderboardBody.querySelectorAll('.leaderboard-row');
    existingRows.forEach(row => row.remove());

    const result = await getAllTeams();

    leaderboardLoading.style.display = 'none';

    if (result.success && result.teams.length > 0) {
        result.teams.forEach((team, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            if (index < 3) {
                row.classList.add(`rank-${index + 1}`);
            }

            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            row.innerHTML = `
                <div class="lb-col lb-rank">${rankIcon}</div>
                <div class="lb-col lb-team">
                    <span class="team-name">${team.name}</span>
                </div>
                <div class="lb-col lb-members">${team.memberCount}/${team.maxSize}</div>
                <div class="lb-col lb-score">${team.score}</div>
            `;

            leaderboardBody.appendChild(row);
        });
    } else if (result.success && result.teams.length === 0) {
        leaderboardEmpty.style.display = 'flex';
    }
}

// Refresh leaderboard button
if (refreshLeaderboardBtn) {
    refreshLeaderboardBtn.addEventListener('click', () => {
        refreshLeaderboardBtn.classList.add('spinning');
        loadLeaderboard().then(() => {
            setTimeout(() => {
                refreshLeaderboardBtn.classList.remove('spinning');
            }, 500);
        });
    });
}

// Load leaderboard when switching to leaderboard section
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.getAttribute('data-round') === 'leaderboard') {
            loadLeaderboard();
        }
    });
});

// ============================================
// ROUND LOCKS - LISTEN FOR FIRESTORE CHANGES
// ============================================
function initRoundLocks() {
    const db = getFirestore(); // Ensure db is initialized

    // Listen to the 'rounds_status' document in real-time
    onSnapshot(doc(db, "event_settings", "rounds_status"), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const status = docSnapshot.data();
            
            // Update the UI for each round
            updateRoundState("round1", status.round1_open);
            updateRoundState("round2", status.round2_open);
            updateRoundState("round3", status.round3_open);
            updateRoundState("round4", status.round4_open);
        } else {
            console.log("No round settings found! Creating defaults...");
        }
    });
}

// Helper function to lock/unlock specific rounds
function updateRoundState(roundId, isOpen) {
    // 1. Find the sidebar button
    // Note: We search by the 'data-round' attribute you used in HTML
    const navBtn = document.querySelector(`.nav-item[data-round="${roundId}"]`);
    
    // 2. Find the actual section content
    const section = document.getElementById(roundId);

    if (navBtn && section) {
        if (isOpen) {
            // --- UNLOCKED STATE ---
            navBtn.classList.remove("locked");
            section.classList.remove("locked-content");
            
            // Remove any "Locked" overlay if you added one
            const lockedMsg = section.querySelector('.locked-message');
            if(lockedMsg) lockedMsg.remove();
            
            // Show the original content (children)
            Array.from(section.children).forEach(child => child.style.display = '');

        } else {
            // --- LOCKED STATE ---
            navBtn.classList.add("locked");
            
            // Hide section content to prevent interaction while locked
            Array.from(section.children).forEach(child => child.style.display = 'none');

            // If the user is currently looking at this locked section, switch them to Intro
            if (section.classList.contains("active")) {
                const introBtn = document.querySelector('.nav-item[data-round="intro"]');
                if (introBtn) introBtn.click();
            }
        }
    }
}

// Initialize navigation behaviour for sidebar buttons
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.round-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Respect locked state
            if (item.classList.contains('locked')) {
                // Optional: brief visual feedback for locked sections
                item.classList.add('shake');
                setTimeout(() => item.classList.remove('shake'), 300);
                return;
            }

            const target = item.getAttribute('data-round');
            if (!target) return;

            // Remove active on all nav items
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Hide all sections
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none';
            });

            // Show target section
            const section = document.getElementById(target);
            if (section) {
                section.classList.add('active');
                section.style.display = '';
            }

            // Special handling: if leaderboard clicked, trigger load
            if (target === 'leaderboard') {
                if (typeof loadLeaderboard === 'function') loadLeaderboard();
            }
        });
    });

    // Ensure an initial section is visible: prefer an item already marked `.active`, otherwise default to intro
    const initial = document.querySelector('.nav-item.active') || document.querySelector('.nav-item[data-round="intro"]');
    if (initial) initial.click();
}

// Initialize navigation first, then listen for round lock changes
initNavigation();
initRoundLocks();

console.log('App.js loaded successfully');
