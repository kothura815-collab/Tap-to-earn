// ==========================================
// Telegram WebApp Initialization
// ==========================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;

// ==========================================
// Adsterra Smart Links
// ==========================================
const SMART_LINK_1 = "https://asiafilm.org/4/e86eb6e961ace79e8f0afaa11d643848";
const SMART_LINK_2 = "https://asiafilm.org/4/39fe0c373bd3ed585a41b288e8162a7d";

// ==========================================
// Telegram Bot Config
// ==========================================
const BOT_TOKEN = "8982916798:AAFl1DhvrjpV_RhYmb9B-1dVfL8lDqkk93A";
const CHAT_ID = "-1004291919386";

// ==========================================
// Variables
// ==========================================
let timeLeft = 10;
let isTapped = false;
let isProcessing = false;
let timerInterval;
let currentReward = 0.01;

// ==========================================
// DOM Elements
// ==========================================
const coinBtn = document.getElementById('coinBtn');
const secondsSpan = document.getElementById('secondsLeft');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const successScreen = document.getElementById('successScreen');
const mainContainer = document.getElementById('mainContainer');
const processingScreen = document.getElementById('processingScreen');
const processingTimer = document.getElementById('processingTimer');
const rewardAmountSpan = document.getElementById('rewardAmount');
const watchAdBtn = document.getElementById('watchAdBtn');
const userNameSpan = document.getElementById('userName');
const userBalanceSpan = document.getElementById('userBalance');

// ==========================================
// Security: Disable DevTools & Right Click
// ==========================================
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
    if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
    ) {
        e.preventDefault();
        return false;
    }
});

// Detect DevTools open
setInterval(() => {
    const start = performance.now();
    debugger;
    const end = performance.now();
    if (end - start > 100) {
        document.body.innerHTML = "<h1 style='color:red;text-align:center;margin-top:50vh;'>DevTools Detected. Please close it.</h1>";
    }
}, 1000);

// ==========================================
// User Info
// ==========================================
if (user) {
    userNameSpan.textContent = user.first_name || 'User';
    loadUserBalance();
} else {
    userNameSpan.textContent = 'Guest';
}

// ==========================================
// Firebase Functions
// ==========================================
async function getFirestoreModules() {
    const { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");
    return { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs };
}

async function loadUserBalance() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const balance = userSnap.data().balance || 0;
            userBalanceSpan.textContent = `$${balance.toFixed(2)}`;
        }
    } catch (error) {
        console.error("Error loading balance:", error);
    }
}

async function saveUserBalance(newBalance) {
    if (!user || !window.db) return;
    try {
        const { doc, setDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        await setDoc(userRef, {
            userId: user.id.toString(),
            firstName: user.first_name || "User",
            balance: newBalance,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving balance:", error);
    }
}

// ==========================================
// Countdown Logic
// ==========================================
function startCountdown() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resetGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    secondsSpan.textContent = timeLeft;
    progressText.textContent = `TIME LEFT: ${timeLeft}`;
    progressBar.style.width = `${(timeLeft / 10) * 100}%`;
}

function resetGame() {
    if (!isTapped) {
        timeLeft = 10;
        updateTimerDisplay();
        startCountdown();
        tg.showAlert("Time's up! Try again.");
    }
}

// ==========================================
// STEP 1: Coin Tap -> Open Smart Link 1
// ==========================================
coinBtn.addEventListener('click', () => {
    if (isTapped || isProcessing) return;
    isTapped = true;
    isProcessing = true;
    clearInterval(timerInterval);

    // Open Smart Link 1
    window.open(SMART_LINK_1, '_blank');

    // Hide main, show processing
    mainContainer.classList.add('hidden');
    processingScreen.classList.remove('hidden');

    // Processing countdown (10 seconds)
    let processTime = 10;
    processingTimer.textContent = processTime;

    const processInterval = setInterval(() => {
        processTime--;
        processingTimer.textContent = processTime;

        if (processTime <= 0) {
            clearInterval(processInterval);
            isProcessing = false;
            processingScreen.classList.add('hidden');
            successScreen.classList.remove('hidden');
            rewardAmountSpan.textContent = `$${currentReward.toFixed(2)}`;
        }
    }, 1000);
});

// ==========================================
// STEP 2: Watch Ad & Claim -> Open Smart Link 2
// ==========================================
watchAdBtn.addEventListener('click', async () => {
    // Open Smart Link 2
    window.open(SMART_LINK_2, '_blank');

    // Claim reward after 2 seconds
    setTimeout(async () => {
        await claimReward();
    }, 2000);
});

// ==========================================
// Reward Claim Function
// ==========================================
async function claimReward() {
    if (!user) {
        tg.showAlert("User data not found. Please open from Telegram.");
        return;
    }

    try {
        const { doc, getDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);

        let currentBalance = 0;
        if (userSnap.exists()) {
            currentBalance = userSnap.data().balance || 0;
        }

        const newBalance = currentBalance + currentReward;
        await saveUserBalance(newBalance);
        userBalanceSpan.textContent = `$${newBalance.toFixed(2)}`;

        tg.showAlert(`You earned $${currentReward.toFixed(2)}!\nNew balance: $${newBalance.toFixed(2)}`);
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error("Claim error:", error);
        tg.showAlert("Something went wrong. Please try again.");
    }
}

// ==========================================
// Withdraw Function
// ==========================================
async function withdraw() {
    if (!user || !window.db) {
        tg.showAlert("Please open from Telegram.");
        return;
    }

    try {
        const { doc, getDoc, addDoc, collection } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            tg.showAlert("No balance found. Tap to earn first!");
            return;
        }

        const balance = userSnap.data().balance || 0;
        const minWithdraw = 1.00;

        if (balance < minWithdraw) {
            tg.showAlert(`Minimum withdraw is $${minWithdraw.toFixed(2)}.\nYour balance: $${balance.toFixed(2)}`);
            return;
        }

        await addDoc(collection(window.db, "withdrawals"), {
            userId: user.id.toString(),
            firstName: user.first_name || "User",
            amount: balance,
            status: "pending",
            requestedAt: new Date().toISOString()
        });

        const message = `New Withdraw Request\nUser: ${user.first_name} (${user.id})\nAmount: $${balance.toFixed(2)}`;

        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        } catch (error) {
            console.error("Telegram error:", error);
        }

        tg.showAlert("Withdraw request sent! Admin will review.");
    } catch (error) {
        console.error("Withdraw error:", error);
        tg.showAlert("Something went wrong. Please try again.");
    }
}

// ==========================================
// Show History Function
// ==========================================
async function showHistory() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    modal.classList.remove('hidden');
    list.innerHTML = `<li>Loading...</li>`;

    if (!user || !window.db) {
        list.innerHTML = `<li>No history yet.</li>`;
        return;
    }

    try {
        const { collection, query, where, getDocs } = await getFirestoreModules();
        const q = query(collection(window.db, "withdrawals"), where("userId", "==", user.id.toString()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            list.innerHTML = `<li>No history yet.</li>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const status = data.status === 'pending' ? 'Pending' : 'Success';
            html += `<li>${status} - $${data.amount.toFixed(2)}<br><small>${new Date(data.requestedAt).toLocaleString()}</small></li>`;
        });
        list.innerHTML = html;
    } catch (error) {
        console.error("History error:", error);
        list.innerHTML = `<li>Error loading history.</li>`;
    }
}

function closeHistory() {
    document.getElementById('historyModal').classList.add('hidden');
}

// ==========================================
// Global Functions
// ==========================================
window.showHistory = showHistory;
window.closeHistory = closeHistory;
window.withdraw = withdraw;

// ==========================================
// Initialize
// ==========================================
window.onload = () => {
    startCountdown();
};
