const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const gravatar = require("gravatar");
const User = require("../../models/User");
const config = require("config");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
const auth = require("../../middleware/auth");
const axios = require('axios');

/* OAuth2.0 Required Packages */
const { OAuth2Client } = require("google-auth-library");
const glClient = new OAuth2Client(
  "860538264827-8qf2qpp6mqki8asmbpsroulb9u16un61.apps.googleusercontent.com"
);

router.post("/www", async (req, res) => {
  var data = '{\r\n    apiLogin: \'b23027da-b22\'\r\n}';

  var config = {
    method: 'post',
    url: 'https://api-eu.iiko.services/api/1/access_token',
    headers: { 
      'Content-Type': 'application/json'
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    res.json(response.data);
  })
  .catch(function (error) {
    res.json(error);
  });
  

});

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post(
  "/login",
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: "User not found." }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Password incorrect." }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 days" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      console.log("___ User login: " + user.email);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

/* BASIC USER SIGNUP */
router.post(
  "/register",
  check("email", "Please include a valid email").isEmail(),
  check(
    "password",
    "Please enter a password with 4 or more characters"
  ).isLength({ min: 4 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      const avatar = normalize(
        gravatar.url(email, {
          s: "200",
          r: "pg",
          d: "mm",
        }),
        { forceHttps: true }
      );

      user = new User({
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);
      user.verifylink = new Date().getTime();

      sendMail(email, user.verifylink);

      await user.save();
      console.log("__New User added." + Date("Y-m-d"));

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 days" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

router.post(
  "/editUser",
  check("email", "Please include a valid email").isEmail(),
  check(
    "password",
    "Please enter a password with 4 or more characters"
  ).isLength({ min: 4 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, email, password } = req.body;

    try {
      let user = await User.findById(id);

      user.email = email;

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();
      res.json("success");
      console.log("__User updated." + Date("Y-m-d"));

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

router.post(
  "/deleteUser",
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, email, password } = req.body;

    try {
      let user = await User.findOneAndRemove({ _id: id });
      res.json("removed");
      console.log("__User updated." + Date("Y-m-d"));

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

/* SOCIAL MEDIA (SM) USER SIGNUP */
async function verifyInGoogle(token) {
  const ticket = await glClient.verifyIdToken({
    idToken: token,
    audience:
      "860538264827-8qf2qpp6mqki8asmbpsroulb9u16un61.apps.googleusercontent.com", // Specify the CLIENT_ID of the app that accesses the backend
  });
  const payload = ticket.getPayload();
  return payload;
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
}

router.post(
  "/sm-signup",
  check("register_type", "Please include a valid signup type").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const register_type = req.body.register_type;
    let verifiedToken,
      google_auth_user_id,
      fb_auth_user_id,
      picture,
      email,
      name;

    try {
      if (register_type == "GOOGLE") {
        const tokenId = req.body.tokenObj.id_token;
        verifiedToken = await verifyInGoogle(tokenId);
        google_auth_user_id = verifiedToken.sub;
        picture = verifiedToken.picture;
        name = verifiedToken.name;
        email = verifiedToken.email;
      } else if (register_type == "FB") {
        name = req.body.name;
        email = req.body.email;
        picture = req.body.picture.data.url;
        fb_auth_user_id = req.body.userID;
      }

      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      const verifylink = new Date().getTime();

      sendMail(email, verifylink);

      const avatar = normalize(picture, { forceHttps: true });
      const firstname = name.split(" ")[0] || null;
      const lastname = name.split(" ")[1] || null;

      user = new User({
        email,
        firstname,
        lastname,
        avatar,
        register_type,
        google_auth_user_id,
        fb_auth_user_id,
        verifylink
      });

      await user.save();
      console.log("__New User added." + Date("Y-m-d"));

      const payload = {
        user: {
          id: user._id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 days" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

router.post(
  "/sm-login",
  // check('email', 'Please include a valid email').isEmail(),
  check("accessToken", "Please include a valid token").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accessToken } = req.body;
    const { email } = req.body.profileObj;
    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: "User not found." }] });
      }

      let OAuth2UserId;
      if (user.register_type == "GOOGLE") {
        const tokenId = req.body.tokenObj.id_token;
        verifiedToken = await verifyInGoogle(tokenId).catch(console.error);
        OAuth2UserId = verifiedToken.sub;

        if (OAuth2UserId != user.google_auth_user_id) {
          return res
            .status(400)
            .json({ errors: [{ msg: "User not registred." }] });
        }
      } else if (user.register_type == "FB") {
        OAuth2UserId = user.fb_auth_user_id;
        if (OAuth2UserId != req.body.userID) {
          return res
            .status(400)
            .json({ errors: [{ msg: "User not registred." }] });
        }
      }

      const payload = {
        user: {
          id: user._id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 days" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      console.log("___ User login: " + user.email);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

const sendMail = (receiveMail, Link) => {
  //transfer mail
  var nodemailer = require("nodemailer");

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nguyenjame440@gmail.com",
      pass: "Danil1234567",
    },
  });

  var mailOptions = {
    from: "nguyenjame440@gmail.com",
    to: receiveMail,
    subject: "Metafomos Email Verification",
    text: "Your Verification Link is " + 'https://metafomos.com/verify/'+Link
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  //transfer mail end
}

router.post("/verifyLink", auth, async (req, res) => {
  try {
    const { verifyLink } = req.body;
    // const user = await User.findById(req.user.id);
    const user = await User.findOne({ verifylink:  verifyLink });

    if ( user ) {
      user.verified = true;
      user.save();
      res.json('success');
    } else {
      user.verified = false;
      user.save();
      res.json('fail');
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/resend", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.verifylink = new Date().getTime();
    sendMail(user.email, user.verifylink);
    user.save();
    res.json('success');
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
