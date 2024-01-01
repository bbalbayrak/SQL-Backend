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

  addProduct: async (order_id, product_id, quantity) => {
    try {
      // İlgili ürünün fiyatını, indirim kodunu ve ismini al
      const productInfo = await db.one(
        `SELECT p.price, dc.discount_rate, p.product_name
         FROM Products p
         LEFT JOIN DiscountCodes dc ON p.code_id = dc.code_id
         WHERE p.product_id = $1;`,
        [product_id]
      );

      let { price, discount_rate, product_name } = productInfo;

      // İndirim oranını kullanarak fiyatı güncelle
      if (discount_rate) {
        price = price * (1 - discount_rate);
      }

      // Geri kalan işlemler
      const result = await db.one(
        `INSERT INTO ${OrderDetails.tableName} (order_id, product_id, quantity, price, product_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (order_id, product_id)
        DO UPDATE SET
            quantity = ${OrderDetails.tableName}.quantity + $3,
            price = ${OrderDetails.tableName}.price + $4
        RETURNING *;
        `,
        [order_id, product_id, quantity, price, product_name]
      );

      // result içerisinde eklenen veya güncellenen ürün bilgileri bulunabilir
      return result;
    } catch (error) {
      console.error(error);
      // Hata durumunda uygun bir işlem yapabilirsiniz
      throw error;
    }
  },

  // addProduct: async (order_id, product_id, quantity, price) => {
  //   // İndirim kodunu al
  //   const discountCode = await db.oneOrNone(
  //     `SELECT code_id
  //   FROM Products
  //   WHERE product_id = $1;`,
  //     [product_id]
  //   );

  //   // İndirim kodu varsa
  //   if (discountCode) {
  //     try {
  //       // İndirim oranını al
  //       const discountRate = await db.one(
  //         `SELECT discount_rate
  //       FROM DiscountCodes
  //       WHERE code_id = $1;`,
  //         [discountCode.code_id]
  //       );

  //       // İndirim oranını kullanarak fiyatı güncelle
  //       if (discountRate) {
  //         price = price * (1 - discountRate.discount_rate);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }
  //   // Geri kalan işlemler
  //   const result = await db.one(
  //     `INSERT INTO ${OrderDetails.tableName} (order_id, product_id, quantity, price)
  //     VALUES ($1, $2, $3, $4)
  //     ON CONFLICT (order_id, product_id)
  //     DO UPDATE SET
  //         quantity = ${OrderDetails.tableName}.quantity + $3,
  //         price = ${OrderDetails.tableName}.price + $4
  //     RETURNING *;`,
  //     [order_id, product_id, quantity, price]
  //   );

  //   return result;
  // },

  //   addProduct: async (order_id, product_id, quantity, price) => {
  //     const result = await db.one(
  //       `INSERT INTO ${OrderDetails.tableName} (order_id, product_id, quantity, price)
  //       VALUES ($1, $2, $3, $4)
  //       ON CONFLICT (order_id, product_id)
  //       DO UPDATE SET
  //         quantity = ${OrderDetails.tableName}.quantity + $3,
  //         price = ${OrderDetails.tableName}.price + $4
  //       RETURNING *;
  //       `,
  //       [order_id, product_id, quantity, price]
  //     );
  //     return result;
  //   },

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
    const result = await db.oneOrNone(
      `
      UPDATE ${OrderDetails.tableName}
      SET quantity = quantity - 1
      WHERE product_id = $1 AND quantity > 1
      RETURNING *
      `,
      [product_id]
    );

    if (!result) {
      // Eğer ürünün quantity değeri 1 ise, tamamen sil
      await db.oneOrNone(
        `
        DELETE FROM ${OrderDetails.tableName}
        WHERE product_id = $1 AND quantity = 1
        RETURNING *
        `,
        [product_id]
      );
    }

    return result;
  },
};

module.exports = OrderDetails;
