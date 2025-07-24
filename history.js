import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const transactionsContainer = document.getElementById('transactions-container');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const transactionsQuery = query(
            collection(firestore, "transactions"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(transactionsQuery);

        if (querySnapshot.empty) {
            transactionsContainer.innerHTML = '<p>У вас пока нет транзакций.</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const transaction = doc.data();
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            
            const date = new Date(transaction.timestamp.seconds * 1000).toLocaleString('ru-RU');
            
            let icon, description, amountClass, amount;

            switch (transaction.type) {
                case 'purchase':
                    icon = '<span class="transaction-icon arrow-down">↓</span>';
                    description = `Покупка товара: ${transaction.itemName}`;
                    amount = `- ${transaction.amount} МР`;
                    amountClass = 'arrow-down';
                    break;
                case 'sale':
                    icon = '<span class="transaction-icon arrow-up">↑</span>';
                    description = `Продажа товара: ${transaction.itemName}`;
                    amount = `+ ${transaction.amount} МР`;
                    amountClass = 'arrow-up';
                    break;
                case 'transfer_out':
                    icon = '<span class="transaction-icon arrow-down">↓</span>';
                    description = `Перевод на карту ****${transaction.toCard.slice(-4)}`;
                    amount = `- ${transaction.amount} МР`;
                    amountClass = 'arrow-down';
                    break;
                case 'transfer_in':
                    icon = '<span class="transaction-icon arrow-up">↑</span>';
                    description = `Перевод с карты ****${transaction.fromCard.slice(-4)}`;
                    amount = `+ ${transaction.amount} МР`;
                    amountClass = 'arrow-up';
                    break;
            }

            transactionElement.innerHTML = `
                ${icon}
                <div class="transaction-details">
                    <p class="transaction-description">${description}</p>
                    <p class="transaction-date">${date}</p>
                </div>
                <span class="transaction-amount ${amountClass}">${amount}</span>
            `;
            transactionsContainer.appendChild(transactionElement);
        });

    } else {
        window.location.href = '/auth/auth.html';
    }
});