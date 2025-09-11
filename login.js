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

// --- Show/hide forms ---
function showForm(formType) {
  loginForm.style.display = formType === 'login' ? 'block' : 'none';
  signupForm.style.display = formType === 'signup' ? 'block' : 'none';
  forgotForm.style.display = formType === 'forgot' ? 'block' : 'none';
}

// --- Link events ---
showSignup.addEventListener('click', e => { e.preventDefault(); showForm('signup'); });
showForgot.addEventListener('click', e => { e.preventDefault(); showForm('forgot'); });

// Back to login links inside signup/forgot forms
signupForm.insertAdjacentHTML('beforeend', '<a href="#" id="backFromSignup">Back to Login</a>');
forgotForm.insertAdjacentHTML('beforeend', '<a href="#" id="backFromForgot">Back to Login</a>');

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
