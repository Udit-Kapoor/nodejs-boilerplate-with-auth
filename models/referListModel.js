const mongoose = require('mongoose');

const referListSchema = mongoose.Schema({
  referedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  referedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const ReferList = mongoose.model('ReferList', referListSchema);

module.exports = ReferList;
