import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, deleteDoc, runTransaction, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const itemNameEl = document.getElementById('item-name');
const itemImageEl = document.getElementById('item-image');
const itemPriceEl = document.getElementById('item-price');
const itemDescriptionEl = document.getElementById('item-description');
const paymentCardSelect = document.getElementById('payment-card');
const buyNowButton = document.getElementById('buy-now-button');
const contactSellerButton = document.getElementById('contact-seller-button');

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

onAuthStateChanged(auth, async (user) => {
    if (user && itemId) {
        const itemRef = doc(firestore, "items", itemId);
        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists()) {
            const itemData = itemSnap.data();
            itemNameEl.textContent = itemData.name;
            itemImageEl.src = itemData.image;
            itemPriceEl.textContent = itemData.price;
            itemDescriptionEl.textContent = itemData.description;

            // Load user's cards
            const cardsQuery = query(collection(firestore, "cards"), where("userId", "==", user.uid));
            const cardsSnapshot = await getDocs(cardsQuery);
            cardsSnapshot.forEach(cardDoc => {
                const card = cardDoc.data();
                const option = document.createElement('option');
                option.value = cardDoc.id;
                option.textContent = `Карта **** ${card.cardNumber.slice(-4)} (Баланс: ${card.balance} МР)`;
                paymentCardSelect.appendChild(option);
            });

            buyNowButton.addEventListener('click', async () => {
                const selectedBuyerCardId = paymentCardSelect.value;
                if (!selectedBuyerCardId) {
                    alert('Пожалуйста, выберите карту для оплаты.');
                    return;
                }

                try {
                    await runTransaction(firestore, async (transaction) => {
                        const itemRef = doc(firestore, "items", itemId);
                        const buyerCardRef = doc(firestore, "cards", selectedBuyerCardId);

                        // 1. Read all necessary documents first.
                        const itemSnap = await transaction.get(itemRef);
                        if (!itemSnap.exists()) {
                            throw "Товар больше не доступен.";
                        }
                        
                        const itemData = itemSnap.data();
                        const sellerCardRef = doc(firestore, "cards", itemData.payoutCardId);

                        const buyerCardSnap = await transaction.get(buyerCardRef);
                        const sellerCardSnap = await transaction.get(sellerCardRef);

                        // 2. Validate the data.
                        if (!buyerCardSnap.exists() || buyerCardSnap.data().balance < itemData.price) {
                            throw "Недостаточно средств на выбранной карте.";
                        }
                        if (!sellerCardSnap.exists()) {
                            throw "Карта продавца не найдена.";
                        }

                        // 3. Perform all write operations.
                        const commission = itemData.price * 0.05;
                        const sellerGets = itemData.price - commission;
                        const newBuyerBalance = buyerCardSnap.data().balance - itemData.price;
                        const newSellerBalance = sellerCardSnap.data().balance + sellerGets;
                        
                        transaction.update(buyerCardRef, { balance: newBuyerBalance });
                        transaction.update(sellerCardRef, { balance: newSellerBalance });
                        transaction.delete(itemRef);
                    });

                    alert('Покупка совершена успешно!');
                    window.location.href = '/market.html';
                } catch (error) {
                    console.error("Transaction failed: ", error);
                    alert(`Ошибка при покупке: ${error}`);
                }
            });

            contactSellerButton.addEventListener('click', async () => {
                const chatQuery = query(
                    collection(firestore, 'chats'),
                    where('itemId', '==', itemId),
                    where('participants', 'array-contains', user.uid)
                );
                const querySnapshot = await getDocs(chatQuery);
                
                if (querySnapshot.empty) {
                    const newChat = await addDoc(collection(firestore, 'chats'), {
                        itemId: itemId,
                        participants: [user.uid, itemData.sellerId]
                    });
                    window.location.href = `/chat.html?id=${newChat.id}`;
                } else {
                    window.location.href = `/chat.html?id=${querySnapshot.docs[0].id}`;
                }
            });

        } else {
            window.location.href = '/market.html';
        }
    } else if (!user) {
        window.location.href = '/auth/auth.html';
    }
}); 