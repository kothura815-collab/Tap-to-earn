const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;

// ==========================================
// Variables
// ==========================================
let timeLeft = 10;
let isTapped = false;
let tapCount = 0;
let accumulatedReward = 0;
let timerInterval;
let processingTimer;
let isWaitingForBack = false;

// AdsGram Block ID (Main only)
const ADSGRAM_BLOCK_ID = "51279";

// Adsterra Smart Links
const SMART_LINKS = [
    "https://asiafilm.org/4/e86eb6e961ace79e8f0afaa11d643848",
    "https://asiafilm.org/4/39fe0c373bd3ed585a41b288e8162a7d",
    "https://araplhn.org/4/a72845c18c5165595bcb555e1431938d"
];

// ==========================================
// DOM Elements
// ==========================================
const coinBtn = document.getElementById('coinBtn');
const secondsSpan = document.getElementById('secondsLeft');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const mainContainer = document.getElementById('mainContainer');
const processingScreen = document.getElementById('processingScreen');
const firstClaimScreen = document.getElementById('firstClaimScreen');
const finalClaimScreen = document.getElementById('finalClaimScreen');
const processingTimerSpan = document.getElementById('processingTimer');
const firstRewardAmount = document.getElementById('firstRewardAmount');
const finalRewardAmount = document.getElementById('finalRewardAmount');
const userNameSpan = document.getElementById('userName');
const userBalanceSpan = document.getElementById('userBalance');
const tapCountDisplay = document.getElementById('tapCountDisplay');
const floatingPlus = document.getElementById('floatingPlus');

// ==========================================
// Load User
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
    const { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js");
    return { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, updateDoc };
}

async function loadUserBalance() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            userBalanceSpan.textContent = `$${userSnap.data().balance.toFixed(5)}`;
        }
    } catch (error) { console.error("Load balance error:", error); }
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
    } catch (error) { console.error("Save balance error:", error); }
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
            if (tapCount > 0) {
                openSmartLink();
            } else {
                timeLeft = 10;
                updateTimerDisplay();
                startCountdown();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    secondsSpan.textContent = timeLeft;
    progressText.textContent = `TIME LEFT: ${timeLeft}`;
    progressBar.style.width = `${(timeLeft / 10) * 100}%`;
}

// ==========================================
// Coin Tap Event
// ==========================================
coinBtn.addEventListener('click', () => {
    if (isTapped) return;
    
    tapCount++;
    
    // Random reward: 0.00001 to 0.00005
    const randomReward = (Math.random() * (0.00005 - 0.00001) + 0.00001);
    accumulatedReward += randomReward;
    
    // Show floating plus animation
    floatingPlus.textContent = `+${randomReward.toFixed(5)}`;
    floatingPlus.classList.remove('hidden');
    floatingPlus.style.animation = 'none';
    floatingPlus.offsetHeight;
    floatingPlus.style.animation = 'floatUp 1s ease-out forwards';
    
    tapCountDisplay.textContent = tapCount;
    
    coinBtn.style.transform = 'scale(0.9)';
    setTimeout(() => coinBtn.style.transform = 'scale(1)', 100);

    if (tapCount >= 10) {
        isTapped = true;
    }
});

// ==========================================
// Open Smart Link (Direct Link)
// ==========================================
function openSmartLink() {
    isWaitingForBack = true;
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');
    
    // 5s delay then show First Claim Screen
    setTimeout(() => {
        if (isWaitingForBack) {
            isWaitingForBack = false;
            mainContainer.classList.add('hidden');
            firstClaimScreen.classList.remove('hidden');
            
            // First Step Reward: 0.00001 to 0.00005
            const firstReward = (Math.random() * (0.00005 - 0.00001) + 0.00001);
            accumulatedReward += firstReward;
            firstRewardAmount.textContent = `$${firstReward.toFixed(5)}`;
        }
    }, 5000);
}

// ==========================================
// First Claim Button (No AdsGram here - just proceed)
// ==========================================
document.getElementById('firstClaimBtn').addEventListener('click', () => {
    // Show Processing Screen
    firstClaimScreen.classList.add('hidden');
    processingScreen.classList.remove('hidden');
    
    let processTime = 10;
    processingTimerSpan.textContent = processTime;
    
    processingTimer = setInterval(() => {
        processTime--;
        processingTimerSpan.textContent = processTime;
        if (processTime <= 0) {
            clearInterval(processingTimer);
            // Show Final Screen
            processingScreen.classList.add('hidden');
            finalClaimScreen.classList.remove('hidden');
            
            const finalReward = (Math.random() * (0.00005 - 0.00001) + 0.00001);
            accumulatedReward += finalReward;
            finalRewardAmount.textContent = `$${finalReward.toFixed(5)}`;
        }
    }, 1000);
});

// ==========================================
// Final Claim Button (AdsGram 51279)
// ==========================================
document.getElementById('finalClaimBtn').addEventListener('click', async () => {
    try {
        const AdController = window.Adsgram?.init({ 
            blockId: ADSGRAM_BLOCK_ID,
            debug: true 
        });

        if (AdController) {
            const result = await AdController.show();
            if (result.done) {
                await claimReward();
            } else {
                tg.showAlert("Please watch the full ad to claim.");
            }
        } else {
            // If SDK not loaded, claim directly
            await claimReward();
        }
    } catch (error) {
        console.error("Ad error:", error);
        // If error, claim directly
        await claimReward();
    }
});

// ==========================================
// Claim Reward
// ==========================================
async function claimReward() {
    if (!user) {
        tg.showAlert("User not found.");
        resetGameState();
        return;
    }
    try {
        const { doc, getDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        let currentBalance = 0;
        if (userSnap.exists()) currentBalance = userSnap.data().balance || 0;
        
        const totalReward = accumulatedReward;
        const newBalance = currentBalance + totalReward;
        
        await saveUserBalance(newBalance);
        userBalanceSpan.textContent = `$${newBalance.toFixed(5)}`;
        
        tg.showAlert(`🎉 You earned $${totalReward.toFixed(5)}!`);
        
        resetGameState();
    } catch (error) {
        console.error("Claim error:", error);
        tg.showAlert("Something went wrong.");
        resetGameState();
    }
}

// ==========================================
// Reset Game State
// ==========================================
function resetGameState() {
    timeLeft = 10;
    isTapped = false;
    tapCount = 0;
    accumulatedReward = 0;
    isWaitingForBack = false;
    tapCountDisplay.textContent = "0";
    
    mainContainer.classList.remove('hidden');
    processingScreen.classList.add('hidden');
    firstClaimScreen.classList.add('hidden');
    finalClaimScreen.classList.add('hidden');
    floatingPlus.classList.add('hidden');
    
    updateTimerDisplay();
    startCountdown();
}

// ==========================================
// Withdraw
// ==========================================
async function withdraw() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc, addDoc, collection, updateDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return tg.showAlert("No balance found.");
        
        const balance = userSnap.data().balance || 0;
        if (balance < 1.00) return tg.showAlert("Minimum withdraw is $1.00");
        
        await addDoc(collection(window.db, "withdrawals"), {
            userId: user.id.toString(),
            firstName: user.first_name || "User",
            amount: balance,
            status: "pending",
            requestedAt: new Date().toISOString()
        });

        await updateDoc(userRef, {
            balance: 0,
            lastWithdraw: new Date().toISOString()
        });
        
        userBalanceSpan.textContent = "$0.00000";

        const BOT_TOKEN = "8982916798:AAFl1DhvrjpV_RhYmb9B-1dVfL8lDqkk93A"; 
        const CHAT_ID = "-1004291919386";
        const message = `🔔 New Withdraw Request\n👤 User: ${user.first_name} (${user.id})\n💰 Amount: $${balance.toFixed(5)}`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
        });

        tg.showAlert("Withdraw request sent! Balance reset to 0.");
    } catch (error) { 
        console.error("Withdraw error:", error);
        tg.showAlert("Error."); 
    }
}

// ==========================================
// History
// ==========================================
async function showHistory() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    modal.classList.remove('hidden');
    list.innerHTML = `<li>Loading...</li>`;
    if (!user || !window.db) return list.innerHTML = `<li>No history.</li>`;
    try {
        const { collection, query, where, getDocs } = await getFirestoreModules();
        const q = query(collection(window.db, "withdrawals"), where("userId", "==", user.id.toString()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return list.innerHTML = `<li>No history yet.</li>`;
        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            html += `<li>${data.status === 'pending' ? '🟡' : '🟢'} $${data.amount.toFixed(5)}<br><small>${new Date(data.requestedAt).toLocaleString()}</small></li>`;
        });
        list.innerHTML = html;
    } catch (error) { list.innerHTML = `<li>Error.</li>`; }
}

function closeHistory() { document.getElementById('historyModal').classList.add('hidden'); }

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
