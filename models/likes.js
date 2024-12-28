const db = require('../config/db');
const Comment = require('../models/comments');

const Likes = {
    tableName: 'likes',
    columns: {
        like_id: 'id',
        customer_id: 'customer_id',
        comment_id: 'comment_id',
    },

    postLike: async (customer_id, comment_id) => {
        const existingLike = await db.oneOrNone(
            `SELECT like_id FROM likes WHERE customer_id = $1 AND comment_id = $2`,
            [customer_id, comment_id]
        );

        if (existingLike) {
            await db.none(`DELETE FROM likes WHERE like_id = $1`, [
                existingLike.like_id,
            ]);
            return { message: 'Like removed', liked: false };
        } else {
            const newLike = await db.one(
                `INSERT INTO likes (customer_id, comment_id) VALUES ($1, $2) RETURNING *`,
                [customer_id, comment_id]
            );
            return { message: 'Like added', liked: true, like: newLike };
        }
    },

    deleteLike: async (customer_id, comment_id) => {
        await db.none(
            `DELETE FROM ${Likes.tableName} WHERE customer_id = $1 AND comment_id = $2`,
            [customer_id, comment_id]
        );
    },

    countLikes: async (comment_id) => {
        const result = await db.manyOrNone(
            `SELECT COUNT(*) AS like_count FROM ${Likes.tableName} WHERE comment_id = $1`,
            [comment_id]
        );
        return result;
    },

    getMaxLikedCommentForProduct: async (product_id) => {

            const result = await db.any(
            `
            SELECT 
                C.comment_id, 
                C.comment_text,
                COALESCE(COUNT(L.like_id), 0) AS like_count
            FROM comments C
            LEFT JOIN likes L 
                ON C.comment_id = L.comment_id
            WHERE C.product_id = $1
            GROUP BY C.comment_id, C.comment_text
            ORDER BY like_count DESC
            LIMIT 1;
            `,
            [product_id]
        );
        return result.length > 0 ? result[0] : null;
    },
};
module.exports = Likes;
