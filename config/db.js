const pgp = require('pg-promise')();
require('dotenv').config();

const connection = {
    host: 'localhost',
    port: '5432',
    database: 'deneme2',
    user: 'postgres',
    password: process.env.PASSWORD
};

const db = pgp(connection);

module.exports = db;
