import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth();
const firestore = getFirestore();
const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');

const ADMIN_EMAILS = ['utoplennik69pc@gmail.com', 'abusalamovmuhammad9@gmail.com'];

const errorDialog = document.getElementById('error-dialog');
const dialogMessage = document.getElementById('dialog-message');
const dialogCloseButton = document.getElementById('dialog-close-button');

function getRussianErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/wrong-password':
            return 'Неверный пароль. Пожалуйста, попробуйте еще раз.';
        case 'auth/user-not-found':
            return 'Пользователь с таким адресом электронной почты не найден.';
        case 'auth/invalid-email':
            return 'Некорректный формат адреса электронной почты.';
        case 'auth/email-already-in-use':
            return 'Этот адрес электронной почты уже используется другой учетной записью.';
        case 'auth/weak-password':
            return 'Пароль слишком слабый. Он должен содержать не менее 6 символов.';
        case 'auth/invalid-credential':
            return 'Неверные учетные данные. Пожалуйста, проверьте свой email и пароль.';
        default:
            return 'Произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.';
    }
}

function showErrorDialog(message) {
    dialogMessage.textContent = message;
    errorDialog.style.display = 'flex';
}

function closeErrorDialog() {
    errorDialog.style.display = 'none';
}

dialogCloseButton.addEventListener('click', closeErrorDialog);

loginButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if user is disabled
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().disabled) {
            await auth.signOut(); // Sign out the user immediately
            showErrorDialog('Ваш аккаунт отключен. Обратитесь к администратору.');
            return;
        }
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing in:', error);
        const message = getRussianErrorMessage(error.code);
        showErrorDialog(message);
    }
});

registerButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a display name from the email
        const displayName = email.split('@')[0];

        // Check for special roles
        const isAdmin = ADMIN_EMAILS.includes(email);
        const isHacker = email.includes('d4rkh4x0rz.team');

        // Save user to Firestore with the new structure
        await setDoc(doc(firestore, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            disabled: false,
            isAdmin: isAdmin,
            isHacker: isHacker,
            createdAt: new Date()
        });

        window.location.href = '/';
    } catch (error) {
        console.error('Error creating user:', error);
        const message = getRussianErrorMessage(error.code);
        showErrorDialog(message);
    }
}); 
