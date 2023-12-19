const Customer = require("../models/customer");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const Comment = require("../models/comments");
const Likes = require("../models/likes");

//KAYIT OLMA
exports.signup = async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existingCustomer = await Customer.findByEmail(email);

  if (existingCustomer) {
    return res.status(400).json({ message: "Customer already exist" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const customer = await Customer.create(name, email, hashedPassword, phone);

  return res
    .status(201)
    .json({ message: "customer successfully Created !", customer: customer });
};

//GIRIS YAPMA
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const existingCustomer = await Customer.findByEmail(email);

  if (!existingCustomer) {
    return res
      .status(400)
      .json({ message: `Customer with this email ${email} has no account !` });
  }

  const matchPassword = await bcrypt.compare(
    password,
    existingCustomer.password
  );

  if (!matchPassword) {
    return res.status(400).json({ message: "Wrong Password !" });
  }

  const token = JWT.sign(
    {
      email: email,
      customerId: existingCustomer.customer_id,
    },
    "secretkey",
    { expiresIn: "5h" }
  );

  return res.status(200).json({
    message: "Successfully Logged In !",
    token: token,
    customerId: existingCustomer.customer_id,
  });
};

exports.changePassword = async (req, res, next) => {
  const { email, password } = req.body;

  const existingCustomer = await Customer.findByEmail(email);

  if (!existingCustomer) {
    return res
      .status(400)
      .json({ message: `Customer with this email ${email} has no account !` });
  }

  const newHashedPassword = await bcrypt.hash(password, 12);

  const newPassword = await Customer.changePassword(
    email,
    existingCustomer.password,
    newHashedPassword
  );

  return res.status(201).json({
    message: "Password Successfully Changed!",
    newPassword: newPassword,
  });
};

exports.customerComments = async (req, res, next) => {
  const customerId = req.customerId;

  const customerComments = await Comment.findCustomerComments(customerId);

  if (!customerComments) {
    return res
      .status(404)
      .json({ message: "There is not comment for this customer !" });
  }

  return res
    .status(200)
    .json({ message: "Comments Fetched !", comments: customerComments });
};

exports.postLike = async (req, res, next) => {
  const customerId = req.customerId;
  const commentId = req.params.commentId;

  const isCommentExist = await Comment.findComment(commentId);

  if (!isCommentExist) {
    return res.status(404).json({ message: "Comment can not be found !" });
  }

  const likedComment = await Likes.postLike(customerId, commentId);

  return res
    .status(201)
    .json({ message: "Comment Liked !", likedComment: likedComment });
};

exports.deleteLike = async (req, res, next) => {
  const customerId = req.customerId;
  const commentId = req.params.commentId;

  await Likes.deleteLike(customerId, commentId);

  return res.status(200).json({ message: "Deleted Liked Comment !" });
};

exports.filteredMaxLikedComment = async (req, res, next) => {
  const maxLikedComment = await Likes.getMaxLikedComment();

  return res.status(200).json({
    message: "Max Liked Comment Fetched ",
    maxLikedComment: maxLikedComment,
  });
};

exports.countLikes = async (req, res, next) => {
  const commentId = req.params.commentId;

  const countedLikes = await Likes.countLikes(commentId);

  return res
    .status(200)
    .json({ message: "Successfully fetched !", countedLikes: countedLikes });
};
