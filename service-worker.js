self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: 'path/to/icon.png', // Optional: Add an icon
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
