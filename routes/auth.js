const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
var fetchuser = require( "../middleware/fetchuser")
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const JWT_SECRET = "Hellobrohowareyou";

// ROUTE 1: CREATE NEW USER USING: POST "/api/auth/createUser" . No login required
router.post("/createUser", [body("name", "Enter a valid name").isLength({ min: 3 }), body("email", "Enter a valid Email").isEmail(), body("password").isLength({ min: 5 })], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array() });
    }

    //check whether email exists already.
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({success, error: "Email is  already registered." });
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        });
        const data = {
            user: user.id,
        };
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({success, authtoken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error ");
    }
});

// ROUTE 2: AUTHENTICATE  THE USERS AND GET BACK A TOKEN USING: POST "/api/auth/login" . No login required
// Authenticate a user
router.post("/login", [body("email", "Enter a valid Email").isEmail(), body("password", "Password cannot be blank").exists()], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({success, error: "Invalid credentials" });
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({success, error: "Invalid Credentials" });
        }
        const data = {
            user: user.id,
        };
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true
        res.json({success, authtoken });
    } catch (error) {
        res.status(500).send("Internal server error ");
    }
});

// ROUTE 3: GET LOGGED IN USER DETAILS USING: GET "/api/auth/getuser" . Login required
router.get("/getuser", fetchuser , async (req, res) => {
    try {
        const userId  = req.user;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        res.status(500).send("Internal server error ");
    }
});

// ROUTE 4: UPDATE USER DETAILS USING: PUT "/api/auth/updateuser". Login required
router.put("/updateuser", fetchuser, [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
  ], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }
  
    try {
      const userId = req.user;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success, error: "User not found" });
      }
  
      const { name, email } = req.body;
      user.name = name;
      user.email = email;
  
      await user.save();
      success = true;
      res.json({ success, message: "User details updated successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error ");
    }
  });

module.exports = router;
