const mongoose = require('mongoose');
const MeetSchema = new mongoose.Schema({
    name: String,
    topic: String,
    type: { type: String, enum: ['public', 'private'] },
    code: String, // private meet को लागि
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Meet', MeetSchema);