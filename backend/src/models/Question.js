const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  options: { type: [{ type: String, trim: true }], validate: v => v.length >= 2 && v.length <= 6 },
  correctOption: { type: Number, required: true, min: 0 },
  subject: { type: String, required: true, trim: true, index: true },
  topic: { type: String, trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  marks: { type: Number, min: 1, default: 1 }
}, { timestamps: true });
questionSchema.pre('validate', function () {
  if (this.correctOption >= this.options.length) this.invalidate('correctOption', 'Correct option index must refer to an existing option');
});
module.exports = mongoose.model('Question', questionSchema);
