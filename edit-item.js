import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const editItemForm = document.getElementById('edit-item-form');
const itemNameInput = document.getElementById('itemName');
const itemDescriptionInput = document.getElementById('itemDescription');
const itemPriceInput = document.getElementById('itemPrice');
const itemImageInput = document.getElementById('itemImage');
const currentItemImage = document.getElementById('current-item-image');
const deleteItemButton = document.getElementById('delete-item-button');

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');
let itemRef;

onAuthStateChanged(auth, async (user) => {
    if (user && itemId) {
        itemRef = doc(firestore, "items", itemId);
        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists() && itemSnap.data().sellerId === user.uid) {
            const itemData = itemSnap.data();
            itemNameInput.value = itemData.name;
            itemDescriptionInput.value = itemData.description;
            itemPriceInput.value = itemData.price;
            currentItemImage.src = itemData.image;
            currentItemImage.style.display = 'block';
        } else {
            window.location.href = '/my-items.html';
        }
    } else {
        window.location.href = '/auth/auth.html';
    }
});

editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedData = {
        name: itemNameInput.value,
        description: itemDescriptionInput.value,
        price: parseFloat(itemPriceInput.value)
    };

    const newImageFile = itemImageInput.files[0];
    if (newImageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(newImageFile);
        reader.onloadend = async () => {
            updatedData.image = reader.result;
            await updateDoc(itemRef, updatedData);
            window.location.href = '/my-items.html';
        };
    } else {
        await updateDoc(itemRef, updatedData);
        window.location.href = '/my-items.html';
    }
});

deleteItemButton.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        await deleteDoc(itemRef);
        window.location.href = '/my-items.html';
    }
}); 