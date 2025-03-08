const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userPhoneNumber: {
    type: String,
    required: true,
  },
  interviewDate: {
    type: Date,
    default: Date.now,
  },
  maidId:{
    type: String,
    required: true
  },
  timestamp: { type: Date, default: Date.now }
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
