const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;

let timeLeft = 10;
let tapCount = 0;
let isTapped = false;
let timerInterval;
let processingInterval;
let currentReward = 0;
let totalEarned = 0;

const coinBtn = document.getElementById('coinBtn');
const tapCountSpan = document.getElementById('tapCount');
const secondsSpan = document.getElementById('secondsLeft');
const progressBar = document.getElementById('progressBar');
const mainContainer = document.getElementById('mainContainer');
const processingScreen = document.getElementById('processingScreen');
const claimScreen1 = document.getElementById('claimScreen1');
const claimScreen2 = document.getElementById('claimScreen2');
const rewardAmount1Span = document.getElementById('rewardAmount1');
const userNameSpan = document.getElementById('userName');
const userBalanceSpan = document.getElementById('userBalance');
const processingTimerSpan = document.getElementById('processingTimer');

// Adsterra Smart Links (Put your links here)
const SMART_LINKS = [
    "https://asiafilm.org/4/e86eb6e961ace79e8f0afaa11d643848",
    "https://asiafilm.org/4/39fe0c373bd3ed585a41b288e8162a7d",
    "https://araplhn.org/4/a72845c18c5165595bcb555e1431938d"
];

if (user) {
    userNameSpan.textContent = user.first_name || 'User';
    loadUserBalance();
}

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
            userBalanceSpan.textContent = `$${userSnap.data().balance.toFixed(2)}`;
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

// ================= TAP LOGIC =================
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        secondsSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!isTapped) {
                goToProcessing();
            }
        }
    }, 1000);
}

coinBtn.addEventListener('click', () => {
    if (isTapped) return;
    
    // Random reward between 0.00001 and 0.00005
    const randomReward = Math.random() * (0.00005 - 0.00001) + 0.00001;
    totalEarned += randomReward;
    tapCount++;
    
    tapCountSpan.textContent = tapCount;
    progressBar.style.width = `${(tapCount / 10) * 100}%`;

    if (tapCount >= 10) {
        isTapped = true;
        clearInterval(timerInterval);
        goToProcessing();
    }
});

function goToProcessing() {
    isTapped = true;
    clearInterval(timerInterval);
    mainContainer.classList.add('hidden');
    processingScreen.classList.remove('hidden');
    
    let processTime = 10;
    processingTimerSpan.textContent = processTime;
    
    processingInterval = setInterval(() => {
        processTime--;
        processingTimerSpan.textContent = processTime;
        if (processTime <= 0) {
            clearInterval(processingInterval);
            showClaimScreen1();
        }
    }, 1000);
}

// ================= CLAIM 1 =================
function showClaimScreen1() {
    processingScreen.classList.add('hidden');
    claimScreen1.classList.remove('hidden');
    currentReward = totalEarned;
    rewardAmount1Span.textContent = `$${currentReward.toFixed(5)}`;
}

document.getElementById('claimBtn1').addEventListener('click', () => {
    // Open a random Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');
    
    // Move to Final Claim Screen after returning
    setTimeout(() => {
        claimScreen1.classList.add('hidden');
        claimScreen2.classList.remove('hidden');
    }, 2000);
});

// ================= FINAL CLAIM =================
document.getElementById('claimBtn2').addEventListener('click', async () => {
    // Open another Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');

    // Placeholder for AdsGram Ad
    tg.showAlert("AdsGram Ad Placeholder: Watch Ad to Claim.");

    // After ad, claim reward
    setTimeout(async () => {
        await claimReward();
    }, 2000);
});

async function claimReward() {
    if (!user) {
        tg.showAlert("User not found.");
        return;
    }
    try {
        const { doc, getDoc } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        let currentBalance = 0;
        if (userSnap.exists()) currentBalance = userSnap.data().balance || 0;
        
        const newBalance = currentBalance + 0.01; // Fixed $0.01 reward
        await saveUserBalance(newBalance);
        userBalanceSpan.textContent = `$${newBalance.toFixed(2)}`;
        
        tg.showAlert(`🎉 You earned $0.01!`);
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        tg.showAlert("Something went wrong.");
    }
}

// ================= WITHDRAW & HISTORY =================
async function withdraw() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc, addDoc, collection, query, where, getDocs } = await getFirestoreModules();
        const userRef = doc(window.db, "users", user.id.toString());
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return tg.showAlert("No balance found.");
        
        const balance = userSnap.data().balance || 0;
        if (balance < 1.00) return tg.showAlert("Minimum withdraw is $1.00");

        // Check Withdraw Limit (1 per day)
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(window.db, "withdrawals"), where("userId", "==", user.id.toString()), where("date", "==", today));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return tg.showAlert("You can only withdraw once per day.");
        }

        // Save Withdraw Request
        await addDoc(collection(window.db, "withdrawals"), {
            userId: user.id.toString(),
            firstName: user.first_name || "User",
            amount: balance,
            status: "pending",
            date: today,
            requestedAt: new Date().toISOString()
        });

        // Telegram Channel Notification
        const BOT_TOKEN = "8982916798:AAFl1DhvrjpV_RhYmb9B-1dVfL8lDqkk93A"; 
        const CHAT_ID = "-1004291919386";
        const message = `🔔 New Withdraw Request\n👤 User: ${user.first_name} (${user.id})\n💰 Amount: $${balance.toFixed(2)}`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
        });

        tg.showAlert("Withdraw request sent!");
    } catch (error) { tg.showAlert("Error."); }
}

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
            html += `<li>${data.status === 'pending' ? '🟡' : '🟢'} $${data.amount.toFixed(2)}<br><small>${new Date(data.requestedAt).toLocaleString()}</small></li>`;
        });
        list.innerHTML = html;
    } catch (error) { list.innerHTML = `<li>Error.</li>`; }
}

function closeHistory() { document.getElementById('historyModal').classList.add('hidden'); }

window.showHistory = showHistory;
window.closeHistory = closeHistory;
window.withdraw = withdraw;

window.onload = () => { startTimer(); };
