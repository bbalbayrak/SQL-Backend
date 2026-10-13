const formatPrice = (amount, currency = 'TRY') => {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
        throw new TypeError('amount must be a number');
    }
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
};

module.exports = { formatPrice };
