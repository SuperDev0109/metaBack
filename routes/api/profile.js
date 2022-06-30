const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const auth = require("../../middleware/auth");

router.get("/getReferralLink", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.referrallink);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/setReferralLink", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.referrallink = req.body.referralLink;
      user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  router.get("/getLevelandFollow", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const followCount = parseInt(user.follow1) + parseInt(user.follow2) + parseInt(user.follow3) + parseInt(user.follow4) + parseInt(user.follow5);
      res.json({user, followCount});
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  router.get("/getLevel", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      res.json(user.level);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  router.get("/getUsers", auth, async (req, res) => {
    try {
      const user = await User.find();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  })

  router.post("/setLevel", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.level = req.body.level;
      if (parseInt(req.body.level) == 2) {
        user.level2_done = true;
      }
      user.save()
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  router.post("/savePersonalData", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const { firstname, lastname } = req.body;
      user.firstname = firstname;
      user.lastname = lastname;
      user.save()
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  router.post("/setFollow", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const type = parseInt(req.body.type);
      switch (type) {
        case 1:
          user.follow1 = 1;
          break;
        case 2:
          user.follow2 = 1;
          break;
        case 3:
          user.follow3 = 1;
          break;
        case 4:
          user.follow4 = 1;
          break;
        case 5:
          user.follow5 = 1;
          break;
        default:
          break;
      }

      const followCount = parseInt(user.follow1) + parseInt(user.follow2) + parseInt(user.follow3) + parseInt(user.follow4) + parseInt(user.follow5);

      user.save();
      res.json({user, followCount});

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });


module.exports = router;
