const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;

// Variables
let timeLeft = 10;
let isTapped = false;
let tapCount = 0;
let accumulatedReward = 0;
let timerInterval;
let processingTimer;

// Adsterra Smart Links
const SMART_LINKS = [
    "https://asiafilm.org/4/e86eb6e961ace79e8f0afaa11d643848",
    "https://asiafilm.org/4/39fe0c373bd3ed585a41b288e8162a7d",
    "https://araplhn.org/4/a72845c18c5165595bcb555e1431938d"
];

// DOM Elements
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

// Load User
if (user) {
    userNameSpan.textContent = user.first_name || 'User';
    loadUserBalance();
}

// Firebase Functions
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
            userBalanceSpan.textContent = `$${userSnap.data().balance.toFixed(5)}`;
        }
    } catch (error) { console.error(error); }
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
    } catch (error) { console.error(error); }
}

// Countdown Logic
function startCountdown() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (tapCount > 0) {
                showProcessingScreen();
            } else {
                // No taps, reset timer
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

// Coin Tap
coinBtn.addEventListener('click', () => {
    if (isTapped) return;
    
    tapCount++;
    // Random reward between 0.00001 and 0.00005
    const randomReward = (Math.random() * (0.00005 - 0.00001) + 0.00001);
    accumulatedReward += randomReward;
    
    // Update UI feedback (optional)
    coinBtn.style.transform = 'scale(0.9)';
    setTimeout(() => coinBtn.style.transform = 'scale(1)', 100);

    // If 10 taps reached, go to processing
    if (tapCount >= 10) {
        isTapped = true;
        clearInterval(timerInterval);
        showProcessingScreen();
    }
});

// Processing Screen
function showProcessingScreen() {
    mainContainer.classList.add('hidden');
    processingScreen.classList.remove('hidden');
    
    let processTime = 10;
    processingTimerSpan.textContent = processTime;
    
    processingTimer = setInterval(() => {
        processTime--;
        processingTimerSpan.textContent = processTime;
        if (processTime <= 0) {
            clearInterval(processingTimer);
            showFirstClaimScreen();
        }
    }, 1000);
}

// First Claim Screen
function showFirstClaimScreen() {
    processingScreen.classList.add('hidden');
    firstClaimScreen.classList.remove('hidden');
    firstRewardAmount.textContent = `$${accumulatedReward.toFixed(5)}`;
}

// First Claim Button
document.getElementById('firstClaimBtn').addEventListener('click', () => {
    // Open Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');
    
    // Show Final Screen after a short delay
    setTimeout(() => {
        firstClaimScreen.classList.add('hidden');
        finalClaimScreen.classList.remove('hidden');
        finalRewardAmount.textContent = `$${accumulatedReward.toFixed(5)}`;
    }, 1500);
});

// Final Claim Button
document.getElementById('finalClaimBtn').addEventListener('click', async () => {
    // Open another Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');

    // AdsGram Placeholder (Add your AdsGram SDK code here)
    // For now, we simulate an ad watch
    tg.showAlert("Watching Ad... (Placeholder)");
    
    // Simulate ad completion
    setTimeout(async () => {
        await claimReward();
    }, 2000);
});

// Claim Reward
async function claimReward() {
    if (!user) return;
    try {
        const { doc, getDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        let currentBalance = 0;
        if (userSnap.exists()) currentBalance = userSnap.data().balance || 0;
        
        // Add accumulated reward + $0.01 bonus
        const totalReward = accumulatedReward + 0.01;
        const newBalance = currentBalance + totalReward;
        
        await saveUserBalance(newBalance);
        userBalanceSpan.textContent = `$${newBalance.toFixed(5)}`;
        
        tg.showAlert(`🎉 You earned $${totalReward.toFixed(5)}!`);
        
        // Reset Game
        resetGameState();
    } catch (error) {
        tg.showAlert("Something went wrong.");
        resetGameState();
    }
}

// Reset Game State
function resetGameState() {
    timeLeft = 10;
    isTapped = false;
    tapCount = 0;
    accumulatedReward = 0;
    
    mainContainer.classList.remove('hidden');
    processingScreen.classList.add('hidden');
    firstClaimScreen.classList.add('hidden');
    finalClaimScreen.classList.add('hidden');
    
    updateTimerDisplay();
    startCountdown();
}

// Withdraw
async function withdraw() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc, addDoc, collection } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return tg.showAlert("No balance found.");
        
        const balance = userSnap.data().balance || 0;
        if (balance < 1.00) return tg.showAlert("Minimum withdraw is $1.00");
        
        // Check daily withdraw limit (Implement logic)
        // For now, just send request
        
        await addDoc(collection(window.db, "withdrawals"), {
            userId: user.id.toString(),
            firstName: user.first_name || "User",
            amount: balance,
            status: "pending",
            requestedAt: new Date().toISOString()
        });

        const BOT_TOKEN = "8982916798:AAFl1DhvrjpV_RhYmb9B-1dVfL8lDqkk93A"; 
        const CHAT_ID = "-1004291919386";
        const message = `🔔 New Withdraw Request\n👤 User: ${user.first_name} (${user.id})\n💰 Amount: $${balance.toFixed(5)}`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
        });

        tg.showAlert("Withdraw request sent!");
    } catch (error) { tg.showAlert("Error."); }
}

// History
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

window.showHistory = showHistory;
window.closeHistory = closeHistory;
window.withdraw = withdraw;

// Initialize
window.onload = () => {
    startCountdown();
};
