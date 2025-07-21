import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const checkDebt = async (user) => {
    const debtReminder = document.getElementById('debt-reminder');
    if (!user || !debtReminder) {
        if (debtReminder) debtReminder.style.display = 'none';
        return;
    }

    const cardsRef = collection(firestore, "cards");
    const q = query(cardsRef, where("userId", "==", user.uid));

    try {
        const querySnapshot = await getDocs(q);
        let hasDebt = false;
        let totalDebt = 0;

        querySnapshot.forEach((doc) => {
            const card = doc.data();
            if (card.balance < 0) {
                hasDebt = true;
                totalDebt += card.balance;
            }
        });

        if (hasDebt) {
            debtReminder.textContent = `У вас задолженность: ${Math.abs(totalDebt).toLocaleString('ru-RU')} МР. Пожалуйста, погасите ее.`;
            debtReminder.style.display = 'block';
        } else {
            debtReminder.style.display = 'none';
        }
    } catch (error) {
        console.error("Error checking for debt:", error);
        debtReminder.style.display = 'none';
    }
};

window.checkDebt = checkDebt;

onAuthStateChanged(auth, (user) => {
    if (user) {
        checkDebt(user);
    }
}); 