import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const chatsListContainer = document.getElementById('chats-list-container');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const chatsQuery = query(collection(firestore, 'chats'), where('participants', 'array-contains', user.uid));
        const querySnapshot = await getDocs(chatsQuery);

        for (const chatDoc of querySnapshot.docs) {
            const chatData = chatDoc.data();
            
            // Get item details
            const itemRef = doc(firestore, 'items', chatData.itemId);
            const itemSnap = await getDoc(itemRef);
            const itemData = itemSnap.exists() ? itemSnap.data() : { name: 'Удаленный товар' };

            // Get other user's details
            const otherUserId = chatData.participants.find(id => id !== user.uid);
            let otherUserName = 'Неизвестный пользователь';
            if (otherUserId) {
                // In a real app, you would fetch the user's profile from a 'users' collection
                // For now, we'll just show the ID or a placeholder.
                otherUserName = 'Пользователь ' + otherUserId.substring(0, 6);
            }

            const chatElement = document.createElement('a');
            chatElement.href = `/chat.html?id=${chatDoc.id}`;
            chatElement.className = 'list-group-item list-group-item-action';
            chatElement.innerHTML = `
                <h5>Чат по товару: ${itemData.name}</h5>
                <p>Собеседник: ${otherUserName}</p>
            `;
            chatsListContainer.appendChild(chatElement);
        }
    } else {
        window.location.href = '/auth/auth.html';
    }
}); 