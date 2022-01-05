const router = require("express").Router();
const { findById } = require("../models/Leave");
const Leave = require("../models/Leave");
const Staff = require("../models/Staff");
// create a leave request
router.post("/", async (req, res) => {
  try {
    const newLeave = new Leave({
      userId: req.body.userId,
      subject: req.body.subject,
      department: req.body.department,
      type: req.body.type,
      body: req.body.body,
      subStaffArr: req.body.subStaffArr,
      byStaff: req.body.byStaff,
      byHod: req.body.byHod,
      dateStart: req.body.dateStart,
      dateEnd: req.body.dateEnd,
      name: req.body.name,
      noOfDays: req.body.noOfDays,
    });
    const savedLeave = await newLeave.save();
    res.status(200).json({ savedLeave, msg: "Leave request sent" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete a leave
router.delete("/:id", async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ msg: "Leave has been deleted successfully", success: true });
  } catch (err) {
    return res.status(500).json(err);
  }
});
// get hod specific leave requests
router.get("/hod/:department", async (req, res) => {
  try {
    const leave = await Leave.find({
      department: req.params.department,
      byStaff: 1,
    });
    res.status(200).json(leave);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// get admin specific requests(hod's requests)
router.get("/", async (req, res) => {
  try {
    const user = await Staff.find({ role: "Hod" });

    if (!user) return res.status(200).send([], "no hods found");
    const newArr = [];
    const reqForAdmin = await Promise.all(
      user.map((i) => {
        return Leave.find({ userId: i._id, byStaff: 1 });
      })
    );
    // console.log(reqForAdmin);

    const updatedReqForAdmin = [];
    reqForAdmin.map((request) => {
      if (request.length !== 0) {
        request.map((item) => {
          updatedReqForAdmin.push(item);
        });
      }
    });
    console.log(updatedReqForAdmin);
    if (updatedReqForAdmin.length !== 0) {
      return res.status(200).json(updatedReqForAdmin);
    } else {
      return res.status(200).send([]);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

// get a leave request
router.get("/:userId", async (req, res) => {
  try {
    const leave = await Leave.find({ userId: req.params.userId });
    return res.status(200).json(leave);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//accepted/dec by staff hod and admin
router.put(
  "/:leaveId/:byStaff/:role/:leaveCount/:staffName",
  async (req, res) => {
    try {
      // console.log(req.params.role);
      if (req.params.role === "Staff") {
        const leave = await Leave.findById(req.params.leaveId);
        // console.log(leave);
        leave.subStaffArr.map((user) => {
          if (user.name === req.params.staffName) {
            user.status = Number(req.params.byStaff);
          }
        });
        // console.log(leave.subStaffArr);

        await Leave.findByIdAndUpdate(req.params.leaveId, {
          subStaffArr: leave.subStaffArr,
        });
        const byStaffApprovalBoolean = leave.subStaffArr.every(
          (user) => user.status === 1
        );
        const byStaffDeclinedBoolean = leave.subStaffArr.some(
          (user) => user.status === 2
        );

        if (byStaffApprovalBoolean) {
          byStaffApproval = 1;
        } else if (byStaffDeclinedBoolean) {
          byStaffApproval = 2;
        } else {
          byStaffApproval = 0;
        }

        await Leave.findByIdAndUpdate(req.params.leaveId, {
          byStaff: byStaffApproval,
        });
        return res.status(200).json("leave status provided");
      } else if (req.params.role === "Hod") {
        const leave = await Leave.findByIdAndUpdate(req.params.leaveId, {
          byHod: req.params.byStaff,
        });
        const leaveStatus = await Leave.findById(req.params.leaveId);
        const userId = await leaveStatus.userId;
        const user = await Staff.findById(userId);
        if (leaveStatus.byHod === 1 && leaveStatus.type === "Casual") {
          if (user.type === "Regular") {
            const updatedLeaves =
              user.regularStaffLeaves - req.params.leaveCount;
            // console.log(updatedLeaves)
            await Staff.findByIdAndUpdate(user._id, {
              regularStaffLeaves: updatedLeaves,
            });
          } else {
            const updatedLeaves =
              user.probationStaffLeaves - req.params.leaveCount;
            await Staff.findByIdAndUpdate(user._id, {
              probationStaffLeaves: updatedLeaves,
            });
          }
        } else if (leaveStatus.byHod === 1 && leaveStatus.type === "Earned") {
          if (user.type === "Regular") {
            const updatedLeaves = user.earnedLeaves - req.params.leaveCount;
            // console.log(updatedLeaves)
            await Staff.findByIdAndUpdate(user._id, {
              earnedLeaves: updatedLeaves,
            });
          }
        }
        return res.status(200).json("leave status approved");
      } else if (req.params.role === "Admin") {
        await Leave.findByIdAndUpdate(req.params.leaveId, {
          byAdmin: req.params.byStaff,
        });
        const leaveStatus = await Leave.findById(req.params.leaveId);
        const userId = await leaveStatus.userId;
        const user = await Staff.findById(userId);
        if (leaveStatus.byAdmin === 1 && leaveStatus.type === "Casual") {
          if (user.type === "Regular") {
            const updatedLeaves =
              user.regularStaffLeaves - req.params.leaveCount;
            // console.log(updatedLeaves)
            await Staff.findByIdAndUpdate(user._id, {
              regularStaffLeaves: updatedLeaves,
            });
          } else {
            const updatedLeaves =
              user.probationStaffLeaves - req.params.leaveCount;
            await Staff.findByIdAndUpdate(user._id, {
              probationStaffLeaves: updatedLeaves,
            });
          }
        } else if (leaveStatus.byHod === 1 && leaveStatus.type === "Earned") {
          if (user.type === "Regular") {
            const updatedLeaves = user.earnedLeaves - req.params.leaveCount;
            // console.log(updatedLeaves)
            await Staff.findByIdAndUpdate(user._id, {
              earnedLeaves: updatedLeaves,
            });
          }
        }
        return res.status(200).json("leave status approved");
      }
    } catch (error) {
      return res.status(500).json(error);
    }
  }
);

// get staff specific leave reqs
router.get("/staff/:staffname", async (req, res) => {
  try {
    const leave = await Leave.find({
      subStaffArr: { $elemMatch: { name: req.params.staffname } },
    });
    res.status(200).json(leave);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// get all leaves
router.get("/principal/allLeaves", async (req, res) => {
  try {
    const allLeaves = await Leave.find({ $or: [{ byAdmin: 1 }, { byHod: 1 }] });
    console.log(allLeaves);
    return res.status(200).json(allLeaves);
  } catch (err) {
    console.log(res.status);
    return res.status(500).json(err);
  }
});

module.exports = router;
