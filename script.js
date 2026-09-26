const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;

let timeLeft = 10;
let isTapped = false;
let timerInterval;
let currentReward = 0.01;
let processingTimer;

const coinBtn = document.getElementById('coinBtn');
const secondsSpan = document.getElementById('secondsLeft');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const processingScreen = document.getElementById('processingScreen');
const successScreen = document.getElementById('successScreen');
const mainContainer = document.getElementById('mainContainer');
const rewardAmountSpan = document.getElementById('rewardAmount');
const watchAdBtn = document.getElementById('watchAdBtn');
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

coinBtn.addEventListener('click', () => {
    if (isTapped) return;
    isTapped = true;
    clearInterval(timerInterval);
    
    // Show Processing Screen
    mainContainer.classList.add('hidden');
    processingScreen.classList.remove('hidden');
    
    let processTime = 10;
    processingTimerSpan.textContent = processTime;
    
    processingTimer = setInterval(() => {
        processTime--;
        processingTimerSpan.textContent = processTime;
        if (processTime <= 0) {
            clearInterval(processingTimer);
            showClaimScreen();
        }
    }, 1000);
});

function showClaimScreen() {
    processingScreen.classList.add('hidden');
    successScreen.classList.remove('hidden');
    rewardAmountSpan.textContent = `$${currentReward.toFixed(2)}`;
}

watchAdBtn.addEventListener('click', async () => {
    // Open a random Smart Link
    const randomLink = SMART_LINKS[Math.floor(Math.random() * SMART_LINKS.length)];
    window.open(randomLink, '_blank');
    
    // Wait a bit then claim
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
        
        const newBalance = currentBalance + currentReward;
        await saveUserBalance(newBalance);
        userBalanceSpan.textContent = `$${newBalance.toFixed(2)}`;
        
        tg.showAlert(`🎉 You earned $${currentReward.toFixed(2)}!`);
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        tg.showAlert("Something went wrong.");
    }
}

async function withdraw() {
    if (!user || !window.db) return;
    try {
        const { doc, getDoc, addDoc, collection } = await getFirestoreModules();
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

window.onload = () => { startCountdown(); };
