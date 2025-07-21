import { auth, firestore } from './firebase.js';
import { onAuthStateChanged, updateProfile, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createCardComponent } from './components/card.js';

const userGreetingSpan = document.getElementById('user-greeting');
const customizeAccountButton = document.getElementById('customize-account-button');
const accountDialog = document.getElementById('account-dialog');
const dialogCloseButton = document.getElementById('dialog-close-button');
const displayNameInput = document.getElementById('displayName');
const updateProfileButton = document.getElementById('update-profile-button');
const deleteAccountButton = document.getElementById('delete-account-button');
const createCardButton = document.getElementById('create-card-button');
const cardsContainer = document.getElementById('cards-container');

function showAccountDialog() {
    accountDialog.style.display = 'flex';
}

function closeAccountDialog() {
    accountDialog.style.display = 'none';
}

customizeAccountButton.addEventListener('click', showAccountDialog);
dialogCloseButton.addEventListener('click', closeAccountDialog);

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (userGreetingSpan) {
            userGreetingSpan.textContent = user.displayName || user.email;
        }
        if(displayNameInput) {
            displayNameInput.value = user.displayName || '';
        }

        updateProfileButton.addEventListener('click', async () => {
            try {
                await updateProfile(user, {
                    displayName: displayNameInput.value
                });
                alert('Профиль успешно обновлен!');
                userGreetingSpan.textContent = displayNameInput.value;
                closeAccountDialog();
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Ошибка при обновлении профиля.');
            }
        });

        deleteAccountButton.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.')) {
                try {
                    await deleteUser(user);
                    alert('Аккаунт успешно удален.');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert('Ошибка при удалении аккаунта.');
                }
            }
        });

        createCardButton.addEventListener('click', async () => {
            const newCard = {
                userId: user.uid,
                cardNumber: Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000)).join(' '),
                expirationDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear() % 100 + 5}`,
                cvc: String(Math.floor(100 + Math.random() * 900)).padStart(3, '0'),
                balance: 1000,
                color: '#4a90e2'
            };

            try {
                const docRef = await addDoc(collection(firestore, "cards"), newCard);
                renderCard(newCard, docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        });

        const renderCard = (cardData, cardId) => {
            const cardLink = document.createElement('a');
            cardLink.href = `/card-settings.html?id=${cardId}`;
            cardLink.style.textDecoration = 'none';

            const cardElement = createCardComponent(cardData, user);
            cardLink.appendChild(cardElement);
            cardsContainer.appendChild(cardLink);
        };

        const loadCards = async () => {
            const q = query(collection(firestore, "cards"), where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                renderCard(doc.data(), doc.id);
            });
        };

        loadCards();

    } else {
        window.location.href = '/auth/auth.html';
    }
}); 