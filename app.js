const express = require("express");
const bodyParser = require("body-parser");
const customerRoutes = require("./routes/customer");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/orders");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use("/auth", customerRoutes);
app.use(productRoutes);
app.use(orderRoutes);

app.listen(3000, () => {
  console.log("listening port on 3000");
});
