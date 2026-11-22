const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const appEvents = require('../utils/appEvents');
const asyncHandler = require('../utils/asyncHandler');

exports.createExam = asyncHandler(async (req, res) => {
  const ids = req.body.questions || [];
  const found = await Question.find({ _id: { $in: ids }, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) }).select('_id');
  if (found.length !== ids.length) return res.status(400).json({ success: false, message: 'One or more questions do not exist or are not yours' });
  const exam = await Exam.create({ ...req.body, createdBy: req.user._id, status: 'draft' });
  res.status(201).json({ success: true, data: exam });
});
exports.listExams = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'student' ? { status: 'published', assignedStudents: req.user._id } : (req.user.role === 'admin' ? {} : { createdBy: req.user._id });
  const exams = await Exam.find(filter).select('-questions').populate('createdBy', 'name email').sort({ startTime: 1 });
  res.json({ success: true, data: exams });
});
exports.getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('createdBy', 'name').populate('questions');
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  if (req.user.role === 'student') {
    if (exam.status !== 'published' || !exam.assignedStudents.some(id => id.equals(req.user._id))) return res.status(403).json({ success: false, message: 'This exam is not assigned to you' });
    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) return res.status(403).json({ success: false, message: 'Exam is outside its permitted time window' });
    const safeQuestions = exam.questions.map(q => ({ _id: q._id, text: q.text, options: q.options, subject: q.subject, marks: q.marks }));
    return res.json({ success: true, data: { _id: exam._id, title: exam.title, instructions: exam.instructions, durationMinutes: exam.durationMinutes, startTime: exam.startTime, endTime: exam.endTime, questions: safeQuestions } });
  }
  if (req.user.role !== 'admin' && !exam.createdBy._id.equals(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized to view this exam' });
  res.json({ success: true, data: exam });
});
exports.updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndUpdate({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }), status: 'draft' }, req.body, { new: true, runValidators: true });
  if (!exam) return res.status(404).json({ success: false, message: 'Draft exam not found or cannot be edited after publishing' });
  res.json({ success: true, data: exam });
});
exports.publishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) });
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  if (exam.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft exams can be published' });
  if (!exam.assignedStudents.length) return res.status(400).json({ success: false, message: 'Assign at least one student before publishing' });
  exam.status = 'published'; await exam.save();
  appEvents.emit('exam:published', { examId: exam._id, title: exam.title });
  const io = req.app.get('io'); io.emit('exam:published', { examId: exam._id, title: exam.title });
  res.json({ success: true, message: 'Exam published', data: exam });
});
exports.deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndDelete({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }), status: 'draft' });
  if (!exam) return res.status(404).json({ success: false, message: 'Draft exam not found' });
  res.json({ success: true, message: 'Exam deleted' });
});

exports.startAttempt = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('questions');
  if (!exam || exam.status !== 'published' || !exam.assignedStudents.some(id => id.equals(req.user._id))) return res.status(403).json({ success: false, message: 'Exam unavailable or not assigned to you' });
  const now = new Date();
  if (now < exam.startTime || now > exam.endTime) return res.status(403).json({ success: false, message: 'Exam is outside its permitted time window' });
  let attempt = await Attempt.findOne({ exam: exam._id, student: req.user._id });
  if (attempt) return res.status(409).json({ success: false, message: 'You have already started or submitted this exam' });
  const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0);
  attempt = await Attempt.create({ exam: exam._id, student: req.user._id, totalMarks });
  const questions = exam.questions.map(q => ({ _id: q._id, text: q.text, options: q.options, marks: q.marks }));
  if (exam.shuffleQuestions) questions.sort(() => Math.random() - 0.5);
  res.status(201).json({ success: true, data: { attemptId: attempt._id, startedAt: attempt.startedAt, deadline: new Date(Math.min(+exam.endTime, +attempt.startedAt + exam.durationMinutes * 60000)), questions } });
});
exports.submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id }).populate({ path: 'exam', populate: { path: 'questions' } });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status !== 'in-progress') return res.status(409).json({ success: false, message: 'Attempt has already been submitted' });
  const deadline = Math.min(+attempt.exam.endTime, +attempt.startedAt + attempt.exam.durationMinutes * 60000);
  if (Date.now() > deadline) {
    attempt.status = 'expired';
    attempt.score = 0;
    attempt.answers = [];
    attempt.submittedAt = new Date();
    await attempt.save();
    return res.status(200).json({ success: true, message: 'The examination deadline has passed. Attempt marked expired.', data: { attemptId: attempt._id, status: attempt.status, score: 0, totalMarks: attempt.totalMarks } });
  }
  const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
  const allowedQuestions = new Map(attempt.exam.questions.map(q => [q._id.toString(), q]));
  let score = 0;
  const sanitized = [];
  for (const answer of submitted) {
    const q = allowedQuestions.get(String(answer.question));
    if (!q || !Number.isInteger(answer.selectedOption) || answer.selectedOption < 0 || answer.selectedOption >= q.options.length) continue;
    sanitized.push({ question: q._id, selectedOption: answer.selectedOption });
    if (q.correctOption === answer.selectedOption) score += q.marks;
  }
  attempt.answers = sanitized;
  attempt.score = score;
  attempt.submittedAt = new Date();
  if (attempt.status !== 'expired') attempt.status = 'submitted';
  await attempt.save();
  appEvents.emit('exam:submitted', { attemptId: attempt._id, studentId: req.user._id, examId: attempt.exam._id });
  req.app.get('io').to(`faculty:${attempt.exam.createdBy}`).emit('attempt:submitted', { attemptId: attempt._id, examId: attempt.exam._id, studentId: req.user._id });
  res.json({ success: true, message: 'Exam submitted and evaluated', data: { attemptId: attempt._id, status: attempt.status, score: attempt.score, totalMarks: attempt.totalMarks, percentage: attempt.totalMarks ? Number((score / attempt.totalMarks * 100).toFixed(2)) : 0 } });
});
exports.myResults = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ student: req.user._id, status: { $in: ['submitted', 'expired'] } }).populate('exam', 'title resultsReleased');
  res.json({ success: true, data: attempts.map(a => ({ attemptId: a._id, exam: a.exam.title, status: a.status, ...(a.exam.resultsReleased ? { score: a.score, totalMarks: a.totalMarks, percentage: a.totalMarks ? Number((a.score / a.totalMarks * 100).toFixed(2)) : 0 } : { result: 'Not released yet' }) })) });
});
exports.releaseResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) });
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  exam.resultsReleased = true; await exam.save();
  req.app.get('io').emit('results:released', { examId: exam._id, title: exam.title });
  res.json({ success: true, message: 'Results released' });
});
exports.examAnalytics = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) });
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  const report = await Attempt.aggregate([
    { $match: { exam: exam._id, status: { $in: ['submitted', 'expired'] } } },
    { $group: { _id: '$exam', attempts: { $sum: 1 }, averageScore: { $avg: '$score' }, highestScore: { $max: '$score' }, lowestScore: { $min: '$score' } } },
    { $project: { _id: 0, attempts: 1, averageScore: { $round: ['$averageScore', 2] }, highestScore: 1, lowestScore: 1 } }
  ]);
  res.json({ success: true, data: report[0] || { attempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 } });
});
