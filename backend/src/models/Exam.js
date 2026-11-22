const mongoose = require('mongoose');
const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  instructions: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  durationMinutes: { type: Number, required: true, min: 1, max: 600 },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  resultsReleased: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'completed'], default: 'draft', index: true },
  shuffleQuestions: { type: Boolean, default: false }
}, { timestamps: true });
examSchema.pre('validate', function () {
  if (this.endTime <= this.startTime) this.invalidate('endTime', 'End time must be after start time');
  if (this.questions.length === 0) this.invalidate('questions', 'An exam must contain at least one question');
});
examSchema.index({ status: 1, startTime: 1, endTime: 1 });
module.exports = mongoose.model('Exam', examSchema);
