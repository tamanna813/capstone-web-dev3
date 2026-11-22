const Question = require('../models/Question');
const asyncHandler = require('../utils/asyncHandler');
exports.createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: question });
});
exports.listQuestions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Number(req.query.limit) || 10);
  const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.topic) filter.topic = req.query.topic;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  const [data, total] = await Promise.all([Question.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Question.countDocuments(filter)]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOneAndUpdate({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) }, req.body, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ success: false, message: 'Question not found or not owned by you' });
  res.json({ success: true, data: question });
});
exports.deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOneAndDelete({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) });
  if (!question) return res.status(404).json({ success: false, message: 'Question not found or not owned by you' });
  res.json({ success: true, message: 'Question deleted' });
});
