import { auth, firestore } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAILS = ['utoplennik69pc@gmail.com', 'abusalamovmuhammad9@gmail.com', 'd4rkh4x0rz.team@gmail.com'];

const adminGate = document.getElementById('admin-gate');
const authGateMessage = document.getElementById('auth-gate-message');
const treeView = document.getElementById('tree-view');
const jsonContent = document.getElementById('json-content');
const saveButton = document.getElementById('save-button');

const ROOT_COLLECTIONS = ['users', 'cards', 'items', 'chats', 'transactions'];

let selectedDocRef = null;

onAuthStateChanged(auth, async (user) => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
        adminGate.style.display = 'block';
        authGateMessage.style.display = 'none';
        
        treeView.innerHTML = ''; // Clear previous tree
        ROOT_COLLECTIONS.forEach(collectionName => {
            const collectionRef = collection(firestore, collectionName);
            // The render function expects a Firestore object with an ID, the ref itself works perfectly
            renderTreeItem(collectionRef, treeView, 0);
        });

    } else {
        adminGate.style.display = 'none';
        authGateMessage.style.display = 'block';
    }
});

async function renderTreeItem(item, parentElement, level) {
    const itemElement = document.createElement('div');
    itemElement.className = 'tree-item';
    // For a collection/doc ref, item.id is the name. For a snapshot, it's also item.id
    itemElement.textContent = item.id;
    itemElement.style.paddingLeft = `${level * 1.5}rem`;

    // We need a wrapper to insert children into, if this is a collection
    const container = document.createElement('div');
    container.appendChild(itemElement);
    parentElement.appendChild(container);

    const isCollection = item.path.split('/').length % 2 !== 0;

    itemElement.addEventListener('click', async (e) => {
        e.stopPropagation();

        if (isCollection) {
            const childrenContainer = container.querySelector('.children');
            if (childrenContainer) {
                childrenContainer.remove(); // Collapse
                return;
            }

            const newChildrenContainer = document.createElement('div');
            newChildrenContainer.className = 'children';

            // For a CollectionReference, 'item' is the reference itself
            const docs = await getDocs(item);
            docs.forEach(doc => {
                // For a Document, we pass its reference to the next level
                renderTreeItem(doc.ref, newChildrenContainer, level + 1);
            });
            container.appendChild(newChildrenContainer);
        } else { // It's a document reference
            if (selectedDocRef && selectedDocRef.path === item.path) return;
            
            document.querySelectorAll('.tree-item.selected').forEach(el => el.classList.remove('selected'));
            itemElement.classList.add('selected');

            // For a DocumentReference, 'item' is the reference
            const docSnap = await getDoc(item);
            if (docSnap.exists()) {
                jsonContent.value = JSON.stringify(docSnap.data(), null, 2);
                saveButton.style.display = 'block';
                selectedDocRef = item;
            }
        }
    });
}

saveButton.addEventListener('click', async () => {
    if (!selectedDocRef) return;
    try {
        const data = JSON.parse(jsonContent.value);
        await setDoc(selectedDocRef, data);
        alert('Документ успешно сохранен!');
    } catch (error) {
        alert(`Ошибка при сохранении: ${error.message}`);
        console.error("Error saving document:", error);
    }
});