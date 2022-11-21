/**
 * Constructor function for new Course objects
 * @param {boolean} fulltime 0:part-time , 1: full-time
 * @param {array<string>} courses an array of courses to be inserted
 */
function StudyPlan(fulltime,courses) {
   this.fulltime = fulltime;
   this.courses = courses.map(c => c.code.toUpperCase());
   }

exports.StudyPlan = StudyPlan;