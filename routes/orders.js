const isAuth = require("../middlewares/isAuth");
const {
  createOrder,
  addProductToCard,
  updateCart,
  deleteProductFromCart,
  getOrderDetails,
  deleteOrder,
} = require("../controllers/orders");
const express = require("express");
const router = express.Router();

//SIPARIS OLUSTUR
router.post("/createOrder", isAuth, createOrder);

//URUN EKLEME
router.post("/addProduct/:orderId/:productId", isAuth, addProductToCard);

//SEPETI GUNCELLEME
// router.post("/updateCart/:orderId/:productId", isAuth, updateCart);

//URUNU SEPETTEN SILME
router.delete(
  "/deleteProduct/:orderId/:productId",
  isAuth,
  deleteProductFromCart
);

//SEPET DETAYINI GORME
router.get("/orderDetails/:orderId", isAuth, getOrderDetails);

//SIPARIS SILME
router.delete("/deleteOrder/:orderId", isAuth, deleteOrder);

module.exports = router;
