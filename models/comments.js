const db = require('../config/db');
const Customers = require('./customer.js');

const Comments = {
    tableName: 'comments',
    columns: {
        id: 'id',
        customer_id: 'customer_id',
        comment_text: 'comment_text',
        product_id: 'product_id',
    },

    findProductComments: async (product_id) => {
        const result = await db.manyOrNone(
            `
          SELECT 
            c.comment_id AS comment_id,
            c.comment_text,
            c.product_id,
            cu.customer_id AS customer_id,
            cu.name AS customer_name,
            cu.email AS customer_email,
            cu.phone AS customer_phone,
            COUNT(l.like_id) AS like_count
          FROM comments c
          JOIN customers cu
            ON c.customer_id = cu.customer_id
          LEFT JOIN likes l
            ON c.comment_id = l.comment_id
          WHERE c.product_id = $1
          GROUP BY c.comment_id, cu.customer_id, cu.name, cu.email, cu.phone
          `,
            [product_id]
        );
        return result;
    },

    findCustomerComments: async (customer_id) => {
        const result = await db.manyOrNone(
            `
            SELECT 
                c.comment_text, 
                p.product_name
            FROM 
                comments c
            INNER JOIN 
                products p 
            ON 
                c.product_id = p.product_id
            WHERE 
                c.customer_id = $1
            `,
            [customer_id]
        );
        return result;
    },

    findComment: async (comment_id) => {
        const result = await db.oneOrNone(
            'SELECT * FROM ${table:name} WHERE comment_id = ${comment_id}',
            {
                table: Comments.tableName,
                comment_id,
            }
        );
        return result;
    },

    createComment: async (customer_id, comment_text, product_id) => {
        const result = await db.one(
            `INSERT INTO ${Comments.tableName} (customer_id,comment_text,product_id) VALUES ($1,$2,$3) RETURNING *`,
            [customer_id, comment_text, product_id]
        );
        return result;
    },
};

module.exports = Comments;
