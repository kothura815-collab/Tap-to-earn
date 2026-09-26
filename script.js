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

// AdsGram Block ID
const ADSGRAM_BLOCK_ID = "50163"; 

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
const tapCountDisplay = document.getElementById('tapCountDisplay');

// Load User
if (user) {
    userNameSpan.textContent = user.first_name || 'User';
    loadUserBalance();
}

// Firebase Functions
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
            // Time 0 ဖြစ်မှ Processing ကို သွားမယ်
            if (tapCount > 0) {
                showProcessingScreen();
            } else {
                // Tap မရှိရင် ပြန် Reset
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
    // Tap တစ်ချက်နှိပ်တိုင်း 0.00001 တိုးမယ်
    accumulatedReward += 0.00001;
    
    tapCountDisplay.textContent = tapCount;
    
    // Visual Feedback
    coinBtn.style.transform = 'scale(0.9)';
    setTimeout(() => coinBtn.style.transform = 'scale(1)', 100);

    // Tap 10 ချက်ပြည့်ရင် Timer ကို 0 ဖြစ်အောင် လုပ်မယ် (ဒါပေမယ့် Timer က အလိုအလျောက် 0 ဖြစ်တဲ့အထိ စောင့်မယ်)
    if (tapCount >= 10) {
        // ဒီနေရာမှာ Timer ကို ချက်ချင်း 0 မလုပ်ဘူး။ 
        // Timer က 0 ဖြစ်တဲ့အထိ စောင့်ပြီးမှ Processing ကို သွားမယ်။
        // ဒါပေမယ့် Tap 10 ချက်ပြည့်ရင် ထပ်နှိပ်လို့ မရအောင် isTapped ကို true လုပ်ထားမယ်။
        isTapped = true;
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
    
    // First Step Reward: 0.00003 to 0.00005
    const firstReward = (Math.random() * (0.00005 - 0.00003) + 0.00003);
    accumulatedReward += firstReward;
    firstRewardAmount.textContent = `$${firstReward.toFixed(5)}`;
}

// First Claim Button
document.getElementById('firstClaimBtn').addEventListener('click', () => {
    // Open Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');
    
    // 5s စောင့်ပြီး Final Step ကို သွားမယ်
    setTimeout(() => {
        firstClaimScreen.classList.add('hidden');
        finalClaimScreen.classList.remove('hidden');
        
        // Final Step Reward: 0.00003 to 0.00005
        const finalReward = (Math.random() * (0.00005 - 0.00003) + 0.00003);
        accumulatedReward += finalReward;
        finalRewardAmount.textContent = `$${finalReward.toFixed(5)}`;
    }, 5000);
});

// Final Claim Button (AdsGram Integration)
document.getElementById('finalClaimBtn').addEventListener('click', async () => {
    // Open Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');

    // AdsGram
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
                tg.showAlert("Ad was skipped. Please watch the full ad.");
            }
        } else {
            await claimReward();
        }
    } catch (error) {
        console.error("Ad error:", error);
        // AdsGram Error တက်ရင်တောင် Reward ကို ပေးမယ် (Demo)
        tg.showAlert("Ad error. Claiming directly (Demo).");
        await claimReward();
    }
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
        
        // Total Reward = Tap Reward + First Step + Final Step
        const totalReward = accumulatedReward;
        const newBalance = currentBalance + totalReward;
        
        await saveUserBalance(newBalance);
        userBalanceSpan.textContent = `$${newBalance.toFixed(5)}`;
        
        tg.showAlert(`🎉 You earned $${totalReward.toFixed(5)}!`);
        
        // ပြန် Reset လုပ်ပြီး Tap နေရာကနေ ပြန်စမယ်
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
    tapCountDisplay.textContent = "0";
    
    mainContainer.classList.remove('hidden');
    processingScreen.classList.add('hidden');
    firstClaimScreen.classList.add('hidden');
    finalClaimScreen.classList.add('hidden');
    
    updateTimerDisplay();
    startCountdown();
}

// Withdraw (Balance လျော့အောင် ပြင်ထားတယ်)
async function withdraw() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc, addDoc, collection, updateDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return tg.showAlert("No balance found.");
        
        const balance = userSnap.data().balance || 0;
        if (balance < 1.00) return tg.showAlert("Minimum withdraw is $1.00");
        
        // Withdraw Request
        await addDoc(collection(window.db, "withdrawals"), {
            userId: user.id.toString(),
            firstName: user.first_name || "User",
            amount: balance,
            status: "pending",
            requestedAt: new Date().toISOString()
        });

        // Balance ကို သုည လုပ်ပါ
        await updateDoc(userRef, {
            balance: 0,
            lastWithdraw: new Date().toISOString()
        });
        
        userBalanceSpan.textContent = "$0.00000";

        // Telegram Channel
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
        console.error(error);
        tg.showAlert("Error."); 
    }
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
