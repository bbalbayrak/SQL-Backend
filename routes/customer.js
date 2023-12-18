const { signup, login, changePassword } = require("../controllers/customer");
const express = require("express");
const router = express.Router();

//KAYIT OLMA
router.post("/signUp", signup);

//GIRIS YAPMA
router.post("/login", login);

//SIFRE DEGISTIRME
router.put("/changePasswd", changePassword);

module.exports = router;
