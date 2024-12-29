const db = require('../config/db');

const Payments = {
    tableName: 'payment',
    columns: {
        id: 'id',
        order_id: 'order_id',
        customer_id: 'customer_id',
        shipping_address: 'shipping_address',
        carrier_id: 'carrier_id',
        created_at: 'created_at',
        updated_at: 'updated_at',
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

    getPayment: async (user_id) => {
        const result = await db.any(
            `SELECT 
                p.carrier_id,
                p.shipping_address,
                o.product_name,
                o.price,
                o.quantity,
                o.order_id
            FROM 
                payment p
            JOIN 
                order_details o
            ON 
                p.order_id = o.order_id
            WHERE 
                p.customer_id = $1`,
            [user_id]
        );
        return result;
    },
};

module.exports = Payments;
