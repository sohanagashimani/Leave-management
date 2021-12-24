const router = require("express").Router();
const bcrypt = require("bcrypt");
const Staff = require("../models/Staff");

// create a staff
router.post("/register", async (req, res) => {
  try {
    let user = await Staff.findOne({ email: req.body.email });
    if (user) {
      return res.status(200).json({
        success: false,
        msg: "sorry a user with this email already exists",
      });
    }
    //generating password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const dt = new Date(req.body.joiningDate);

    // creating user
    user = new Staff({
      staffName: req.body.staffName,
      staffId: req.body.staffId,
      email: req.body.email,
      password: hashedPassword,
      phnumber: req.body.phnumber,
      role: req.body.role,
      department: req.body.department,
      type: req.body.type,
      joiningDate: dt,
      tempDate: dt,
    });
    // console.log(newUser);
    // save user and send response
    const saved = await user.save();
    success = true;
    return res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    let user = await Staff.findOne({
      email: req.body.email,
    });
    if (!user) {
      return res.status(200).json({ msg: "user not found", success: false });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(200).json({ msg: "wrong password", success: false });
    }
    if (user.type !== "Regular") {
      const joiningYear = user.joiningDate.getFullYear();
      const currentYear = new Date().getFullYear();
      const typeChange = currentYear - joiningYear;

      if (typeChange !== 0) {
        const regularBalance = 11 - joiningMonth;
        await Staff.findByIdAndUpdate(user._id, {
          type: "Regular",
          regularStaffLeaves: regularBalance,
        });
        return res.status(200).json({ user, success: true });
      } else {
        const currentMonth = new Date().getMonth();
        const tempMonth = user.tempDate.getMonth();
        const monthChange = currentMonth - tempMonth;
        if (monthChange !== 0) {
          const currentDate = new Date();
          const updatedProbationLeaves =
            user.probationStaffLeaves + monthChange;
          await Staff.findByIdAndUpdate(user._id, {
            probationStaffLeaves: updatedProbationLeaves,
            tempDate: currentDate,
          });
          user = await Staff.findOne({
            email: req.body.email,
          });
          return res.status(200).json({ user, success: true });
        } else {
          return res.status(200).json({ user, success: true });
        }
      }
    } else if (user.role === "Admin") {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1; //months from 1-12
      const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();
      const newdate = year + "/" + month + "/" + day;
      const yearBegins = new Date(dateObj.getFullYear(), 0, 1);
      const janYear = yearBegins.getFullYear();
      const firstOfJan = janYear + "/" + 12 + "/" + 24;
      if (newdate === firstOfJan) {
        await Staff.updateMany(
          { type: "Regular" },
          {
            regularStaffLeaves: 12,
          }
        );
      }
      return res.status(200).json({ user, success: true });
    } else if (user.type === "Regular") {
      const currentDate = new Date();
      const currentYear = new Date().getFullYear();
      const tempYear = user.tempDate.getFullYear();
      const typeChange = currentYear - tempYear;
      if (typeChange !== 0) {
        const updatedEarnedLeaves = typeChange * (user.earnedLeaves + 10);
        await Staff.findByIdAndUpdate(user._id, {
          tempDate: currentDate,
          earnedLeaves: updatedEarnedLeaves,
        });
        user = await Staff.findOne({
          email: req.body.email,
        });
        return res.status(200).json({ user, success: true });
      }
      return res.status(200).json({ user, success: true });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
