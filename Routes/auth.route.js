const express = require('express');
const bcrypt = require("bcryptjs")
const User = require("../Models/User")
const jwt = require("jsonwebtoken")
const router = express.Router();
router.get('/',async (req, res) =>{
    res.render("login")
});
router.post("/adminLogin", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.redirect("/login");
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.redirect("/login");
      }
  
      if (!user.admin) {
        return res.redirect("/login");
      }
  
      const adminToken = jwt.sign({ userId: user._id, admin: true }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
      res.cookie('adminToken', adminToken);
      res.redirect("/")
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  
  router.post("/officeLogin", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
  
      if (!user.admin) {
        return res.status(403).json({ error: 'Access Forbidden' });
      }
  
      const officeToken = jwt.sign(
        { userId: user._id, admin: true },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1d' }
      );
      res.cookie('officeToken', officeToken);
      res.status(200).json({ message: 'Login successful', officeToken });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  

module.exports = router;