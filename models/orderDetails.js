const db = require("../config/db");

const OrderDetails = {
  tableName: "order_details",
  columns: {
    id: "id",
    order_id: "order_id",
    product_id: "product_id",
    price: "price",
    quantity: "quantity",
  },

  findOrderDetails: async (order_id) => {
    const result = await db.manyOrNone(
      "SELECT * FROM ${table:name} WHERE order_id = ${order_id}",
      {
        table: OrderDetails.tableName,
        order_id,
      }
    );
    return result;
  },

  addProduct: async (order_id, product_id, quantity, price) => {
    const result = await db.one(
      `INSERT INTO ${OrderDetails.tableName} (order_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (order_id, product_id)
      DO UPDATE SET
        quantity = ${OrderDetails.tableName}.quantity + $3,
        price = ${OrderDetails.tableName}.price + $4
      RETURNING *;
      `,
      [order_id, product_id, quantity, price]
    );
    return result;
  },

  updateCart: async (order_id, product_id, quantity, price) => {
    const existingOrderDetail = await db.oneOrNone(
      `SELECT * FROM ${OrderDetails.tableName} WHERE order_id = $1 AND product_id = $2`,
      [order_id, product_id]
    );

    if (existingOrderDetail) {
      // Eğer ürün sepette varsa, adeti arttır
      await db.none(
        `UPDATE ${OrderDetails.tableName} 
        SET quantity = quantity + $1, 
        price = price * quantity
         WHERE order_id = $2 AND product_id = $3;`,
        [quantity, order_id, product_id]
      );
    } else {
      // Eğer ürün sepette yoksa, yeni bir sipariş detayı oluştur
      await db.none(
        `INSERT INTO ${OrderDetails.tableName} (order_id, product_id, quantity,price) VALUES ($1, $2, $3, $4) RETURNING *`,
        [order_id, product_id, quantity, price]
      );
    }
  },

  deleteOrderDetails: async (id) => {
    await db.none(`DELETE FROM ${OrderDetails.tableName} WHERE order_id = $1`, [
      id,
    ]);
  },

  deleteProductFromCart: async (product_id) => {
    await db.none(
      `DELETE FROM ${OrderDetails.tableName} WHERE product_id = $1`,
      [product_id]
    );
  },
};

module.exports = OrderDetails;
