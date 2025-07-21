import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = 'utoplennik69pc@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    const adminContent = document.getElementById('admin-content');
    const authGate = document.getElementById('auth-gate');

    onAuthStateChanged(auth, async (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            adminContent.style.display = 'block';
            authGate.style.display = 'none';
            await loadUsers();
            setupDialogs();
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
                        <span>${user.displayName || user.email} (UID: ${user.uid}) - Статус: ${user.disabled ? 'Отключен' : 'Активен'}</span>
                        <div style="margin-top: 10px;">
                            <button class="btn btn-secondary" data-action="message" data-uid="${user.uid}">Сообщение</button>
                            <button class="btn btn-warning" data-action="toggle-disable" data-uid="${user.uid}" data-disabled="${user.disabled}">${user.disabled ? 'Включить' : 'Отключить'}</button>
                            <button class="btn btn-danger" data-action="delete" data-uid="${user.uid}">Удалить</button>
                            <button class="btn" data-action="cards" data-uid="${user.uid}">Карты</button>
                            <button class="btn" data-action="items" data-uid="${user.uid}">Товары</button>
                        </div>
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

function setupDialogs() {
    const usersListDiv = document.getElementById('users-list');

    // Message Dialog
    const messageDialog = document.getElementById('message-dialog');
    const sendMessageButton = document.getElementById('send-message-button');
    const cancelMessageButton = document.getElementById('cancel-message-button');
    const messageText = document.getElementById('message-text');

    // Cards Dialog
    const cardsDialog = document.getElementById('cards-dialog');
    const closeCardsDialog = document.getElementById('close-cards-dialog');
    const userCardsContent = document.getElementById('user-cards-content');

    // Items Dialog
    const itemsDialog = document.getElementById('items-dialog');
    const closeItemsDialog = document.getElementById('close-items-dialog');
    const userItemsContent = document.getElementById('user-items-content');

    let currentUid = null;

    usersListDiv.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON') {
            const action = e.target.dataset.action;
            currentUid = e.target.dataset.uid;

            switch (action) {
                case 'message':
                    messageDialog.style.display = 'flex';
                    break;
                case 'toggle-disable':
                    await toggleDisableUser(currentUid, e.target.dataset.disabled === 'true');
                    break;
                case 'delete':
                    await deleteUser(currentUid);
                    break;
                case 'cards':
                    await loadUserCards(currentUid);
                    cardsDialog.style.display = 'flex';
                    break;
                case 'items':
                    await loadUserItems(currentUid);
                    itemsDialog.style.display = 'flex';
                    break;
            }
        }
    });

    // Close dialog listeners
    cancelMessageButton.addEventListener('click', () => messageDialog.style.display = 'none');
    closeCardsDialog.addEventListener('click', () => cardsDialog.style.display = 'none');
    closeItemsDialog.addEventListener('click', () => itemsDialog.style.display = 'none');


    sendMessageButton.addEventListener('click', async () => {
        if (!currentUid || !messageText.value.trim()) return;
        try {
            await setDoc(doc(firestore, 'messages', currentUid), {
                message: messageText.value.trim(),
                timestamp: new Date()
            }, { merge: true });
            alert('Сообщение отправлено!');
            messageText.value = '';
            messageDialog.style.display = 'none';
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });
}

async function toggleDisableUser(uid, isDisabled) {
    if (!confirm(`Вы уверены, что хотите ${isDisabled ? 'включить' : 'отключить'} этого пользователя?`)) return;
    try {
        await updateDoc(doc(firestore, 'users', uid), { disabled: !isDisabled });
        alert(`Пользователь ${!isDisabled ? 'отключен' : 'включен'}.`);
        loadUsers();
    } catch (error) {
        console.error("Error toggling user state:", error);
    }
}

async function deleteUser(uid) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя и все его данные? Это действие необратимо.')) return;
    try {
        // This is a simplified deletion. In a real app, you'd use a Cloud Function
        // to handle this properly on the backend to delete auth user and all associated data.
        await deleteDoc(doc(firestore, 'users', uid));

        // Delete associated cards
        const cardsQuery = query(collection(firestore, 'cards'), where('userId', '==', uid));
        const cardsSnapshot = await getDocs(cardsQuery);
        cardsSnapshot.forEach(async (cardDoc) => await deleteDoc(cardDoc.ref));

        // Delete associated items
        const itemsQuery = query(collection(firestore, 'items'), where('sellerId', '==', uid));
        const itemsSnapshot = await getDocs(itemsQuery);
        itemsSnapshot.forEach(async (itemDoc) => await deleteDoc(itemDoc.ref));

        alert('Пользователь и его данные удалены.');
        loadUsers();
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}


async function loadUserCards(uid) {
    const userCardsContent = document.getElementById('user-cards-content');
    userCardsContent.innerHTML = '<p>Загрузка карт...</p>';
    try {
        const cardsQuery = query(collection(firestore, 'cards'), where('userId', '==', uid));
        const cardsSnapshot = await getDocs(cardsQuery);
        if (cardsSnapshot.empty) {
            userCardsContent.innerHTML = '<p>У пользователя нет карт.</p>';
            return;
        }
        let cardsHTML = '';
        cardsSnapshot.forEach(doc => {
            const card = doc.data();
            cardsHTML += `
                <div class="card-management">
                    <input type="text" class="input" value="${card.cardNumber}" data-id="${doc.id}" data-field="cardNumber">
                    <input type="text" class="input" value="${card.expirationDate}" data-id="${doc.id}" data-field="expirationDate">
                    <input type="text" class="input" value="${card.cvc}" data-id="${doc.id}" data-field="cvc">
                    <input type="number" class="input" value="${card.balance}" data-id="${doc.id}" data-field="balance">
                    <input type="color" class="color-box" value="${card.color}" data-id="${doc.id}" data-field="color">
                    <button class="btn btn-primary" style="margin-top: 21px;" data-action="update-card" data-id="${doc.id}">Сохранить</button>
                    <button class="btn btn-danger" data-action="delete-card" data-id="${doc.id}">Удалить</button>
                </div>
            `;
        });
        userCardsContent.innerHTML = cardsHTML;
    } catch (error) {
        console.error("Error loading cards:", error);
        userCardsContent.innerHTML = '<p>Ошибка при загрузке карт.</p>';
    }
}

async function loadUserItems(uid) {
    const userItemsContent = document.getElementById('user-items-content');
    userItemsContent.innerHTML = '<p>Загрузка товаров...</p>';
    try {
        const itemsQuery = query(collection(firestore, 'items'), where('sellerId', '==', uid));
        const itemsSnapshot = await getDocs(itemsQuery);
        if (itemsSnapshot.empty) {
            userItemsContent.innerHTML = '<p>У пользователя нет товаров на рынке.</p>';
            return;
        }
        let itemsHTML = '';
        itemsSnapshot.forEach(doc => {
            const item = doc.data();
            itemsHTML += `
                <div class="item-management">
                    <input type="text" class="input" value="${item.name}" data-id="${doc.id}" data-field="name">
                    <input type="text" class="input" value="${item.description}" data-id="${doc.id}" data-field="description">
                    <input type="number" class="input" value="${item.price}" data-id="${doc.id}" data-field="price">
                    <button class="btn btn-primary" style="margin-top: 21px" data-action="update-item" data-id="${doc.id}">Сохранить</button>
                    <button class="btn btn-danger" data-action="delete-item" data-id="${doc.id}">Удалить</button>
                </div>
            `;
        });
        userItemsContent.innerHTML = itemsHTML;
    } catch (error) {
        console.error("Error loading items:", error);
        userItemsContent.innerHTML = '<p>Ошибка при загрузке товаров.</p>';
    }
}


// Event delegation for dynamically created content in dialogs
document.addEventListener('click', async (e) => {
    if (!e.target.dataset.action) return;

    const action = e.target.dataset.action;
    const id = e.target.dataset.id;

    switch (action) {
        case 'update-card': {
            const container = e.target.closest('.card-management');
            const data = {
                cardNumber: container.querySelector('[data-field="cardNumber"]').value,
                expirationDate: container.querySelector('[data-field="expirationDate"]').value,
                cvc: container.querySelector('[data-field="cvc"]').value,
                balance: Number(container.querySelector('[data-field="balance"]').value),
                color: container.querySelector('[data-field="color"]').value,
            };
            try {
                await updateDoc(doc(firestore, 'cards', id), data);
                alert('Карта обновлена.');
            } catch (error) {
                console.error('Error updating card:', error);
            }
            break;
        }
        case 'delete-card': {
            if (!confirm('Удалить эту карту?')) return;
            try {
                await deleteDoc(doc(firestore, 'cards', id));
                alert('Карта удалена.');
                e.target.closest('.card-management').remove();
            } catch (error) {
                console.error('Error deleting card:', error);
            }
            break;
        }
        case 'update-item': {
            const container = e.target.closest('.item-management');
            const data = {
                name: container.querySelector('[data-field="name"]').value,
                description: container.querySelector('[data-field="description"]').value,
                price: Number(container.querySelector('[data-field="price"]').value),
            };
            try {
                await updateDoc(doc(firestore, 'items', id), data);
                alert('Товар обновлен.');
            } catch (error) {
                console.error('Error updating item:', error);
            }
            break;
        }
        case 'delete-item': {
            if (!confirm('Удалить этот товар?')) return;
            try {
                await deleteDoc(doc(firestore, 'items', id));
                alert('Товар удален.');
                e.target.closest('.item-management').remove();
            } catch (error) {
                console.error('Error deleting item:', error);
            }
            break;
        }
    }
});


