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

// Grab forms and links
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const showSignup = document.getElementById('showSignup');
const showForgot = document.getElementById('showForgot');
const backFromSignup = document.getElementById('backFromSignup');
const backFromForgot = document.getElementById('backFromForgot');

// --- Show/hide forms ---
function showForm(formType) {
  loginForm.style.display = formType === 'login' ? 'flex' : 'none';
  signupForm.style.display = formType === 'signup' ? 'flex' : 'none';
  forgotForm.style.display = formType === 'forgot' ? 'flex' : 'none';
}

// --- Link events ---
showSignup.addEventListener('click', e => { e.preventDefault(); showForm('signup'); });
showForgot.addEventListener('click', e => { e.preventDefault(); showForm('forgot'); });
backFromSignup.addEventListener('click', e => { e.preventDefault(); showForm('login'); });
backFromForgot.addEventListener('click', e => { e.preventDefault(); showForm('login'); });

// --- Firebase Login ---
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('Enter email and password');

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
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
