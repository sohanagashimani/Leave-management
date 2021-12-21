const express = require("express");
const app = express();
var cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const staffRoute = require("./routes/staff");
const authRoute = require("./routes/auth");
const leaveRoute = require("./routes/leave");
app.use(cors());
dotenv.config();
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

// app.get("/", (req, res) => {
//   res.send("hi");
// });

app.use("/api/staff", staffRoute);
app.use("/api/auth", authRoute);
app.use("/api/leave", leaveRoute);

app.listen(4000, () => {
  console.log("backend server is running ");
});
