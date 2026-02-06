// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6tZbIeD7PIWcYgsW7BUPH9VEfUUo5CqQ",
    authDomain: "web3verse-e9464.firebaseapp.com",
    projectId: "web3verse-e9464",
    storageBucket: "web3verse-e9464.firebasestorage.app",
    messagingSenderId: "459771875792",
    appId: "1:459771875792:web:25a7b02fdf00efe211e9d5",
    measurementId: "G-909M8F4ZMX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized successfully");

// ============================================
// GENERATE TEAM CODE
// ============================================
function generateTeamCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ============================================
// AUTH FUNCTIONS
// ============================================
async function registerUser(email, password, username) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            teamId: null,
            createdAt: new Date().toISOString()
        });

        console.log("User registered:", user.uid);
        return { success: true, user };
    } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: error.message };
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user.uid);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
        console.log("User logged out");
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: error.message };
    }
}

// ============================================
// USER FUNCTIONS
// ============================================
async function getUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data() };
        }
        return { success: false, error: "User not found" };
    } catch (error) {
        console.error("Get user error:", error);
        return { success: false, error: error.message };
    }
}

// ============================================
// TEAM FUNCTIONS
// ============================================
async function createTeam(teamName, maxSize, creatorUid) {
    try {
        // Generate unique code
        let code = generateTeamCode();

        // Check if code already exists
        const q = query(collection(db, "teams"), where("code", "==", code));
        const snapshot = await getDocs(q);
        while (snapshot.size > 0) {
            code = generateTeamCode();
        }

        const teamId = code; // Use code as team ID for simplicity

        // Create team document
        await setDoc(doc(db, "teams", teamId), {
            name: teamName,
            code: code,
            maxSize: parseInt(maxSize),
            createdBy: creatorUid,
            members: [creatorUid],
            createdAt: new Date().toISOString()
        });

        // Update user's teamId
        await updateDoc(doc(db, "users", creatorUid), {
            teamId: teamId
        });

        console.log("Team created:", teamId);
        return { success: true, teamId, code };
    } catch (error) {
        console.error("Create team error:", error);
        return { success: false, error: error.message };
    }
}

async function joinTeam(teamCode, userUid) {
    try {
        // Find team by code
        const q = query(collection(db, "teams"), where("code", "==", teamCode.toUpperCase()));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: "Team not found with this code" };
        }

        const teamDoc = snapshot.docs[0];
        const teamData = teamDoc.data();
        const teamId = teamDoc.id;

        // Check if team is full
        if (teamData.members.length >= teamData.maxSize) {
            return { success: false, error: "Team is full" };
        }

        // Check if user already in team
        if (teamData.members.includes(userUid)) {
            return { success: false, error: "You are already in this team" };
        }

        // Add user to team
        await updateDoc(doc(db, "teams", teamId), {
            members: arrayUnion(userUid)
        });

        // Update user's teamId
        await updateDoc(doc(db, "users", userUid), {
            teamId: teamId
        });

        console.log("Joined team:", teamId);
        return { success: true, teamId, teamName: teamData.name };
    } catch (error) {
        console.error("Join team error:", error);
        return { success: false, error: error.message };
    }
}

async function getTeamDetails(teamId) {
    try {
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (!teamDoc.exists()) {
            return { success: false, error: "Team not found" };
        }

        const teamData = teamDoc.data();

        // Get member details
        const memberDetails = [];
        for (const memberId of teamData.members) {
            const memberDoc = await getDoc(doc(db, "users", memberId));
            if (memberDoc.exists()) {
                memberDetails.push({
                    uid: memberId,
                    username: memberDoc.data().username,
                    email: memberDoc.data().email
                });
            }
        }

        return {
            success: true,
            data: {
                ...teamData,
                memberDetails
            }
        };
    } catch (error) {
        console.error("Get team error:", error);
        return { success: false, error: error.message };
    }
}

// Export for use in main script
export {
    auth,
    db,
    onAuthStateChanged,
    registerUser,
    loginUser,
    logoutUser,
    getUserData,
    createTeam,
    joinTeam,
    getTeamDetails
};
