// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC9M9No4HNitBiiqvXxGMYQSQJ0TNhKxR0",
  authDomain: "pastelthoughts-19dd4.firebaseapp.com",
  projectId: "pastelthoughts-19dd4",
  messagingSenderId: "578642737437",
  appId: "1:578642737437:web:0a7e058cb42a9e340709f4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Grab forms and links
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const showSignup = document.getElementById('showSignup');
const showForgot = document.getElementById('showForgot');

// --- Toggle forms (preserve original layout)
function showForm(formType) {
  loginForm.style.display = formType === 'login' ? 'flex' : 'none';
  signupForm.style.display = formType === 'signup' ? 'flex' : 'none';
  forgotForm.style.display = formType === 'forgot' ? 'flex' : 'none';
}

// --- Link events ---
showSignup.addEventListener('click', e => { e.preventDefault(); showForm('signup'); });
showForgot.addEventListener('click', e => { e.preventDefault(); showForm('forgot'); });

// --- Back links inside HTML forms ---
const backSignup = document.createElement('a');
backSignup.href = "#";
backSignup.textContent = "Back to Login";
backSignup.id = "backFromSignup";
backSignup.style.display = "block";
backSignup.style.marginTop = "10px";
signupForm.appendChild(backSignup);

const backForgot = document.createElement('a');
backForgot.href = "#";
backForgot.textContent = "Back to Login";
backForgot.id = "backFromForgot";
backForgot.style.display = "block";
backForgot.style.marginTop = "10px";
forgotForm.appendChild(backForgot);

document.addEventListener('click', e => {
  if (e.target.id === 'backFromSignup' || e.target.id === 'backFromForgot') {
    e.preventDefault();
    showForm('login');
  }
});

// --- Firebase Login ---
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('Enter email and password');

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log('Logged in user:', userCredential.user.uid);

      // Save login timestamp for 30-min auto-login
      const now = Date.now();
      localStorage.setItem("loginTime", now);

      window.location.href = 'diary.html';
    })
    .catch(error => alert(error.message));
});


// --- Firebase Signup ---
signupForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  if (!email || !password) return alert('Enter email and password');

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert('Account created! You can now login.');
      showForm('login');
    })
    .catch(error => alert(error.message));
});

// --- Firebase Forgot Password ---
forgotForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  if (!email) return alert('Enter your email');

  sendPasswordResetEmail(auth, email)
    .then(() => alert('Password reset email sent!'))
    .catch(error => alert(error.message));
});

//install button
let deferredPrompt;
const installBtn = document.getElementById("installPWA");

// --- Check if app is already installed ---
function isInstalled() {
  // Chrome/Android
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS
  if (window.navigator.standalone) return true;
  return false;
}

// Hide the button if already installed
if (isInstalled()) {
  installBtn.style.display = "none";
}

// Only show button when PWA can be installed
window.addEventListener("beforeinstallprompt", (e) => {
  if (isInstalled()) return; // app already installed
  e.preventDefault();          
  deferredPrompt = e;          
  installBtn.style.display = "block"; 
});

// When user clicks the button
installBtn.addEventListener("click", async () => {
  if (isInstalled()) {
    alert("You already have the PastelThoughts app installed on your device!");
    return;
  }

  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;

  if (choice.outcome === "accepted") {
    installBtn.style.display = "none"; 
    alert("App installed successfully!");
  } else {
    installBtn.style.display = "block"; 
  }
  deferredPrompt = null;
});













