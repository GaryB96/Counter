// Configuration
const GROUP_PASSWORD = 'rivertrout'; // Change this to your desired password

// State Management
let currentUser = null;
let challenges = [];
let currentMonth = new Date();
let leaderboardData = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkForUpdates();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        loadUserData();
        showScreen('appScreen');
    } else {
        showScreen('loginScreen');
    }
}

function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Month Navigation
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    if (prevMonth && nextMonth) {
        prevMonth.addEventListener('click', () => navigateMonth(-1));
        nextMonth.addEventListener('click', () => navigateMonth(1));
    }
    
    // Share/Import Data
    const shareBtn = document.getElementById('shareDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareData);
    if (importBtn) importBtn.addEventListener('click', importData);
    
    // Add Challenge Button
    const addChallengeBtn = document.getElementById('addChallengeBtn');
    if (addChallengeBtn) {
        addChallengeBtn.addEventListener('click', () => {
            document.getElementById('addChallengeModal').classList.add('active');
        });
    }
    
    // Add Challenge Form
    const addChallengeForm = document.getElementById('addChallengeForm');
    if (addChallengeForm) {
        addChallengeForm.addEventListener('submit', handleAddChallenge);
    }
    
    // Close Modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('addChallengeModal').classList.remove('active');
            document.getElementById('addChallengeForm').reset();
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('addChallengeModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'addChallengeModal') {
                document.getElementById('addChallengeModal').classList.remove('active');
                document.getElementById('addChallengeForm').reset();
            }
        });
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    if (password !== GROUP_PASSWORD) {
        errorElement.textContent = 'Invalid password. Please try again.';
        return;
    }
    
    if (username.length < 2) {
        errorElement.textContent = 'Please enter a valid name.';
        return;
    }
    
    // Login successful
    currentUser = username;
    localStorage.setItem('currentUser', username);
    loadUserData();
    showScreen('appScreen');
    
    // Clear form
    document.getElementById('loginForm').reset();
    errorElement.textContent = '';
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showScreen('loginScreen');
    }
}

function handleAddChallenge(e) {
    e.preventDefault();
    
    const name = document.getElementById('challengeName').value.trim();
    const goal = parseInt(document.getElementById('challengeGoal').value) || null;
    
    const challenge = {
        id: Date.now(),
        name: name,
        count: 0,
        goal: goal,
        history: []
    };
    
    challenges.push(challenge);
    saveUserData();
    renderChallenges();
    
    // Close modal and reset form
    document.getElementById('addChallengeModal').classList.remove('active');
    document.getElementById('addChallengeForm').reset();
}

function loadUserData() {
    // Always start with current month
    currentMonth = new Date();
    const monthKey = getMonthKey(currentMonth);
    const savedData = localStorage.getItem(`challenges_${currentUser}_${monthKey}`);
    
    if (savedData) {
        challenges = JSON.parse(savedData);
    } else {
        challenges = [];
    }
    
    // Load leaderboard data
    loadLeaderboardData();
    
    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser}!`;
    updateMonthDisplay();
    renderChallenges();
    renderStats();
    renderLeaderboard();
}

function saveUserData() {
    const monthKey = getMonthKey(currentMonth);
    localStorage.setItem(`challenges_${currentUser}_${monthKey}`, JSON.stringify(challenges));
    renderStats();
    updateLeaderboardScore();
}

function renderChallenges() {
    const container = document.getElementById('challengesList');
    
    if (challenges.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No challenges yet. Add one to get started!</p>';
        return;
    }
    
    container.innerHTML = challenges.map(challenge => `
        <div class="challenge-card">
            <div class="challenge-header">
                <span class="challenge-name">${escapeHtml(challenge.name)}</span>
                <button class="delete-challenge" onclick="deleteChallenge(${challenge.id})">×</button>
            </div>
            
            <div class="challenge-count">
                <div class="count-display">${challenge.count}</div>
                ${challenge.goal ? `<div class="goal-display">Goal: ${challenge.goal}</div>` : ''}
            </div>
            
            <div class="challenge-controls">
                <button class="btn-counter btn-minus" onclick="updateCount(${challenge.id}, -1)">-</button>
                <button class="btn-counter btn-plus" onclick="updateCount(${challenge.id}, 1)">+</button>
                <button class="btn-counter btn-reset" onclick="resetChallenge(${challenge.id})">Reset</button>
            </div>
        </div>
    `).join('');
}

function renderStats() {
    const statsContainer = document.getElementById('statsDisplay');
    
    if (challenges.length === 0) {
        statsContainer.innerHTML = '<p style="text-align: center; color: #999;">No stats yet.</p>';
        return;
    }
    
    const totalCount = challenges.reduce((sum, c) => sum + c.count, 0);
    const activeChallenges = challenges.length;
    const completedGoals = challenges.filter(c => c.goal && c.count >= c.goal).length;
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${totalCount}</div>
                <div class="stat-label">Total Reps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${activeChallenges}</div>
                <div class="stat-label">Active Challenges</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${completedGoals}</div>
                <div class="stat-label">Goals Reached</div>
            </div>
        </div>
    `;
}

function updateCount(id, delta) {
    const challenge = challenges.find(c => c.id === id);
    if (challenge) {
        challenge.count = Math.max(0, challenge.count + delta);
        challenge.history.push({
            timestamp: Date.now(),
            count: challenge.count,
            delta: delta
        });
        saveUserData();
        renderChallenges();
    }
}

function resetChallenge(id) {
    if (confirm('Are you sure you want to reset this challenge counter?')) {
        const challenge = challenges.find(c => c.id === id);
        if (challenge) {
            challenge.count = 0;
            challenge.history.push({
                timestamp: Date.now(),
                count: 0,
                delta: 'reset'
            });
            saveUserData();
            renderChallenges();
        }
    }
}

function deleteChallenge(id) {
    if (confirm('Are you sure you want to delete this challenge?')) {
        challenges = challenges.filter(c => c.id !== id);
        saveUserData();
        renderChallenges();
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// PWA Installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

function showInstallPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'install-prompt show';
    prompt.innerHTML = `
        <span>📱 Install this app for quick access!</span>
        <button id="installBtn">Install</button>
        <button id="dismissBtn" style="background: transparent; color: #666;">Dismiss</button>
    `;
    
    const container = document.querySelector('.container');
    if (container && !document.querySelector('.install-prompt')) {
        container.insertBefore(prompt, container.firstChild);
        
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                prompt.remove();
            }
        });
        
        document.getElementById('dismissBtn').addEventListener('click', () => {
            prompt.remove();
        });
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Check for updates
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }
}

// Month Management
function getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function updateMonthDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthDisplay = document.getElementById('currentMonth');
    const dateDisplay = document.getElementById('currentDate');
    const today = new Date();
    
    const monthText = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    monthDisplay.textContent = monthText;
    
    // Show today's date if viewing current month
    if (getMonthKey(currentMonth) === getMonthKey(today)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dateDisplay.textContent = `Today is ${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;
    } else {
        dateDisplay.textContent = 'Historical data';
    }
    
    // Disable next month button if future month
    const nextBtn = document.getElementById('nextMonth');
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextBtn.disabled = getMonthKey(nextMonth) > getMonthKey(today);
}

function navigateMonth(direction) {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    
    // Don't allow future months
    const today = new Date();
    if (getMonthKey(newMonth) > getMonthKey(today)) {
        return;
    }
    
    currentMonth = newMonth;
    const monthKey = getMonthKey(currentMonth);
    const savedData = localStorage.getItem(`challenges_${currentUser}_${monthKey}`);
    
    if (savedData) {
        challenges = JSON.parse(savedData);
    } else {
        challenges = [];
    }
    
    updateMonthDisplay();
    renderChallenges();
    renderStats();
}

// Leaderboard Management
function loadLeaderboardData() {
    const savedLeaderboard = localStorage.getItem('leaderboard_data');
    if (savedLeaderboard) {
        leaderboardData = JSON.parse(savedLeaderboard);
    } else {
        leaderboardData = [];
    }
    
    // Ensure current user is in leaderboard
    updateLeaderboardScore();
}

function updateLeaderboardScore() {
    const monthKey = getMonthKey(currentMonth);
    const totalScore = challenges.reduce((sum, c) => sum + c.count, 0);
    
    // Find or create user entry
    let userEntry = leaderboardData.find(entry => 
        entry.username === currentUser && entry.month === monthKey
    );
    
    if (userEntry) {
        userEntry.score = totalScore;
        userEntry.challenges = challenges.length;
        userEntry.lastUpdate = Date.now();
    } else {
        leaderboardData.push({
            username: currentUser,
            score: totalScore,
            challenges: challenges.length,
            month: monthKey,
            lastUpdate: Date.now()
        });
    }
    
    localStorage.setItem('leaderboard_data', JSON.stringify(leaderboardData));
    renderLeaderboard();
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboardList');
    const monthKey = getMonthKey(currentMonth);
    
    // Filter for current month and sort by score
    const monthData = leaderboardData
        .filter(entry => entry.month === monthKey)
        .sort((a, b) => b.score - a.score);
    
    if (monthData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No data yet. Start tracking to appear on the leaderboard!</p>';
        return;
    }
    
    container.innerHTML = monthData.map((entry, index) => {
        const rank = index + 1;
        const isCurrentUser = entry.username === currentUser;
        const rankClass = `rank-${rank}`;
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="leaderboard-rank ${rank <= 3 ? rankClass : ''}">${rank}</div>
                <div class="leaderboard-name">${escapeHtml(entry.username)}${isCurrentUser ? ' (You)' : ''}</div>
                <div class="leaderboard-score">${entry.score}</div>
            </div>
        `;
    }).join('');
}

// Data Sharing Functions
function shareData() {
    const monthKey = getMonthKey(currentMonth);
    const exportData = {
        username: currentUser,
        month: monthKey,
        score: challenges.reduce((sum, c) => sum + c.count, 0),
        challenges: challenges.length,
        lastUpdate: Date.now()
    };
    
    const dataString = JSON.stringify(exportData);
    const base64Data = btoa(dataString);
    
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(base64Data).then(() => {
            alert(`✅ Your progress has been copied to clipboard!\n\nShare this code with your friends so they can add you to their leaderboard:\n\n${base64Data.substring(0, 50)}...`);
        }).catch(() => {
            // Fallback
            showShareDialog(base64Data);
        });
    } else {
        showShareDialog(base64Data);
    }
}

function showShareDialog(data) {
    const textarea = document.createElement('textarea');
    textarea.value = data;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert(`✅ Your progress has been copied to clipboard!\n\nShare this code with your friends.`);
    } catch (err) {
        prompt('Copy this code and share with friends:', data);
    }
    
    document.body.removeChild(textarea);
}

function importData() {
    const code = prompt('Paste your friend\'s progress code:');
    
    if (!code) return;
    
    try {
        const dataString = atob(code.trim());
        const importedData = JSON.parse(dataString);
        
        // Validate data
        if (!importedData.username || !importedData.month || typeof importedData.score !== 'number') {
            throw new Error('Invalid data format');
        }
        
        // Check if already exists
        const existingIndex = leaderboardData.findIndex(entry => 
            entry.username === importedData.username && entry.month === importedData.month
        );
        
        if (existingIndex >= 0) {
            // Update existing entry
            leaderboardData[existingIndex] = importedData;
            alert(`✅ Updated ${importedData.username}'s progress!`);
        } else {
            // Add new entry
            leaderboardData.push(importedData);
            alert(`✅ Added ${importedData.username} to the leaderboard!`);
        }
        
        localStorage.setItem('leaderboard_data', JSON.stringify(leaderboardData));
        renderLeaderboard();
        
    } catch (err) {
        alert('❌ Invalid code. Please make sure you copied the entire code correctly.');
    }
}

