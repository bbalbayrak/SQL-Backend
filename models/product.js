const db = require('../config/db');

const Product = {
    tableName: 'products',
    columns: {
        id: 'id',
        product_name: 'product_name',
        price: 'price',
        product_image: 'product_image',
        category_id: 'category_id',
        code_id: 'code_id',
    },

    create: async (
        product_name,
        price,
        product_image,
        category_id,
        code_id
    ) => {
        const result = await db.one(
            `INSERT INTO ${Product.tableName} (product_name,price,product_image,category_id,code_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [product_name, price, product_image, category_id, code_id]
        );
        return result;
    },

    getProductDetails: async (id) => {
        const result = await db.oneOrNone(
            `
          SELECT 
            p.product_id AS product_id,
            p.product_name AS product_name,
            p.price AS product_price,
            p.product_image AS product_image,
            p.star AS product_star,
            c.category_id AS category_id,
            c.category_name AS category_name,
            d.code_id AS discount_code_id,
            d.code AS discount_code,
            d.discount_rate AS discount_rate
          FROM products p
          LEFT JOIN categories c
          ON p.category_id = c.category_id
          LEFT JOIN discountcodes d
          ON p.code_id = d.code_id
          WHERE p.product_id = $1
          `,
            [id] 
        );
        return result;
    },

    findByCategories: async (category_id) => {
        const result = await db.manyOrNone(
            'SELECT * FROM ${table:name} WHERE category_id = ${category_id}',
            {
                table: Product.tableName,
                category_id,
            }
        );
        return result;
    },

    findByDiscountedProducts: async () => {
        const result = await db.manyOrNone(
            `SELECT * FROM ${Product.tableName}
        WHERE code_id IS NOT NULL;`
        );
        return result;
    },

    getProducts: async () => {
        const result = await db.manyOrNone(
            `SELECT * FROM ${Product.tableName};`
        );
        return result;
    },
};

module.exports = Product;
