export function showNotification(title, body) {
    const container = document.createElement('div');
    container.className = 'notification-container';

    const notification = document.createElement('div');
    notification.className = 'notification';

    const titleElement = document.createElement('div');
    titleElement.className = 'notification-title';
    titleElement.textContent = title;

    const bodyElement = document.createElement('div');
    bodyElement.className = 'notification-body';
    bodyElement.textContent = body;

    notification.appendChild(titleElement);
    notification.appendChild(bodyElement);
    container.appendChild(notification);
    document.body.appendChild(container);

    // Trigger the slide-in animation
    setTimeout(() => {
        container.classList.add('show');
    }, 100);

    // Hide the notification after 5 seconds
    setTimeout(() => {
        container.classList.remove('show');
        // Remove the element from the DOM after the slide-out animation completes
        setTimeout(() => {
            container.remove();
        }, 600);
    }, 5000);
}