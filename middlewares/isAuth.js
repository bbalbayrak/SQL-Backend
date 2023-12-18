const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];

  if (!token) {
    return res
      .status(403)
      .json({ message: "A token is required for authentication" });
  }
  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), "secretkey");
    if (typeof decoded === "string") {
      return next(new Error("Invalid"));
    }
    req.customerId = decoded.customerId;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
