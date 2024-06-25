const mongoose  = require("mongoose")
const { Schema } = mongoose;

const notesSchema = new Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  title:{
    type: String,
    require: true
  },
  description:{
    type: String,
    require: true,
  },
  tag:{
    type: String,
    default: "general",
  },
  Date:{
    type: String,
    default: Date.now
  }
});

module.exports = mongoose.model('notes',notesSchema);