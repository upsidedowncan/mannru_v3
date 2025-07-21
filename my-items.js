import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const myItemsContainer = document.getElementById('my-items-container');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const q = query(collection(firestore, "items"), where("sellerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const itemElement = document.createElement('div');
            itemElement.className = 'item-card';

            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="item-content">
                    <h3 class="item-title">${item.name}</h3>
                    <p class="item-price">${item.price} МР</p>
                    <a href="/edit-item.html?id=${doc.id}" class="btn">Редактировать</a>
                </div>
            `;
            myItemsContainer.appendChild(itemElement);
        });
    } else {
        window.location.href = '/auth/auth.html';
    }
}); 