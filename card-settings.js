import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createCardComponent } from './components/card.js';

const cardDetailsContainer = document.getElementById('card-details-container');
const colorPicker = document.querySelector('.color-picker');
const deleteCardButton = document.getElementById('delete-card-button');

const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('id');

onAuthStateChanged(auth, async (user) => {
    if (user && cardId) {
        const cardRef = doc(firestore, "cards", cardId);
        const cardSnap = await getDoc(cardRef);

        if (cardSnap.exists() && cardSnap.data().userId === user.uid) {
            const cardData = cardSnap.data();
            renderCardDetails(cardData, user);

            colorPicker.addEventListener('click', async (e) => {
                if (e.target.classList.contains('color-box')) {
                    const newColor = e.target.dataset.color;
                    await updateDoc(cardRef, { color: newColor });
                    
                    // Re-render the card with the new color
                    const updatedCardData = { ...cardData, color: newColor };
                    renderCardDetails(updatedCardData, user);
                }
            });

            deleteCardButton.addEventListener('click', async () => {
                if (confirm('Вы уверены, что хотите удалить эту карту?')) {
                    await deleteDoc(cardRef);
                    window.location.href = '/dashboard.html';
                }
            });

        } else {
            // Card not found or user does not have permission
            window.location.href = '/dashboard.html';
        }
    } else {
        // No user is signed in
        window.location.href = '/auth/auth.html';
    }
});

function renderCardDetails(cardData, user) {
    const cardElement = createCardComponent(cardData, user);
    cardDetailsContainer.innerHTML = '';
    cardDetailsContainer.appendChild(cardElement);
} 