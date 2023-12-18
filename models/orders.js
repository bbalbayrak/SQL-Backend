const db = require("../config/db");

const Orders = {
  tableName: "orders",
  columns: {
    id: "id",
    customer_id: "customer_id",
  },

  findOrderExist: async (order_id) => {
    const result = await db.oneOrNone(
      "SELECT * FROM ${table:name} WHERE order_id = ${order_id}",
      { table: Orders.tableName, order_id }
    );
    return result;
  },

  findByOrders: async (customer_id) => {
    const result = await db.oneOrNone(
      "SELECT * FROM ${table:name} WHERE customer_id = ${customer_id}",
      {
        table: Orders.tableName,
        customer_id,
      }
    );
    return result;
  },

  createOrder: async (customer_id) => {
    const result = await db.one(
      `INSERT INTO ${Orders.tableName} (customer_id) VALUES ($1) RETURNING *`,
      [customer_id]
    );
    return result;
  },

  deleteOrder: async (id) => {
    await db.none(`DELETE FROM ${Orders.tableName} WHERE order_id = $1`, [id]);
  },
};

module.exports = Orders;
