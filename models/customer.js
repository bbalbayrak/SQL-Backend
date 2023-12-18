const db = require("../config/db");

const Customer = {
  tableName: "customers",
  columns: {
    id: "id",
    name: "name",
    email: "email",
    password: "password",
    phone: "phone",
  },

  create: async (name, email, password, phone) => {
    const result = await db.one(
      `INSERT INTO ${Customer.tableName} (name,email,password,phone) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, email, password, phone]
    );
    return result;
  },

  findByEmail: async (email) => {
    const result = await db.oneOrNone(
      "SELECT * FROM ${table:name} WHERE email = ${email}",
      {
        table: Customer.tableName,
        email,
      }
    );
    return result;
  },

  changePassword: async (email, currentPassword, newPassword) => {
    const result = await db.oneOrNone(
      `UPDATE ${Customer.tableName}
       SET password = $1
       WHERE email = $2 AND password = $3
       RETURNING *`,
      [newPassword, email, currentPassword]
    );
    return result;
  },
};
module.exports = Customer;
