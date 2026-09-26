// Telegram WebApp Initialization
const tg = window.Telegram.WebApp;
tg.expand(); // အပြည့်အဝ ဖွင့်ပါ
tg.ready(); // အသင့်ဖြစ်ကြောင်း Telegram ဆီ အသိပေးပါ

// User Info ကို Telegram ကနေ ရယူပါ
const user = tg.initDataUnsafe?.user;
if (user) {
    document.getElementById('userName').textContent = user.first_name || 'User';
    // သင့် Database ကနေ Balance ကို ဆွဲထုတ်ဖို့ လိုပါတယ် (ဥပမာ - API Call)
    // လောလောဆယ် Demo အတွက် $0.00 လို့ ပြထားပါတယ်
    document.getElementById('userBalance').textContent = '$0.00';
}

// Variables
let timeLeft = 10;
let isTapped = false;
let timerInterval;
let currentReward = 0.01; // 1 Cent

// DOM Elements
const coinBtn = document.getElementById('coinBtn');
const secondsSpan = document.getElementById('secondsLeft');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const successScreen = document.getElementById('successScreen');
const mainContainer = document.getElementById('mainContainer');
const rewardAmountSpan = document.getElementById('rewardAmount');
const watchAdBtn = document.getElementById('watchAdBtn');

// Start Countdown
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
    let percentage = (timeLeft / 10) * 100;
    progressBar.style.width = `${percentage}%`;
}

function resetGame() {
    if (!isTapped) {
        timeLeft = 10;
        updateTimerDisplay();
        startCountdown();
        tg.showAlert("Time's up! Try again.");
    }
}

// Coin Tap Event
coinBtn.addEventListener('click', () => {
    if (isTapped) return;
    isTapped = true;
    clearInterval(timerInterval);

    // Success Screen ကို ပြပါ
    mainContainer.classList.add('hidden');
    successScreen.classList.remove('hidden');
    rewardAmountSpan.textContent = `$${currentReward.toFixed(2)}`;
});

// Watch Ad & Claim Button
watchAdBtn.addEventListener('click', async () => {
    try {
        // AdsGram SDK ကို သုံးပြီး ကြော်ငြာ ပြပါ
        // (သင့် Network အလိုက် Code အနည်းငယ် ပြောင်းရပါမယ်)
        
        // ဥပမာ - AdsGram အတွက်
        const AdController = window.Adsgram?.init({ 
            blockId: "YOUR_AD_BLOCK_ID", // သင့် AdsGram ID ကို ဒီမှာ ထည့်ပါ
            debug: true 
        });

        if (AdController) {
            const result = await AdController.show();
            if (result.done) {
                // ကြော်ငြာ ကြည့်ပြီးပါပြီ
                await claimReward();
            } else {
                tg.showAlert("Ad was skipped. Please watch the full ad.");
            }
        } else {
            // Ads SDK မရှိရင် Demo အနေနဲ့ Claim လုပ်ခွင့်ပြုပါ
            await claimReward();
        }

    } catch (error) {
        console.error("Ad error:", error);
        tg.showAlert("Ad failed to load. Please try again.");
    }
});

// Reward Claim Function (Backend API ကို လှမ်းခေါ်ရမယ်)
async function claimReward() {
    // Database ထဲမှာ User ရဲ့ Balance ကို တိုးဖို့ API ကို လှမ်းခေါ်ပါ
    // ဥပမာ - await fetch('/api/claim', { method: 'POST', body: JSON.stringify({ userId: user.id, amount: currentReward }) });
    
    // လောလောဆယ် Demo အတွက် UI ကို Update လုပ်ပါ
    tg.showAlert(`🎉 You earned $${currentReward.toFixed(2)}!`);
    
    // နောက်တစ်ခါ ပြန်စဖို့ Reset လုပ်ပါ
    location.reload(); 
}

// Withdraw Function
function withdraw() {
    // Database ထဲမှာ Withdraw Request ထည့်ဖို့ API ကို လှမ်းခေါ်ပါ
    // ဥပမာ - fetch('/api/withdraw', { method: 'POST', body: JSON.stringify({ userId: user.id, amount: 1.00 }) });
    
    tg.showAlert("Withdraw request sent! (Demo)");
}

// Show History Function
async function showHistory() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    
    // Database ကနေ History ကို ဆွဲထုတ်ပါ
    // ဥပမာ - const res = await fetch(`/api/history?userId=${user.id}`);
    
    // Demo Data
    list.innerHTML = `
        <li>🟢 $0.50 - Success <br><small>2024-05-20 10:30 AM</small></li>
        <li>🟡 $1.00 - Pending <br><small>2024-05-21 02:15 PM</small></li>
    `;
    
    modal.classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('historyModal').classList.add('hidden');
}

// Initialize
window.onload = () => {
    startCountdown();
};
