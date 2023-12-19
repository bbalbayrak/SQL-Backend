const db = require("../config/db");
const Comment = require("../models/comments");

const Likes = {
  tableName: "likes",
  columns: {
    like_id: "id",
    customer_id: "customer_id",
    comment_id: "comment_id",
  },

  postLike: async (customer_id, comment_id) => {
    const result = await db.one(
      `INSERT INTO ${Likes.tableName} (customer_id,comment_id) VALUES ($1,$2) RETURNING *`,
      [customer_id, comment_id]
    );
    return result;
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

  getMaxLikedComment: async () => {
    const result = await db.oneOrNone(
      `SELECT C.*, COUNT(L.like_id) AS like_count
            FROM ${Comment.tableName} C
            LEFT JOIN ${Likes.tableName} L ON C.comment_id = L.comment_id
            GROUP BY C.comment_id
            ORDER BY like_count DESC
            LIMIT 1;`
    );
    return result;
  },
};
module.exports = Likes;
