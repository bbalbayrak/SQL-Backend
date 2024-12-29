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

  confirmOrder: async (id) => {
    try {
      await db.tx(async (t) => {
        // 1. Siparişi al
        const order = await t.oneOrNone(
          `SELECT order_id, customer_id FROM orders WHERE order_id = $1`,
          [id]
        );

        if (!order) {
          throw new Error("Order not found.");
        }

        // 2. Old_orders tablosuna ekle ve dönen değeri al
        const oldOrder = await t.one(
          `INSERT INTO oldorders (order_id, customer_id)
           VALUES ($1, $2)
           RETURNING id, order_id, customer_id`,
          [order.order_id, order.customer_id]
        );

        console.log(
          oldOrder.id, // id burada mevcut olacak
          oldOrder.order_id, // order_id burada mevcut olacak
          oldOrder.customer_id // customer_id burada mevcut olacak
        );

        console.log(`Inserted into oldorders: ${oldOrder.order_id}`);

        // 3. Old_order_details'e veriyi ekle
        await t.none(
          `INSERT INTO old_order_details (old_order_id, product_id, price, quantity)
           SELECT $1, product_id, price, quantity
           FROM order_details
           WHERE order_id = $2`,
          [oldOrder.order_id, order.order_id]
        );

        console.log(
          `Inserted into old_order_details for order_id: ${order.order_id}`
        );

        // 4. Order_details tablosundan veriyi sil
        await t.none(`DELETE FROM order_details WHERE order_id = $1`, [
          order.order_id,
        ]);

        console.log(
          `Deleted from order_details for order_id: ${order.order_id}`
        );

        // 5. Orders tablosundan siparişi sil
        await t.none(`DELETE FROM orders WHERE order_id = $1`, [
          order.order_id,
        ]);

        console.log(`Deleted from orders for order_id: ${order.order_id}`);
      });

      console.log(
        `Order ${id} successfully confirmed and moved to old_orders with details.`
      );
    } catch (error) {
      console.error("Error confirming order:", error.message);
      throw error;
    }
  },
};

module.exports = Orders;
