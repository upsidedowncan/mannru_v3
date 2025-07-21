import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const messagesContainer = document.getElementById('messages-container');
const sendMessageForm = document.getElementById('send-message-form');
const messageInput = document.getElementById('message-input');
const chatPageHeader = document.getElementById('chat-page-header');

// Negotiation Dialog elements
const negotiateDialog = document.getElementById('negotiate-dialog');
const currentPriceNegotiate = document.getElementById('current-price-negotiate');
const newPriceInput = document.getElementById('new-price-input');
const negotiateCancelButton = document.getElementById('negotiate-cancel-button');
const negotiateSubmitButton = document.getElementById('negotiate-submit-button');


const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get('id');
let itemId; // Will be set when chat data is loaded

onAuthStateChanged(auth, async (user) => {
    if (user && chatId) {
        const chatRef = doc(firestore, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists() && chatSnap.data().participants.includes(user.uid)) {
            const chatData = chatSnap.data();
            itemId = chatData.itemId; // Set the global itemId
            const itemRef = doc(firestore, 'items', itemId);
            const itemSnap = await getDoc(itemRef);
            const itemData = itemSnap.exists() ? { id: itemSnap.id, ...itemSnap.data() } : null;

            renderChatHeader(itemData, user.uid);
            setupMessageListener(chatRef, user.uid, itemData);
            setupMessageSending(chatRef, user.uid);
            setupActionButtons(itemData, chatRef, user.uid);

        } else {
            window.location.href = '/my-chats.html';
        }
    } else {
        window.location.href = '/auth/auth.html';
    }
});

function renderChatHeader(itemData, currentUserId) {
    if (!itemData) return;

    const isSeller = itemData.sellerId === currentUserId;
    const actionsHTML = isSeller ? '' : `
        <button id="negotiate-price-button" class="btn">Предложить торг</button>
        <button id="confirm-purchase-button" class="btn btn-primary">Подтвердить покупку</button>
    `;

    chatPageHeader.innerHTML = `
        <div class="chat-page-header">
            <div class="item-info">
                <img src="${itemData.image}" alt="${itemData.name}">
                <h4>Чат по товару: ${itemData.name}</h4>
            </div>
            <div class="actions">
                ${actionsHTML}
            </div>
        </div>
    `;
}

function setupMessageListener(chatRef, currentUserId, itemData) {
    const messagesQuery = query(collection(chatRef, 'messages'), orderBy('createdAt', 'desc'));
    onSnapshot(messagesQuery, (snapshot) => {
        messagesContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const message = doc.data();
            
            if (message.type === 'offer') {
                renderOfferMessage(message, doc.id, currentUserId, itemData, chatRef);
            } else {
                renderTextMessage(message, currentUserId);
            }
        });
    });
}

function renderTextMessage(message, currentUserId) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.senderId === currentUserId ? 'sent' : 'received');
    messageElement.textContent = message.text;
    messagesContainer.appendChild(messageElement);
}

function renderOfferMessage(message, messageId, currentUserId, itemData, chatRef) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('offer-message');

    const isSeller = itemData.sellerId === currentUserId;
    const canRespond = isSeller && message.status === 'pending';

    let actionsHTML = '';
    if (canRespond) {
        actionsHTML = `
            <div class="actions">
                <button class="btn btn-primary btn-sm accept-offer" data-message-id="${messageId}">Принять</button>
                <button class="btn btn-sm decline-offer" data-message-id="${messageId}">Отклонить</button>
            </div>
        `;
    }

    let statusText = '';
    if (message.status === 'accepted') statusText = ' (Предложение принято)';
    if (message.status === 'declined') statusText = ' (Предложение отклонено)';

    messageElement.innerHTML = `
        <p><strong>Предложение цены: ${message.offerPrice} МР</strong>${statusText}</p>
        ${actionsHTML}
    `;
    messagesContainer.appendChild(messageElement);
}


function setupMessageSending(chatRef, currentUserId) {
    sendMessageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value;
        if (text.trim() === '') return;

        await addDoc(collection(chatRef, 'messages'), {
            text: text,
            senderId: currentUserId,
            createdAt: serverTimestamp()
        });
        messageInput.value = '';
    });
}

function setupActionButtons(itemData, chatRef, currentUserId) {
    const negotiatePriceButton = document.getElementById('negotiate-price-button');
    const confirmPurchaseButton = document.getElementById('confirm-purchase-button');

    if (negotiatePriceButton) {
        negotiatePriceButton.addEventListener('click', () => {
            currentPriceNegotiate.textContent = itemData.price;
            negotiateDialog.style.display = 'flex';
        });
    }

    if (confirmPurchaseButton) {
        confirmPurchaseButton.addEventListener('click', () => {
            window.location.href = `/item-details.html?id=${itemId}`;
        });
    }

    negotiateCancelButton.addEventListener('click', () => {
        negotiateDialog.style.display = 'none';
    });

    negotiateSubmitButton.addEventListener('click', async () => {
        const newPrice = parseFloat(newPriceInput.value);
        if (isNaN(newPrice) || newPrice <= 0) {
            alert('Пожалуйста, введите корректную цену.');
            return;
        }

        await addDoc(collection(chatRef, 'messages'), {
            type: 'offer',
            offerPrice: newPrice,
            status: 'pending',
            senderId: currentUserId,
            createdAt: serverTimestamp()
        });

        negotiateDialog.style.display = 'none';
        newPriceInput.value = '';
    });
    
    messagesContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const messageId = target.dataset.messageId;
        if (!messageId) return;
        
        const messageRef = doc(chatRef, 'messages', messageId);

        if (target.classList.contains('accept-offer')) {
            const itemRef = doc(firestore, 'items', itemId);
            const messageSnap = await getDoc(messageRef);
            const newPrice = messageSnap.data().offerPrice;
            
            await updateDoc(itemRef, { price: newPrice });
            await updateDoc(messageRef, { status: 'accepted' });
            
            await addDoc(collection(chatRef, 'messages'), {
                text: `Продавец принял ваше предложение. Новая цена: ${newPrice} МР.`,
                senderId: currentUserId,
                createdAt: serverTimestamp()
            });

        } else if (target.classList.contains('decline-offer')) {
            await updateDoc(messageRef, { status: 'declined' });
        }
    });
} 