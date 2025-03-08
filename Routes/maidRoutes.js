const express = require('express');
const router = express.Router();
const maidController = require("../controllers/maidController")
const upload = require("../middlewears/uploadMiddlewear")
// const upload = require("../middlewears/uploadMiddlewear")
const verifyAdminToken = require("../middlewears/verifyAdminToken");



// CRUD
router.get('/', maidController.getAllMaids);
router.post('/', verifyAdminToken,
upload.fields([
    { name: 'maidImg', maxCount: 1 },
    { name: 'maidImg2', maxCount: 1 },
    { name: 'maidImg3', maxCount: 1 },
    { name: 'maidImg4', maxCount: 1 },
    { name: 'videoLink', maxCount: 1 },
  ]),
   maidController.addMaid);

router.put('/:id',verifyAdminToken,
upload.single("maidImg"),
  maidController.updateMaid);
router.put('/availablity/:id',verifyAdminToken, maidController.updateMaidAvailablity);
router.post('/delete/:id',verifyAdminToken, maidController.deleteMaid);
router.get('/:id', maidController.getMaid);

module.exports = router;