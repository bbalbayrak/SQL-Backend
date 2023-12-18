const Orders = require("../models/orders");
const OrderDetails = require("../models/orderDetails");
const Product = require("../models/product");

exports.createOrder = async (req, res, next) => {
  const customerId = req.customerId;

  const newOrder = await Orders.createOrder(customerId);

  return res.status(201).json({ message: "Order created !", order: newOrder });
};

exports.addProductToCard = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const quantity = "1";

  const isOrderExist = await Orders.findOrderExist(orderId);

  if (!isOrderExist) {
    return res.status(404).json({ message: "Order can not be found !" });
  }

  const product = await Product.getProductDetails(productId);

  const productPrice = product.price;

  const addedNewProducts = await OrderDetails.addProduct(
    orderId,
    productId,
    quantity,
    productPrice
  );

  return res
    .status(201)
    .json({ message: "New product added !", newProducts: addedNewProducts });
};

exports.updateCart = async (req, res, next) => {
  const orderId = req.params.orderId;
  const productId = req.params.productId;
  const quantity = 1;

  const isOrderExist = await Orders.findOrderExist(orderId);

  if (!isOrderExist) {
    return res.status(404).json({ message: "Order can not be found !" });
  }

  const product = await Product.getProductDetails(productId);

  const productPrice = product.price;

  const updatedCart = await OrderDetails.updateCart(
    orderId,
    productId,
    quantity,
    productPrice
  );

  return res
    .status(201)
    .json({ message: "Updated Cart !", updatedCart: updatedCart });
};

exports.deleteProductFromCart = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;

  await OrderDetails.deleteProductFromCart(productId);

  const orderDetail = await OrderDetails.findOrderDetails(orderId);

  return res
    .status(200)
    .json({ message: "Successfully Deleted !", order: orderDetail });
};

exports.getOrderDetails = async (req, res, next) => {
  const orderId = req.params.orderId;

  const orderDetails = await OrderDetails.findOrderDetails(orderId);

  return res
    .status(200)
    .json({ message: "Order details fetched !", orderDetails: orderDetails });
};

exports.deleteOrder = async (req, res, next) => {
  const orderId = req.params.orderId;

  await OrderDetails.deleteOrderDetails(orderId);
  const deletedOrder = await Orders.deleteOrder(orderId);

  return res.status(200).json({
    message: "Order successfully deleted !",
    deletedOrder: deletedOrder,
  });
};
