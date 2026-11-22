const mongoose = require('mongoose');
const attemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: [{ question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }, selectedOption: { type: Number, min: 0 } }],
  score: { type: Number, default: 0, min: 0 },
  totalMarks: { type: Number, required: true, min: 0 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  status: { type: String, enum: ['in-progress', 'submitted', 'expired'], default: 'in-progress', index: true }
}, { timestamps: true });
attemptSchema.index({ exam: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('Attempt', attemptSchema);
