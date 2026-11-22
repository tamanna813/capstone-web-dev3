const EventEmitter = require('events');
const appEvents = new EventEmitter();
appEvents.setMaxListeners(20);

appEvents.on('exam:submitted', ({ attemptId, studentId, examId }) => {
  console.log(`[EVENT] Exam submitted: attempt=${attemptId}, student=${studentId}, exam=${examId}`);
});
appEvents.on('exam:published', ({ examId, title }) => {
  console.log(`[EVENT] Exam published: ${title} (${examId})`);
});
module.exports = appEvents;
