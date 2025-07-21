import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const createItemForm = document.getElementById('create-item-form');
const payoutCardSelect = document.getElementById('payout-card');
const itemPriceInput = document.getElementById('itemPrice');
const commissionAmountSpan = document.getElementById('commission-amount');

itemPriceInput.addEventListener('input', () => {
    const price = parseFloat(itemPriceInput.value) || 0;
    const commission = price * 0.05;
    commissionAmountSpan.textContent = commission.toFixed(2);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Load seller's cards into the payout select
        const cardsQuery = query(collection(firestore, "cards"), where("userId", "==", user.uid));
        const cardsSnapshot = await getDocs(cardsQuery);
        cardsSnapshot.forEach(cardDoc => {
            const card = cardDoc.data();
            const option = document.createElement('option');
            option.value = cardDoc.id;
            option.textContent = `Карта **** ${card.cardNumber.slice(-4)}`;
            payoutCardSelect.appendChild(option);
        });

        createItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const itemName = document.getElementById('itemName').value;
            const itemDescription = document.getElementById('itemDescription').value;
            const itemPrice = parseFloat(document.getElementById('itemPrice').value);
            const itemImageFile = document.getElementById('itemImage').files[0];
            const payoutCardId = payoutCardSelect.value;

            if (itemImageFile) {
                const reader = new FileReader();
                reader.readAsDataURL(itemImageFile);
                reader.onloadend = async () => {
                    const itemImageBase64 = reader.result;
                    
                    try {
                        await addDoc(collection(firestore, 'items'), {
                            name: itemName,
                            description: itemDescription,
                            price: itemPrice,
                            image: itemImageBase64,
                            sellerId: user.uid,
                            payoutCardId: payoutCardId,
                            createdAt: new Date(),
                        });
                        window.location.href = '/market.html';
                    } catch (error) {
                        console.error("Error adding document: ", error);
                        alert('Произошла ошибка при создании товара.');
                    }
                };
            }
        });
    } else {
        window.location.href = '/auth/auth.html';
    }
}); 