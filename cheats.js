import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const cardsManagementContainer = document.getElementById('cards-management-container');
    
    if (!cardsManagementContainer) {
        console.error('Cheat page management container not found!');
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadUserCards(user, cardsManagementContainer);
            setupEventListeners(user, cardsManagementContainer);
        } else {
            window.location.href = '/auth/auth.html';
        }
    });
});

const loadUserCards = async (user, container) => {
    container.innerHTML = '<p>Загрузка карт...</p>';
    try {
        const cardsRef = collection(firestore, "cards");
        const q = query(cardsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<p>У вас пока нет карт.</p>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const card = doc.data();
            const cardId = doc.id;
            const cardElement = document.createElement('div');
            cardElement.className = 'cheat-card';
            cardElement.innerHTML = `
                <div class="cheat-card-info">
                    <strong>Карта:</strong> ${card.cardNumber}<br>
                    <strong>Баланс:</strong> <span id="balance-${cardId}">${card.balance.toLocaleString('ru-RU')}</span> МР
                </div>
                <div class="cheat-actions">
                    <input type="number" class="input" placeholder="Сумма" id="amount-${cardId}">
                    <button class="btn btn-primary" data-action="add" data-id="${cardId}">Добавить</button>
                    <button class="btn" data-action="set" data-id="${cardId}">Установить</button>
                    <button class="btn btn-danger" data-action="delete" data-id="${cardId}">Удалить</button>
                </div>
            `;
            container.appendChild(cardElement);
        });
    } catch (error) {
        console.error("Error loading user cards:", error);
        container.innerHTML = '<p>Ошибка при загрузке карт. Проверьте консоль для получения дополнительной информации.</p>';
    }
};

const setupEventListeners = (user, container) => {
    container.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON') {
            const action = e.target.dataset.action;
            const cardId = e.target.dataset.id;

            if (!cardId) return;

            const cardRef = doc(firestore, "cards", cardId);

            if (action === 'delete') {
                if (confirm('Вы уверены, что хотите удалить эту карту?')) {
                    await deleteDoc(cardRef);
                    loadUserCards(user, container);
                }
                return;
            }

            const amountInput = document.getElementById(`amount-${cardId}`);
            if (!amountInput) return;
            const amount = parseFloat(amountInput.value);

            if (isNaN(amount)) {
                alert('Пожалуйста, введите корректную сумму.');
                return;
            }

            try {
                const cardDoc = await getDoc(cardRef);
                if (!cardDoc.exists()) {
                    alert('Карта не найдена.');
                    return;
                }
                const currentBalance = cardDoc.data().balance;
                let newBalance;

                if (action === 'add') {
                    newBalance = currentBalance + amount;
                } else if (action === 'set') {
                    newBalance = amount;
                }

                await updateDoc(cardRef, { balance: newBalance });
                const balanceSpan = document.getElementById(`balance-${cardId}`);
                if(balanceSpan) {
                    balanceSpan.textContent = newBalance.toLocaleString('ru-RU');
                }
                amountInput.value = '';

                if (window.checkDebt) {
                    window.checkDebt(user);
                }

            } catch (error) {
                console.error("Error updating balance: ", error);
                alert('Произошла ошибка при обновлении баланса.');
            }
        }
    });

    const createNewCardButton = document.getElementById('create-new-card-button');
    const newCardBalanceInput = document.getElementById('new-card-balance');

    if (createNewCardButton && newCardBalanceInput) {
        createNewCardButton.addEventListener('click', async () => {
            const initialBalance = parseFloat(newCardBalanceInput.value);
            if (isNaN(initialBalance)) {
                alert('Пожалуйста, введите корректный начальный баланс.');
                return;
            }

            try {
                await addDoc(collection(firestore, "cards"), {
                    userId: user.uid,
                    cardNumber: Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join(' '),
                    expirationDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(new Date().getFullYear() + 5).slice(-2)}`,
                    cvc: String(Math.floor(100 + Math.random() * 900)).padStart(3, '0'),
                    balance: initialBalance,
                    color: 'linear-gradient(120deg, #2c3e50, #4ca1af)'
                });
                loadUserCards(user, container);
                if (window.checkDebt) {
                    window.checkDebt(user);
                }
            } catch (error) {
                console.error("Error creating new card: ", error);
                alert('Произошла ошибка при создании карты.');
            }
        });
    }
}; 