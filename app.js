import { app, auth, firestore } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log('Firebase initialized:', app);
console.log('Auth service:', auth);
console.log('Firestore service:', firestore);

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('auth-button');
    const logoutButton = document.getElementById('logout-button');

    if (authButton && logoutButton) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                authButton.textContent = 'Панель управления';
                authButton.href = '/dashboard.html';
                logoutButton.style.display = 'block';
            } else {
                // User is signed out
                authButton.textContent = 'Войти';
                authButton.href = '/auth/auth.html';
                logoutButton.style.display = 'none';
            }
        });

        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = '/';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }
}); 