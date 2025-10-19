/*
Author: Alexis Jimenez
script.js
This class stores all of the logic for the timer.

I was able to complete this method by getting assistance from 
"ChatGPT 5.0" in order to outline the logic and help with JavaScript syntax.

I also used "Google Gemini Code Assist" in order keep time even when a phone user exits the browser and accepted a lot of line recommendations.

Also recieved some assistance from "Copilot".

I ensured I understood how each line or assistance from GPT, Copilot, Gemini Code Assist worked before implementing.
*/

let totalSeconds = 0;
let secondsLeft = 0;
let timer;
let running = false;

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000]

// Timer display functions
function updateDisplay() {
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `${mins}:${secs}`;

  // update progress bar
  if (totalSeconds > 0) {
    const percent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
    document.getElementById('progressBar').style.width = `${percent}%`;
  }
}

// LEVEL LOGIC
// get level
function getLevelFromXp(xp) {
    for (let i = LEVEL_THRESHOLDS.length -1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

// update level
function updateLevelDisplay(xp) {
    const level = getLevelFromXp(xp);
    localStorage.setItem("level", level);
    document.getElementById('levelDisplay').textContent = `🧩 Level: ${level}`;
    return level;
}

// see if level up can be made
function checkLevelUp(oldXp, newXp) {
    const oldLevel = getLevelFromXp(oldXp);
    const newLevel = getLevelFromXp(newXp);
    
    if (newLevel > oldLevel) {
        alert(`🎯 LEVEL UP! You reached Level ${newLevel}!`);
        playLevelUpSound(); 
    }
}
//play lvl up sound
function playLevelUpSound() {
    try{
        const audio = new Audio("sound/levelup.mp3");
        audio.volume = 0.5;
        audio.play();
    }catch(err){
        console.log("Audio play failed:", err);

    }
}

// Time input handler
function updateFromInput() {
  const minutesInput = document.getElementById('minutesInput');
  if (!running) {
    secondsLeft = parseInt(minutesInput.value) * 60;
    totalSeconds = secondsLeft;
    updateDisplay();
  }
}

// Timer control functions
function startTimer() {
  if (!running) {
    // Only grab new input when timer hasn't started yet
    const minutesInput = document.getElementById('minutesInput');
    if (!secondsLeft) {
      totalSeconds = parseInt(minutesInput.value) * 60;
      secondsLeft = totalSeconds;
    }

    const startTime = Date.now();
    localStorage.setItem('startTime', startTime);
    localStorage.setItem('totalSeconds', totalSeconds);
    localStorage.removeItem('paused', 'false');

    running = true;
    alert(`🚀 Mission Started: ${minutesInput.value} minutes of focus`);

    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      secondsLeft = Math.max(totalSeconds - elapsed, 0);
      updateDisplay();

      if (secondsLeft <= 0) {
        clearInterval(timer);
        running = false;
        missionComplete();
        localStorage.removeItem('startTime');
        localStorage.removeItem('totalSeconds');
      }
    }, 1000);
  }
}

function pauseTimer() {
  running = false;
  clearInterval(timer);
  localStorage.setItem('paused', 'true');
  localStorage.setItem('secondsLeft', secondsLeft);
}

function resetTimer() {
  running = false;
  clearInterval(timer);
  localStorage.removeItem('startTime');
  localStorage.removeItem('totalSeconds');
  localStorage.removeItem('paused');
  localStorage.removeItem('secondsLeft');

  const minutesInput = document.getElementById('minutesInput');
  secondsLeft = parseInt(minutesInput.value) * 60;
  totalSeconds = secondsLeft;
  updateDisplay();
}

// Mission complete: updates the streak and XP
function missionComplete() {
  const baseXp = 10;
  const minutes = totalSeconds / 60;
  let multiplier = 1 + (minutes / 15) * 0.5; // +0.5 per 15min
  multiplier = Math.min(multiplier, 3); // cap the multiplier to avoid abuse
  const gainedXp = Math.round(baseXp * multiplier);
  alert(`🎉 Mission Complete! +${gainedXp} XP (x${multiplier.toFixed(1)} length bonus)`);

  // update xp
  let oldXp = parseInt(localStorage.getItem("xp") || 0);
  let xp = oldXp + gainedXp;
  localStorage.setItem("xp", xp);
    localStorage.setItem("xp", xp);
    document.getElementById("xpDisplay").textContent = `⭐ XP: ${xp}`;
    checkLevelUp(oldXp, xp);
    updateLevelDisplay(xp);

  // glow animation
  document.getElementById('xpDisplay').classList.add('glow');
  setTimeout(() => {
    document.getElementById('xpDisplay').classList.remove('glow');
  }, 1000);

  // update streak
  let today = new Date().toDateString();
  let lastDate = localStorage.getItem("lastLockedInDay");
  let streak = parseInt(localStorage.getItem("streak") || 0);
  if (lastDate !== today) {
    streak++;
    localStorage.setItem("streak", streak);
    localStorage.setItem("lastLockedInDay", today);
  }

  document.getElementById('streakDisplay').textContent = `🔥 Streak: ${streak} days`;

  // Save to Firestore if logged in
  if (auth.currentUser) {
    saveUserData(auth.currentUser.uid, {
      xp: xp,
      streak: streak,
      tasks: getAllTasks()
    });
  }
  localStorage.removeItem('startTime');
  localStorage.removeItem('totalSeconds');
  localStorage.removeItem('secondsLeft');
  localStorage.removeItem('paused');
}

// Load default on start
window.onload = () => {
  const minutesInput = document.getElementById('minutesInput');
  secondsLeft = parseInt(minutesInput.value) * 60;
  totalSeconds = secondsLeft;
  updateDisplay();

  // restore xp and streak
  document.getElementById('xpDisplay').textContent = `⭐ XP: ${localStorage.getItem("xp") || 0}`;
  document.getElementById('streakDisplay').textContent = `🔥 Streak: ${localStorage.getItem("streak") || 0} days`;
  const xp = parseInt(localStorage.getItem("xp") || 0);
  updateLevelDisplay(xp);


  // restore saved tasks from localStorage
  const savedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  if (savedTasks.length > 0) {
    restoreTasks(savedTasks);
  }

  const savedStart = localStorage.getItem('startTime');
  const savedTotal = localStorage.getItem('totalSeconds');
  const wasPaused = localStorage.getItem('paused') === 'true';
  const savedSecondsLeft = parseInt(localStorage.getItem('secondsLeft'));

  if (savedStart && savedTotal) {
    if (!wasPaused) {
      const elapsed = Math.floor((Date.now() - savedStart) / 1000);
      secondsLeft = Math.max(parseInt(savedTotal) - elapsed, 0);
      totalSeconds = parseInt(savedTotal);
      if (secondsLeft > 0) {
        startTimer();
      } else {
        missionComplete();
      }
    } else if (savedSecondsLeft) {
      secondsLeft = savedSecondsLeft;
      totalSeconds = parsedInt(savedTotal);
      updateDisplay();
    }
  }
};

function createTaskElement(text, checked = false) {
  const li = document.createElement('li');

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;

  // style when checked
  const applyCheckStyle = () => {
    if (checkbox.checked) {
      li.style.textDecoration = 'line-through';
      li.style.opacity = '0.6';
    } else {
      li.style.textDecoration = 'none';
      li.style.opacity = '1';
    }
  };
  applyCheckStyle();

  // save xp on change
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
    let oldXp = parseInt(localStorage.getItem("xp") || 0);
    let xp = oldXp + 10;
    localStorage.setItem("xp", xp);
    document.getElementById("xpDisplay").textContent = `⭐ XP: ${xp}`;
    checkLevelUp(oldXp, xp);
    updateLevelDisplay(xp);

      checkAllTasksComplete();
      if (auth.currentUser) {
        saveUserData(auth.currentUser.uid, {
          xp: xp,
          streak: parseInt(localStorage.getItem("streak") || 0),
          tasks: getAllTasks()
        });
      }
    }
    applyCheckStyle();
    saveTasksToLocal();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '-';
  deleteBtn.className = 'deleteBtn';
  deleteBtn.style.marginLeft = '10px';
  deleteBtn.style.background = 'transparent';
  deleteBtn.style.border = 'none';
  deleteBtn.style.color = 'red';
  deleteBtn.style.fontSize = '18px';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.title = 'Remove task';

  deleteBtn.addEventListener('click', () => {
    li.remove();
    saveTasksToLocal();
  });

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(text));

  li.appendChild(label);
  li.appendChild(deleteBtn);

  return li;
}

// TO-DO LIST SYSTEM
// add task
function addTask() {
  const taskInput = document.getElementById('newTask');
  const taskText = taskInput.value.trim();
  if (taskText === '') return;

  const li = createTaskElement(taskText, false);
  document.getElementById('taskList').appendChild(li);

  taskInput.value = '';
  saveTasksToLocal();
}

// Get all tasks for Firestore saving
function getAllTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    const text = li.textContent.trim();
    const checked = li.querySelector("input").checked;
    tasks.push({ text, checked });
  });
  return tasks;
}

// Save tasks to local storage
function saveTasksToLocal() {
  const tasks = getAllTasks();
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from Firestore
function restoreTasks(savedTasks) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  savedTasks.forEach(task => {
    const li = createTaskElement(task.text, !!task.checked);
    taskList.appendChild(li);
  });
}

// Bonus for completing all tasks
function checkAllTasksComplete() {
  const allTasks = document.querySelectorAll('#taskList input[type="checkbox"]');
  if (allTasks.length > 0 && [...allTasks].every(cb => cb.checked)) {
    alert("🏅 Awesome Job! All tasks complete! +25 XP bonus!");
    let oldXp = parseInt(localStorage.getItem("xp") || 0);
    let xp = oldXp + 25;
    localStorage.setItem("xp", xp);
    document.getElementById("xpDisplay").textContent = `⭐ XP: ${xp}`;
    checkLevelUp(oldXp, xp);
    updateLevelDisplay(xp);


    // Save bonus XP to Firestore
    if (auth.currentUser) {
      saveUserData(auth.currentUser.uid, {
        xp: xp,
        streak: parseInt(localStorage.getItem("streak") || 0),
        tasks: getAllTasks()
      });
    }
  }
}

// remove all tasks
function removeAllTasks() {
  if (confirm("Are you sure you want to remove all tasks?")) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    saveTasksToLocal();
  }
}

// FIREBASE SETUP
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYnm_xiIg9g1KDdMSJSb1EWeT-DKPNOpE",
  authDomain: "lockedin-b8981.firebaseapp.com",
  projectId: "lockedin-b8981",
  storageBucket: "lockedin-b8981.firebasestorage.app",
  messagingSenderId: "389569651489",
  appId: "1:389569651489:web:0ab370d06918974cc09460",
  measurementId: "G-ZJK5P50H9Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Firestore save and load
async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
    console.log("✅ Saved:", data);
  } catch (err) {
    console.error("Error saving data:", err);
  }
}

async function loadUserData(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      console.log("📦 Loaded data:", data);

      // restore XP, streak, and tasks
      if (data.xp !== undefined) {
        localStorage.setItem("xp", data.xp);
        document.getElementById("xpDisplay").textContent = `⭐ XP: ${data.xp}`;
      }
      if (data.streak !== undefined) {
        localStorage.setItem("streak", data.streak);
        document.getElementById("streakDisplay").textContent = `🔥 Streak: ${data.streak} days`;
      }
      if (data.tasks) {
        restoreTasks(data.tasks);
      }
    }
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

// LOGIN / LOGOUT HANDLERS
async function login() {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Signed in as:", result.user.displayName);
    loadUserData(result.user.uid);
  } catch (err) {
    console.error("Login failed:", err);
  }
}

async function logout() {
  try {
    await signOut(auth);
    console.log("Signed out");
  } catch (err) {
    console.error("Logout failed:", err);
  }
}

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    console.log("User:", user.email);
    loadUserData(user.uid);
  } else {
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
  }
});

// Expose functions globally so HTML buttons can use them
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.updateFromInput = updateFromInput;
window.addTask = addTask;
window.removeAllTasks = removeAllTasks;
window.login = login;
window.logout = logout;
