// Configuration
const GROUP_PASSWORD = 'rivertrout'; // Change this to your desired password

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDePHmcbw9obkbpTJ-7dORRLn23MGZzAU4",
  authDomain: "workout-tracker-f37a4.firebaseapp.com",
  databaseURL: "https://workout-tracker-f37a4-default-rtdb.firebaseio.com",
  projectId: "workout-tracker-f37a4",
  storageBucket: "workout-tracker-f37a4.firebasestorage.app",
  messagingSenderId: "485150234268",
  appId: "1:485150234268:web:1f9569d19cd80c3d0c7f59",
  measurementId: "G-FMPWXTG8C0"
};

// Initialize Firebase (using compat SDK loaded in HTML)
let database = null;
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase initialized successfully');
} else {
    console.warn('Firebase SDK not loaded. Leaderboard will only show local data.');
}

// State Management
let currentUser = null;
let challenges = [];
let currentMonth = new Date();
let leaderboardData = [];
let dailyWorkouts = {}; // Store daily workout data: { 'YYYY-MM-DD': { biceps: 0, triceps: 0 } }
let selectedDate = null; // Currently selected date for modal

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeWorkoutApp();
    setupEventListeners();
    checkForUpdates();
});

function initializeWorkoutApp() {
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
    
    // Change Name Button
    const changeNameBtn = document.getElementById('changeNameBtn');
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', handleChangeName);
    }
    
    // Month Navigation
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    if (prevMonth && nextMonth) {
        prevMonth.addEventListener('click', () => navigateMonth(-1));
        nextMonth.addEventListener('click', () => navigateMonth(1));
    }
    
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
    
    // Workout Modal handlers
    const closeWorkoutModal = document.querySelector('.close-workout-modal');
    if (closeWorkoutModal) {
        closeWorkoutModal.addEventListener('click', closeWorkoutModalHandler);
    }
    
    const workoutModal = document.getElementById('workoutModal');
    if (workoutModal) {
        workoutModal.addEventListener('click', (e) => {
            if (e.target.id === 'workoutModal') {
                closeWorkoutModalHandler();
            }
        });
    }
    
    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm) {
        workoutForm.addEventListener('submit', saveWorkout);
    }
    
    const deleteWorkoutBtn = document.getElementById('deleteWorkout');
    if (deleteWorkoutBtn) {
        deleteWorkoutBtn.addEventListener('click', deleteWorkout);
    }
    
    // Update total reps display when inputs change
    const bicepsInput = document.getElementById('bicepsReps');
    const tricepsInput = document.getElementById('tricepsReps');
    if (bicepsInput && tricepsInput) {
        bicepsInput.addEventListener('input', updateTotalReps);
        tricepsInput.addEventListener('input', updateTotalReps);
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
    
    // Track this user in the all users list
    let allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
    if (!allUsers.includes(username)) {
        allUsers.push(username);
        localStorage.setItem('all_users', JSON.stringify(allUsers));
    }
    
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

function handleChangeName() {
    const newName = prompt('Enter your new name:', currentUser);
    
    if (!newName || newName.trim().length < 2) {
        if (newName !== null) {
            alert('Please enter a valid name (at least 2 characters).');
        }
        return;
    }
    
    const trimmedName = newName.trim();
    
    if (trimmedName === currentUser) {
        return; // No change
    }
    
    // Get all month keys for current user
    const oldUser = currentUser;
    const allKeys = Object.keys(localStorage);
    const userDataKeys = allKeys.filter(key => key.startsWith(`challenges_${oldUser}_`));
    
    // Copy all monthly data to new username
    userDataKeys.forEach(key => {
        const monthKey = key.replace(`challenges_${oldUser}_`, '');
        const data = localStorage.getItem(key);
        localStorage.setItem(`challenges_${trimmedName}_${monthKey}`, data);
        localStorage.removeItem(key);
    });
    
    // Update all users list
    let allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
    const oldUserIndex = allUsers.indexOf(oldUser);
    if (oldUserIndex >= 0) {
        allUsers[oldUserIndex] = trimmedName;
        localStorage.setItem('all_users', JSON.stringify(allUsers));
    }
    
    // Update current user
    currentUser = trimmedName;
    localStorage.setItem('currentUser', trimmedName);
    
    // Update display
    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser}!`;
    renderLeaderboard();
    
    alert(`✅ Name changed to ${trimmedName}!`);
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
    const savedData = localStorage.getItem(`workouts_${currentUser}_${monthKey}`);
    
    if (savedData) {
        dailyWorkouts = JSON.parse(savedData);
    } else {
        dailyWorkouts = {};
    }
    
    // Load leaderboard data
    loadLeaderboardData();
    
    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser}!`;
    updateMonthDisplay();
    renderStats();
    renderLeaderboard();
}

function saveUserData() {
    const monthKey = getMonthKey(currentMonth);
    localStorage.setItem(`workouts_${currentUser}_${monthKey}`, JSON.stringify(dailyWorkouts));
    renderStats();
    
    // Sync to Firebase
    if (database) {
        const totalScore = calculateMonthlyTotal();
        const bicepsTotal = Object.values(dailyWorkouts).reduce((sum, day) => sum + (day.biceps || 0), 0);
        const tricepsTotal = Object.values(dailyWorkouts).reduce((sum, day) => sum + (day.triceps || 0), 0);
        
        const userScoreData = {
            username: currentUser,
            score: totalScore,
            biceps: bicepsTotal,
            triceps: tricepsTotal,
            workoutDays: Object.keys(dailyWorkouts).length,
            month: monthKey,
            lastUpdate: Date.now()
        };
        
        database.ref(`leaderboard/${monthKey}/${sanitizeKey(currentUser)}`).set(userScoreData)
            .catch(err => console.error('Firebase sync error:', err));
    }
    
    updateLeaderboardScore();
}

function calculateMonthlyTotal() {
    let total = 0;
    Object.values(dailyWorkouts).forEach(day => {
        total += (day.biceps || 0) + (day.triceps || 0);
    });
    return total;
}

function renderChallenges() {
    const container = document.getElementById('challengesList');
    
    // Element was removed from UI, skip rendering
    if (!container) {
        return;
    }
    
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
    
    if (!statsContainer) return;
    
    const totalReps = calculateMonthlyTotal();
    const workoutDays = Object.keys(dailyWorkouts).length;
    const bicepsTotal = Object.values(dailyWorkouts).reduce((sum, day) => sum + (day.biceps || 0), 0);
    const tricepsTotal = Object.values(dailyWorkouts).reduce((sum, day) => sum + (day.triceps || 0), 0);
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${totalReps}</div>
                <div class="stat-label">Total Reps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${workoutDays}</div>
                <div class="stat-label">Workout Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${bicepsTotal}</div>
                <div class="stat-label">Biceps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${tricepsTotal}</div>
                <div class="stat-label">Triceps</div>
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

function sanitizeKey(str) {
    // Firebase keys cannot contain . $ # [ ] /
    return str.replace(/[.\$#\[\]\/]/g, '_');
}

// Workout Modal Functions
function openWorkoutModal(dateStr) {
    selectedDate = dateStr;
    const modal = document.getElementById('workoutModal');
    const title = document.getElementById('workoutModalTitle');
    const bicepsInput = document.getElementById('bicepsReps');
    const tricepsInput = document.getElementById('tricepsReps');
    const deleteBtn = document.getElementById('deleteWorkout');
    
    // Format date for display
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    title.textContent = date.toLocaleDateString('en-US', options);
    
    // Load existing data
    const workout = dailyWorkouts[dateStr] || { biceps: 0, triceps: 0 };
    bicepsInput.value = workout.biceps || 0;
    tricepsInput.value = workout.triceps || 0;
    
    // Show/hide delete button
    const hasData = workout.biceps > 0 || workout.triceps > 0;
    deleteBtn.style.display = hasData ? 'block' : 'none';
    
    updateTotalReps();
    modal.classList.add('active');
}

function closeWorkoutModalHandler() {
    const modal = document.getElementById('workoutModal');
    modal.classList.remove('active');
    selectedDate = null;
}

function updateTotalReps() {
    const biceps = parseInt(document.getElementById('bicepsReps').value) || 0;
    const triceps = parseInt(document.getElementById('tricepsReps').value) || 0;
    document.getElementById('totalReps').textContent = biceps + triceps;
}

function saveWorkout(e) {
    e.preventDefault();
    
    if (!selectedDate) return;
    
    const biceps = parseInt(document.getElementById('bicepsReps').value) || 0;
    const triceps = parseInt(document.getElementById('tricepsReps').value) || 0;
    
    // Save workout data
    if (biceps > 0 || triceps > 0) {
        dailyWorkouts[selectedDate] = { biceps, triceps };
    } else {
        delete dailyWorkouts[selectedDate];
    }
    
    saveUserData();
    renderCalendar();
    closeWorkoutModalHandler();
}

function deleteWorkout() {
    if (!selectedDate) return;
    
    if (confirm('Delete this workout entry?')) {
        delete dailyWorkouts[selectedDate];
        saveUserData();
        renderCalendar();
        closeWorkoutModalHandler();
    }
}

// Make openWorkoutModal globally accessible
window.openWorkoutModal = openWorkoutModal;

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
    const today = new Date();
    
    const monthText = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    monthDisplay.textContent = monthText;
    
    // Render calendar
    renderCalendar();
    
    // Render challenge description
    renderChallengeDescription();
    
    // Disable next month button if future month
    const nextBtn = document.getElementById('nextMonth');
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextBtn.disabled = getMonthKey(nextMonth) > getMonthKey(today);
}

function renderChallengeDescription() {
    const descriptionDiv = document.getElementById('challengeDescription');
    if (!descriptionDiv) return;
    
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    
    // Define challenges for each month
    const challenges = {
        0: { // January
            title: 'Bicep & Tricep Blast',
            goal: 'Complete an average of <strong>100 reps for biceps</strong> one day, then <strong>100 reps for triceps</strong> the next day.',
            rules: [
                'You can split it up: 50 bicep + 50 tricep reps in one day counts!',
                'Or go all out: 100 bicep reps one day, 100 tricep reps the next',
                'Alternate throughout the month',
                'Track your daily totals on the leaderboard'
            ]
        },
        // Add more months as needed
    };
    
    const challenge = challenges[month];
    
    if (challenge) {
        descriptionDiv.innerHTML = `
            <h4>${challenge.title}</h4>
            <p><strong>Goal:</strong> ${challenge.goal}</p>
            <ul>
                ${challenge.rules.map(rule => `<li>${rule}</li>`).join('')}
            </ul>
        `;
    } else {
        // Default message for months without defined challenges
        descriptionDiv.innerHTML = `
            <p>No specific challenge set for this month yet. Keep tracking your workouts!</p>
        `;
    }
}

function renderCalendar() {
    const calendarDiv = document.getElementById('calendar');
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    let html = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month's days (grayed out)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (year === today.getFullYear() && 
                        month === today.getMonth() && 
                        day === today.getDate());
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasData = dailyWorkouts[dateStr] && (dailyWorkouts[dateStr].biceps > 0 || dailyWorkouts[dateStr].triceps > 0);
        
        const classes = ['calendar-day'];
        if (isToday) classes.push('current-day');
        if (hasData) classes.push('has-data');
        
        html += `<div class="${classes.join(' ')}" data-date="${dateStr}" onclick="openWorkoutModal('${dateStr}')">${day}</div>`;
    }
    
    // Next month's days (to fill grid)
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    calendarDiv.innerHTML = html;
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
    const savedData = localStorage.getItem(`workouts_${currentUser}_${monthKey}`);
    
    if (savedData) {
        dailyWorkouts = JSON.parse(savedData);
    } else {
        dailyWorkouts = {};
    }
    
    updateMonthDisplay();
    renderStats();
    loadLeaderboardData();
}

// Leaderboard Management
function loadLeaderboardData() {
    const monthKey = getMonthKey(currentMonth);
    
    if (database) {
        // Load from Firebase
        database.ref(`leaderboard/${monthKey}`).once('value', (snapshot) => {
            leaderboardData = [];
            const data = snapshot.val();
            
            if (data) {
                Object.values(data).forEach(entry => {
                    leaderboardData.push(entry);
                });
            }
            
            renderLeaderboard();
        });
    } else {
        // Fallback to local only
        leaderboardData = [];
        const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
        
        allUsers.forEach(username => {
            const userDataKey = `workouts_${username}_${monthKey}`;
            const userData = localStorage.getItem(userDataKey);
            
            if (userData) {
                const userWorkouts = JSON.parse(userData);
                let totalScore = 0;
                let bicepsTotal = 0;
                let tricepsTotal = 0;
                
                Object.values(userWorkouts).forEach(day => {
                    bicepsTotal += (day.biceps || 0);
                    tricepsTotal += (day.triceps || 0);
                    totalScore += (day.biceps || 0) + (day.triceps || 0);
                });
                
                leaderboardData.push({
                    username: username,
                    score: totalScore,
                    biceps: bicepsTotal,
                    triceps: tricepsTotal,
                    workoutDays: Object.keys(userWorkouts).length,
                    month: monthKey
                });
            } else if (username === currentUser) {
                leaderboardData.push({
                    username: username,
                    score: 0,
                    biceps: 0,
                    triceps: 0,
                    workoutDays: 0,
                    month: monthKey
                });
            }
        });
        
        renderLeaderboard();
    }
}

function updateLeaderboardScore() {
    // Always reload leaderboard data after saving
    loadLeaderboardData();
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
        const biceps = entry.biceps || 0;
        const triceps = entry.triceps || 0;
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="leaderboard-rank ${rank <= 3 ? rankClass : ''}">${rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${escapeHtml(entry.username)}${isCurrentUser ? ' (You)' : ''}</div>
                    <div class="leaderboard-details">💪 ${biceps} biceps | 💪 ${triceps} triceps</div>
                </div>
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
    const code = prompt('Paste your friend\'s score code:');
    
    if (!code) return;
    
    try {
        const dataString = atob(code.trim());
        const importedEntry = JSON.parse(dataString);
        
        // Validate data
        if (!importedEntry.username || !importedEntry.month || typeof importedEntry.score !== 'number') {
            throw new Error('Invalid data format');
        }
        
        // Get existing imported data
        const importedData = JSON.parse(localStorage.getItem('imported_leaderboard') || '[]');
        
        // Check if already exists
        const existingIndex = importedData.findIndex(entry => 
            entry.username === importedEntry.username && entry.month === importedEntry.month
        );
        
        if (existingIndex >= 0) {
            // Update existing entry
            importedData[existingIndex] = importedEntry;
            alert(`✅ Updated ${importedEntry.username}'s score!`);
        } else {
            // Add new entry
            importedData.push(importedEntry);
            alert(`✅ Added ${importedEntry.username} to the leaderboard!`);
        }
        
        localStorage.setItem('imported_leaderboard', JSON.stringify(importedData));
        loadLeaderboardData();
        renderLeaderboard();
        
    } catch (err) {
        alert('❌ Invalid code. Please make sure you copied the entire code correctly.');
    }
}

