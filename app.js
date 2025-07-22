import { app, auth, firestore } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log('Firebase initialized:', app);
console.log('Auth service:', auth);
console.log('Firestore service:', firestore);

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('auth-button');
    const logoutButton = document.getElementById('logout-button');
    const adminLink = document.getElementById('admin-link');
    const ADMIN_EMAILS = ['utoplennik69pc@gmail.com', 'abusalamovmuhammad9@gmail.com'];

    if (authButton && logoutButton) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                authButton.textContent = 'Панель управления';
                authButton.href = '/dashboard.html';
                logoutButton.style.display = 'block';

                if (user && ADMIN_EMAILS.includes(user.email)) {
                    adminLink.style.display = 'block';
                } else {
                    adminLink.style.display = 'none';
                }

            } else {
                authButton.textContent = 'Войти';
                authButton.href = '/auth/auth.html';
                logoutButton.style.display = 'none';
                adminLink.style.display = 'none';
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