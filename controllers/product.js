const Product = require("../models/product");
const Comment = require("../models/comments");

exports.getAllProducts = async (req, res, next) => {
  const categoryId = req.params.categoryId;
  const products = await Product.findByCategories(categoryId);

  if (!products) {
    return res.status(404).json({ message: "Products can not be found !" });
  }

  return res
    .status(200)
    .json({ message: "Products Successfully fetched !", products: products });
};

exports.productDetails = async (req, res, next) => {
  const productId = req.params.productId;
  const product = await Product.getProductDetails(productId);

  if (!product) {
    return res.status(404).json({ message: "Product can not be found !" });
  }

  return res
    .status(200)
    .json({ message: "Product Successfully Fetched !", product: product });
};

exports.productComments = async (req, res, next) => {
  const productId = req.params.productId;

  const productComments = await Comment.findProductComments(productId);

  if (!productComments) {
    return res.status(404).json({ message: "Comments can not be found !" });
  }

  return res
    .status(200)
    .json({ message: "Comments Fetched !", comments: productComments });
};

exports.createProductComment = async (req, res, next) => {
  const productId = req.params.productId;
  const customerId = req.customerId;
  const commentText = req.body.commentText;

  const product = await Product.getProductDetails(productId);

  if (!product) {
    return res.status(404).json({ message: "Product can not be found !" });
  }

  const newComment = await Comment.createComment(
    customerId,
    commentText,
    productId
  );

  return res
    .status(201)
    .json({ message: "Comment Successfully created !", comment: newComment });
};

exports.discountedProducts = async (req, res, next) => {
  const discountedProducts = await Product.findByDiscountedProducts();

  return res
    .status(200)
    .json({ message: "Discounted Products !", products: discountedProducts });
};
