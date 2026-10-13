const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value) => {
    return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value.trim());
};

module.exports = { isValidEmail };
