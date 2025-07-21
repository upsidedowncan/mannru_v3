import { auth, firestore } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, onSnapshot, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDocRef = doc(firestore, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().disabled) {
                    console.log("User is disabled, signing out.");
                    await signOut(auth);
                    // Optional: Redirect to a specific page after sign-out
                    // window.location.href = '/disabled.html';
                    return; // Stop further processing for disabled user
                }
            } catch (error) {
                console.error("Error checking user disabled status:", error);
            }

            // If user is not disabled, proceed with original functionality
            listenForAdminMessages(user.uid);
        }
    });
});

function listenForAdminMessages(uid) {
    const messageDocRef = doc(firestore, "messages", uid);

    onSnapshot(messageDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            showAdminMessageDialog(data.message, messageDocRef);
        }
    });
}

function showAdminMessageDialog(message, messageDocRef) {
    // Ensure dialog doesn't already exist
    if (document.getElementById('admin-message-dialog')) {
        return;
    }

    const dialogHTML = `
        <div id="admin-message-dialog" class="dialog-overlay" style="display: flex;">
            <div class="dialog">
                <div class="dialog-header">
                    <h3 class="dialog-title">Сообщение от администрации</h3>
                </div>
                <div class="dialog-content">
                    <p>${message}</p>
                </div>
                <div class="dialog-footer">
                    <button id="close-admin-message" class="btn btn-primary">Понятно</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    const closeButton = document.getElementById('close-admin-message');
    closeButton.addEventListener('click', async () => {
        try {
            // Delete the message from firestore so it doesn't reappear
            await deleteDoc(messageDocRef);
        } catch (error) {
            console.error("Error deleting admin message:", error);
        }
        const dialog = document.getElementById('admin-message-dialog');
        if(dialog) {
            dialog.remove();
        }
    });
}
