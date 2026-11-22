const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const asyncHandler = require('../utils/asyncHandler');

// Aggregation pipeline: performance summary grouped by exam.
exports.performanceSummary = asyncHandler(async (req, res) => {
  const ownedExams = await Exam.find(req.user.role === 'admin' ? {} : { createdBy: req.user._id }).select('_id');
  const examIds = ownedExams.map(e => e._id);
  const report = await Attempt.aggregate([
    { $match: { exam: { $in: examIds }, status: { $in: ['submitted', 'expired'] } } },
    { $group: { _id: '$exam', attempts: { $sum: 1 }, averageScore: { $avg: '$score' }, maximumScore: { $max: '$score' }, minimumScore: { $min: '$score' } } },
    { $lookup: { from: 'exams', localField: '_id', foreignField: '_id', as: 'examInfo' } },
    { $unwind: '$examInfo' },
    { $project: { _id: 0, examId: '$_id', title: '$examInfo.title', attempts: 1, averageScore: { $round: ['$averageScore', 2] }, maximumScore: 1, minimumScore: 1 } },
    { $sort: { title: 1 } }
  ]);
  res.json({ success: true, data: report });
});

// Aggregation pipeline: score distribution for one exam.
exports.scoreDistribution = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { createdBy: req.user._id }) });
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  const report = await Attempt.aggregate([
    { $match: { exam: exam._id, status: { $in: ['submitted', 'expired'] } } },
    { $bucket: { groupBy: { $multiply: [{ $divide: ['$score', { $cond: [{ $gt: ['$totalMarks', 0] }, '$totalMarks', 1] }] }, 100] }, boundaries: [0, 40, 60, 75, 90, 101], default: 'other', output: { students: { $sum: 1 }, averageMarks: { $avg: '$score' } } } },
    { $project: { range: '$_id', students: 1, averageMarks: { $round: ['$averageMarks', 2] }, _id: 0 } }
  ]);
  res.json({ success: true, data: report });
});
