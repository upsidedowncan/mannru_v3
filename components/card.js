/**
 * Creates and returns a credit card HTML element with a compact design.
 * @param {object} cardData - The data for the card (cardNumber, expirationDate, color, balance).
 * @param {object} user - The user object (displayName, email).
 * @returns {HTMLElement} The card element.
 */
export function createCardComponent(cardData, user) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card-component';
    cardElement.style.background = cardData.color || 'linear-gradient(120deg, #2c3e50, #4ca1af)';

    const balanceFormatted = cardData.balance.toLocaleString('ru-RU');

    cardElement.innerHTML = `
        <div class="card-component-header">
            <span class="bank-name">Банк Маннру</span>
            <span class="card-balance">${balanceFormatted} МР</span>
        </div>
        <div class="card-component-number">${cardData.cardNumber}</div>
        <div class="card-component-footer">
            <span class="card-holder-name">${user.displayName || user.email}</span>
            <span class="card-expiry-date">${cardData.expirationDate}</span>
        </div>
    `;

    return cardElement;
} 