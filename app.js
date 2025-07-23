import { app, auth, firestore } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Firebase initialized:', app);
console.log('Auth service:', auth);
console.log('Firestore service:', firestore);

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('auth-button');
    const logoutButton = document.getElementById('logout-button');
    const adminLink = document.getElementById('admin-link');
    const ADMIN_EMAILS = ['utoplennik69pc@gmail.com', 'abusalamovmuhammad9@gmail.com', 'd4rkh4x0rz.team@gmail.com'];

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(swReg => {
                console.log('Service Worker is registered', swReg);
            }).catch(error => {
                console.error('Service Worker Error', error);
            });
    }

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

                subscribeUserToPush(user.uid);

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

async function subscribeUserToPush(userId) {
    const swRegistration = await navigator.serviceWorker.ready;
    const applicationServerKey = await getVapidKey();

    try {
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
        });
        console.log('User is subscribed.');

        const subscriptionData = subscription.toJSON();
        const userSubscriptionsRef = doc(firestore, 'pushSubscriptions', userId);
        await setDoc(userSubscriptionsRef, { subscription: subscriptionData }, { merge: true });

    } catch (err) {
        console.log('Failed to subscribe the user: ', err);
    }
}

async function getVapidKey() {
    // Replace this with your actual VAPID key from the Firebase console.
    return "BLaelXes9YRt8dXox-8U6uKmZvL5hn0TO3An2tkdif9lH4brGIZc7EEVThsiz4y0RYw8ElsHhTTP5ma5k6Eymhc";
}
