const db = require("../config/db");

const Payments = {
  tableName: "payment",
  columns: {
    id: "id",
    order_id: "order_id",
    customer_id: "customer_id",
    shipping_address: "shipping_address",
    carrier_id: "carrier_id",
    created_at: "created_at",
    updated_at: "updated_at",
  },

  createPayment: async (
    order_id,
    customer_id,
    shipping_address,
    carrier_id
  ) => {
    const result = await db.one(
      `INSERT INTO ${Payments.tableName} (order_id, customer_id, shipping_address, carrier_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [order_id, customer_id, shipping_address, carrier_id]
    );
    return result;
  },

  getPayment: async (order_id) => {
    const result = await db.oneOrNone(
      `SELECT * FROM ${Payments.tableName} WHERE order_id = $1`,
      [order_id]
    );
    return result;
  },
};

module.exports = Payments;
