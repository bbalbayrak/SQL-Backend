const Product = require("../models/product");
const {
  getAllProducts,
  productComments,
  productDetails,
  createProductComment,
  discountedProducts,
} = require("../controllers/product");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const express = require("express");
const isAuth = require("../middlewares/isAuth");
const router = express.Router();

//BUTUN URUNLERI KATEGORIYE GORE LISTELEME
router.get("/products/:categoryId", isAuth, getAllProducts);

//URUN DETAYLARINI GORME
router.get("/product/:productId", isAuth, productDetails);

//URUN YORUMLARI
router.get("/productComments/:productId", isAuth, productComments);

//URUN YORUMU OLUSTURMA
router.post("/createProductComment/:productId", isAuth, createProductComment);

//INDIRIMI OLAN URUNLERI GETIRME
router.get("/discountProducts", isAuth, discountedProducts);

//URUN OLUSTURMA
router.post(
  "/createProduct",
  upload.single("product_image"),
  async (req, res, next) => {
    const { product_name, price, category_id, code_id } = req.body;
    const product_image = req.file.path; // Dosyanın yolu (multer ile otomatik olarak eklenir)

    try {
      const product = await Product.create(
        product_name,
        price,
        product_image,
        category_id,
        code_id
      );
      return res
        .status(201)
        .json({ message: "Product Successfully created!", product: product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
