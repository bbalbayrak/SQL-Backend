const db = require("../config/db");

const oldOrders = {
  tableName: "oldOrders",
  columns: {
    id: "id",
    order_id: "order_id",
    customer_id: "customer_id",
    order_detail_id: "order_detail_id",
  },

  findAllOldOrdersByCustomerId: async (customerId) => {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const result = await db.manyOrNone(
      `SELECT * FROM ${oldOrders.tableName} WHERE customer_id = $1`,
      [customerId]
    );

    return result;
  },

  getOldOrderDetails: async (orderId) => {
    const result = await db.manyOrNone(
      `SELECT * FROM old_order_details WHERE old_order_id = $1`,
      [orderId]
    );
    return result;
  },
};

module.exports = oldOrders;
