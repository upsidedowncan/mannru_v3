import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = 'utoplennik69pc@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    const adminContent = document.getElementById('admin-content');
    const authGate = document.getElementById('auth-gate');

    onAuthStateChanged(auth, async (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            adminContent.style.display = 'block';
            authGate.style.display = 'none';
            await loadUsers();
            setupMessageDialog();
        } else {
            adminContent.style.display = 'none';
            authGate.style.display = 'block';
            if (user) {
                authGate.innerHTML = '<p>У вас нет прав для доступа к этой странице.</p>';
            }
        }
    });
});

async function loadUsers() {
    const usersListDiv = document.getElementById('users-list');
    usersListDiv.innerHTML = '<p>Загрузка пользователей...</p>';
    try {
        const usersCollection = collection(firestore, 'users');
        const userSnapshot = await getDocs(usersCollection);
        let usersHTML = '<div class="list-group">';
        userSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.email !== ADMIN_EMAIL) {
                usersHTML += `
                    <div class="list-group-item">
                        <span>${user.email} (UID: ${user.uid})</span>
                        <button class="btn btn-secondary" data-uid="${user.uid}" data-email="${user.email}">Отправить сообщение</button>
                    </div>
                `;
            }
        });
        usersHTML += '</div>';
        usersListDiv.innerHTML = usersHTML;
    } catch (error) {
        console.error("Error loading users:", error);
        usersListDiv.innerHTML = '<p>Ошибка при загрузке пользователей.</p>';
    }
}

function setupMessageDialog() {
    const usersListDiv = document.getElementById('users-list');
    const messageDialog = document.getElementById('message-dialog');
    const sendMessageButton = document.getElementById('send-message-button');
    const cancelMessageButton = document.getElementById('cancel-message-button');
    const messageText = document.getElementById('message-text');
    let targetUid = null;

    usersListDiv.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.uid) {
            targetUid = e.target.dataset.uid;
            messageDialog.style.display = 'flex';
        }
    });

    cancelMessageButton.addEventListener('click', () => {
        messageDialog.style.display = 'none';
        messageText.value = '';
        targetUid = null;
    });

    sendMessageButton.addEventListener('click', async () => {
        if (!targetUid || !messageText.value.trim()) {
            alert('Пожалуйста, выберите пользователя и введите сообщение.');
            return;
        }

        try {
            const messageRef = doc(firestore, 'messages', targetUid);
            await setDoc(messageRef, {
                message: messageText.value.trim(),
                timestamp: new Date()
            });
            alert('Сообщение отправлено!');
            cancelMessageButton.click();
        } catch (error) {
            console.error("Error sending message:", error);
            alert('Ошибка при отправке сообщения.');
        }
    });
} 