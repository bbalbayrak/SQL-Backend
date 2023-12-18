const db = require("../config/db");

const Product = {
  tableName: "products",
  columns: {
    id: "id",
    product_name: "product_name",
    price: "price",
    product_image: "product_image",
    category_id: "category_id",
  },

  create: async (product_name, price, product_image, category_id) => {
    const result = await db.one(
      `INSERT INTO ${Product.tableName} (product_name,price,product_image,category_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [product_name, price, product_image, category_id]
    );
    return result;
  },

  getProductDetails: async (id) => {
    const result = await db.oneOrNone(
      "SELECT * FROM ${table:name} WHERE product_id = ${id}",
      { table: Product.tableName, id }
    );
    return result;
  },

  findByCategories: async (category_id) => {
    const result = await db.oneOrNone(
      "SELECT * FROM ${table:name} WHERE category_id = ${category_id}",
      {
        table: Product.tableName,
        category_id,
      }
    );
    return result;
  },
};

module.exports = Product;
