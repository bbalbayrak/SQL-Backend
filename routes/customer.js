const {
  signup,
  login,
  changePassword,
  customerComments,
  postLike,
  deleteLike,
  filteredMaxLikedComment,
  countLikes,
} = require("../controllers/customer");
const isAuth = require("../middlewares/isAuth");
const express = require("express");
const router = express.Router();

//KAYIT OLMA
router.post("/signUp", signup);

//GIRIS YAPMA
router.post("/login", login);

//SIFRE DEGISTIRME
router.put("/changePasswd", changePassword);

//KULLANICI YORUMLARINI GORME
router.get("/customerComments", isAuth, customerComments);

//YORUMU BEGENME
router.post("/like/:commentId", isAuth, postLike);

//YORUMU BEGENMEDEN CIKMA
router.delete("/deleteLike/:commentId", isAuth, deleteLike);

//MAX BEGENI ALAN YORUMU GETIRME
router.get("/maxLikedComment", isAuth, filteredMaxLikedComment);

//YORUMDAKI BEGENI SAYISINI GORME
router.get("/countLikes/:commentId", isAuth, countLikes);

module.exports = router;
