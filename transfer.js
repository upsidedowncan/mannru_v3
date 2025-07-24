import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, query, where, doc, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fromCardSelect = document.getElementById('from-card');
const toCardSelect = document.getElementById('to-card');
const amountInput = document.getElementById('amount');
const transferButton = document.getElementById('transfer-button');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Load user's cards
        const userCardsQuery = query(collection(firestore, "cards"), where("userId", "==", user.uid));
        const userCardsSnapshot = await getDocs(userCardsQuery);
        userCardsSnapshot.forEach(cardDoc => {
            const card = cardDoc.data();
            const option = document.createElement('option');
            option.value = cardDoc.id;
            option.textContent = `Карта **** ${card.cardNumber.slice(-4)} (Баланс: ${card.balance} МР)`;
            fromCardSelect.appendChild(option);
        });

        // Load other users' cards
        const allCardsQuery = query(collection(firestore, "cards"));
        const allCardsSnapshot = await getDocs(allCardsQuery);
        
        for (const cardDoc of allCardsSnapshot.docs) {
            const card = cardDoc.data();
            if (card.userId !== user.uid) {
                const userDoc = await getDoc(doc(firestore, "users", card.userId));
                const recipientName = userDoc.exists() ? userDoc.data().displayName : "Неизвестный пользователь";
                
                const option = document.createElement('option');
                option.value = cardDoc.id;
                option.textContent = `${recipientName} - Карта **** ${card.cardNumber.slice(-4)}`;
                toCardSelect.appendChild(option);
            }
        };

        transferButton.addEventListener('click', async () => {
            const fromCardId = fromCardSelect.value;
            const toCardId = toCardSelect.value;
            const amount = parseFloat(amountInput.value);

            if (!fromCardId || !toCardId || !amount || amount <= 0) {
                alert('Пожалуйста, заполните все поля корректно.');
                return;
            }

            try {
                await runTransaction(firestore, async (transaction) => {
                    const fromCardRef = doc(firestore, "cards", fromCardId);
                    const toCardRef = doc(firestore, "cards", toCardId);

                    const fromCardSnap = await transaction.get(fromCardRef);
                    const toCardSnap = await transaction.get(toCardRef);

                    if (!fromCardSnap.exists() || !toCardSnap.exists()) {
                        throw "Одна из карт не найдена.";
                    }
                    if (fromCardSnap.data().balance < amount) {
                        throw "Недостаточно средств на карте.";
                    }

                    const newFromBalance = fromCardSnap.data().balance - amount;
                    const newToBalance = toCardSnap.data().balance + amount;

                    transaction.update(fromCardRef, { balance: newFromBalance });
                    transaction.update(toCardRef, { balance: newToBalance });

                    const timestamp = new Date();

                    // Log transaction for the sender
                    const senderTransactionRef = doc(collection(firestore, "transactions"));
                    transaction.set(senderTransactionRef, {
                        userId: user.uid,
                        type: 'transfer_out',
                        fromCard: fromCardSnap.data().cardNumber,
                        toCard: toCardSnap.data().cardNumber,
                        amount: amount,
                        timestamp: timestamp
                    });

                    // Log transaction for the receiver
                    const receiverTransactionRef = doc(collection(firestore, "transactions"));
                    transaction.set(receiverTransactionRef, {
                        userId: toCardSnap.data().userId,
                        type: 'transfer_in',
                        fromCard: fromCardSnap.data().cardNumber,
                        toCard: toCardSnap.data().cardNumber,
                        amount: amount,
                        timestamp: timestamp
                    });
                });

                alert('Перевод выполнен успешно!');
                window.location.href = '/dashboard.html';
            } catch (error) {
                console.error("Transaction failed: ", error);
                alert(`Ошибка при переводе: ${error}`);
            }
        });

    } else {
        window.location.href = '/auth/auth.html';
    }
});