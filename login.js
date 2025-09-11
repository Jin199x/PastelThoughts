// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC9M9No4HNitBiiqvXxGMYQSQJ0TNhKxR0",
  authDomain: "pastelthoughts-19dd4.firebaseapp.com",
  projectId: "pastelthoughts-19dd4",
  messagingSenderId: "578642737437",
  appId: "pastelthoughts-19dd4.web.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Grab login card and links
const loginCard = document.querySelector('.login-card');
const showSignup = document.getElementById('showSignup');
const showForgot = document.getElementById('showForgot');

// --- Create Signup Form dynamically ---
const signupForm = document.createElement('form');
signupForm.id = 'signupForm';
signupForm.style.display = 'none';
signupForm.style.flexDirection = 'column';
signupForm.style.gap = '15px';
signupForm.innerHTML = `
  <input type="email" id="signupEmail" placeholder="Email" required>
  <input type="password" id="signupPassword" placeholder="Password" required>
  <button type="submit">Create Account</button>
  <a href="#" id="backFromSignup">Back to Login</a>
`;

// --- Create Forgot Password Form dynamically ---
const forgotForm = document.createElement('form');
forgotForm.id = 'forgotForm';
forgotForm.style.display = 'none';
forgotForm.style.flexDirection = 'column';
forgotForm.style.gap = '15px';
forgotForm.innerHTML = `
  <input type="email" id="forgotEmail" placeholder="Email" required>
  <button type="submit">Send Reset Link</button>
  <a href="#" id="backFromForgot">Back to Login</a>
`;

// Insert forms before links
const linksDiv = document.querySelector('.links');
loginCard.insertBefore(signupForm, linksDiv);
loginCard.insertBefore(forgotForm, linksDiv);

// --- Toggle forms ---
function showForm(formType) {
  document.getElementById('loginForm').style.display = formType === 'login' ? 'flex' : 'none';
  signupForm.style.display = formType === 'signup' ? 'flex' : 'none';
  forgotForm.style.display = formType === 'forgot' ? 'flex' : 'none';
}

// --- Link Events ---
showSignup.addEventListener('click', e => { e.preventDefault(); showForm('signup'); });
showForgot.addEventListener('click', e => { e.preventDefault(); showForm('forgot'); });

// --- Back links ---
document.addEventListener('click', e => {
  if (e.target.id === 'backFromSignup' || e.target.id === 'backFromForgot') {
    e.preventDefault();
    showForm('login');
  }
});

// --- Firebase Login ---
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('Enter email and password');

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log('Logged in user:', userCredential.user.uid);
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
