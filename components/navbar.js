const navbarHTML = `
<nav class="navbar">
    <a href="/" class="navbar-brand">Банк Маннру</a>
    <div id="debt-reminder" class="debt-reminder" style="display: none;"></div>
    <button class="navbar-toggler" id="navbarToggler">
        <span class="navbar-toggler-icon"></span>
    </button>
    <ul class="navbar-nav" id="navbarNav">
        <li class="nav-item"><a href="/" class="nav-link">Главная</a></li>
        <li class="nav-item"><a href="/market.html" class="nav-link">Маркет</a></li>
        <li class="nav-item"><a href="/my-items.html" class="nav-link">Мои товары</a></li>
        <li class="nav-item"><a href="/my-chats.html" class="nav-link">Мои чаты</a></li>
        <li class="nav-item" id="admin-link" style="display: none;"><a href="/admin.html" class="nav-link">Админ</a></li>
        <li class="nav-item"><a href="/auth/auth.html" id="auth-button" class="nav-link">Войти</a></li>
        <li class="nav-item" id="logout-button" style="display: none;"><a href="#" class="nav-link">Выйти</a></li>
    </ul>
</nav>
`;

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    if (header) {
        header.innerHTML = navbarHTML;

        const navbarToggler = document.getElementById('navbarToggler');
        const navbarNav = document.getElementById('navbarNav');

        if (navbarToggler && navbarNav) {
            navbarToggler.addEventListener('click', () => {
                navbarNav.classList.toggle('show');
            });
        }
    }
}); 