const express = require('express');
const Interview = require("../Models/Interview")
const router = express.Router();
const verifyAdminToken = require("../middlewears/verifyAdminToken")
// CRUD
router.get('/',verifyAdminToken, async(req, res) =>{
    try {
        const allNumbers = await Interview.find();
        res.status(200).json(allNumbers);
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
});
router.post('/',verifyAdminToken, async(req, res) =>{
    try {
        const { phoneNumber, maidId } = req.body;
    
        const interview = new Interview({
          userPhoneNumber: phoneNumber,
          maidId: maidId,
        });
    
        const savedInterview = await interview.save();
    
        res.status(201).json(savedInterview);
      } catch (error) {
        console.error('Error planning interview:', error);
        res.status(500).json({ error: 'An error occurred' });
      }
});

router.delete("/:id",verifyAdminToken, async (req, res)=>{
    try {
        const userId = req.params.id;
    
        const deletedUser = await Interview.findByIdAndDelete(userId);
    
        if (!deletedUser) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        res.status(200).json({ message: 'User deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
})

module.exports = router;