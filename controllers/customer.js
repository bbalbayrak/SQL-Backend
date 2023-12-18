const Customer = require("../models/customer");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

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
