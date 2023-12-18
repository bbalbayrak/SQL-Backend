const db = require("../config/db");

const Comments = {
  tableName: "comments",
  columns: {
    id: "id",
    customer_id: "customer_id",
    comment_text: "comment_text",
    product_id: "product_id",
  },

  findProductComments: async (product_id) => {
    const result = await db.manyOrNone(
      "SELECT * FROM ${table:name} WHERE product_id = ${product_id}",
      {
        table: Comments.tableName,
        product_id,
      }
    );
    return result;
  },

  findCustomerComments: async (customer_id) => {
    const result = await db.manyOrNone(
      "SELECT * FROM ${table:name} WHERE customer_id = ${customer_id}",
      {
        table: Comments.tableName,
        customer_id,
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
