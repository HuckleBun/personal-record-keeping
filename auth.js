document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    showSignup.addEventListener('click', toggleForms);
    showLogin.addEventListener('click', toggleForms);
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[email] && users[email].password === password) {
        localStorage.setItem('currentUser', JSON.stringify({ email }));
        window.location.href = 'billing.html';
    } else {
        alert('Invalid email or password');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[email]) {
        alert('User already exists');
    } else {
        users[email] = { password };
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify({ email }));
        window.location.href = 'billing.html';
    }
}

function toggleForms() {
    const loginContainer = document.querySelector('.login-container');
    const signupContainer = document.querySelector('.signup-container');
    
    loginContainer.style.display = loginContainer.style.display === 'none' ? 'block' : 'none';
    signupContainer.style.display = signupContainer.style.display === 'none' ? 'block' : 'none';
}