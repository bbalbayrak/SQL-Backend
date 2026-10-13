const TURKISH_MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

const slugify = (text) => {
    return String(text)
        .toLowerCase()
        .replace(/[çğıöşü]/g, (ch) => TURKISH_MAP[ch])
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

module.exports = { slugify };
