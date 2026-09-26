// ==========================================
// Telegram WebApp Initialization
// ==========================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;

// ==========================================
// Variables
// ==========================================
let timeLeft = 10;
let isTapped = false;
let timerInterval;
let currentReward = 0.01;

// ==========================================
// Adsterra Smart Links (သင့် Link တွေ ဒီမှာ ထည့်ပါ)
// ==========================================
const ADSTERRA_LINKS = [
    "https://asiafilm.org/4/e86eb6e961ace79e8f0afaa11d643848",
    "https://asiafilm.org/4/39fe0c373bd3ed585a41b288e8162a7d"
];
let currentAdIndex = 0;

// ==========================================
// DOM Elements
// ==========================================
const coinBtn = document.getElementById('coinBtn');
const secondsSpan = document.getElementById('secondsLeft');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const successScreen = document.getElementById('successScreen');
const mainContainer = document.getElementById('mainContainer');
const rewardAmountSpan = document.getElementById('rewardAmount');
const watchAdBtn = document.getElementById('watchAdBtn');
const userNameSpan = document.getElementById('userName');
const userBalanceSpan = document.getElementById('userBalance');
const adStatus = document.getElementById('adStatus');

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
// Basic Security (Auto-clicker / Inspect ကာကွယ်ခြင်း)
// ==========================================
// Right Click ပိတ်
document.addEventListener('contextmenu', (e) => e.preventDefault());

// F12 / Ctrl+Shift+I / Ctrl+U ပိတ်
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

// Auto-clicker ကာကွယ်ရန် (Click ကြားထဲ အနည်းဆုံး 300ms ခြားရမယ်)
let lastClickTime = 0;
function isHumanClick() {
    const now = Date.now();
    if (now - lastClickTime < 300) return false;
    lastClickTime = now;
    return true;
}

// ==========================================
// Firebase Firestore Functions
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
// Coin Tap Event
// ==========================================
coinBtn.addEventListener('click', () => {
    if (isTapped) return;
    if (!isHumanClick()) return; // Auto-clicker စစ်

    isTapped = true;
    clearInterval(timerInterval);
    mainContainer.classList.add('hidden');
    successScreen.classList.remove('hidden');
    rewardAmountSpan.textContent = `$${currentReward.toFixed(2)}`;
});

// ==========================================
// Adsterra Smart Link Flow
// ==========================================
let adClicked = false;
let adOpenedTime = 0;

watchAdBtn.addEventListener('click', async () => {
    if (adClicked) {
        tg.showAlert("Please wait for the ad to complete.");
        return;
    }

    adClicked = true;
    adStatus.textContent = "Opening ad... Please wait 5 seconds.";

    // လက်ရှိ Ad Link ကို ယူပါ
    const adLink = ADSTERRA_LINKS[currentAdIndex];
    
    // Link ကို ဖွင့်ပါ (Telegram Web App ထဲမှာ)
    tg.openLink(adLink, { try_instant_view: false });

    // 5 စက္ကန့် စောင့်ပါ
    adOpenedTime = Date.now();
    setTimeout(() => {
        adStatus.textContent = "You can now claim your reward!";
        adClicked = false; // ပြန်နှိပ်လို့ရအောင်
        claimReward();
    }, 5000);

    // နောက် Ad Link ကို ပြောင်းပါ
    currentAdIndex = (currentAdIndex + 1) % ADSTERRA_LINKS.length;
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

        tg.showAlert(`🎉 You earned $${currentReward.toFixed(2)}!\nNew balance: $${newBalance.toFixed(2)}`);
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

        // Telegram Channel ဆီ ပို့ပါ
        const BOT_TOKEN = "8982916798:AAFl1DhvrjpV_RhYmb9B-1dVfL8lDqkk93A"; 
        const CHAT_ID = "-1004291919386";
        
        const message = `🔔 New Withdraw Request\n👤 User: ${user.first_name} (${user.id})\n💰 Amount: $${balance.toFixed(2)}`;

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
            const status = data.status === 'pending' ? '🟡 Pending' : '🟢 Success';
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
