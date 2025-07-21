import { firestore } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const itemsContainer = document.getElementById('items-container');

async function loadItems() {
    const querySnapshot = await getDocs(collection(firestore, "items"));
    querySnapshot.forEach((doc) => {
        const item = doc.data();
        const itemLink = document.createElement('a');
        itemLink.href = `/item-details.html?id=${doc.id}`;
        itemLink.style.textDecoration = 'none';
        itemLink.style.color = 'inherit';
        
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';

        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-content">
                <h3 class="item-title">${item.name}</h3>
                <p class="item-price">${item.price} МР</p>
            </div>
        `;
        itemLink.appendChild(itemElement);
        itemsContainer.appendChild(itemLink);
    });
}

loadItems(); 