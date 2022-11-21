/**
 * Constructor function for new Course objects
 * @param {number} code course code
 * @param {string} name course name
 * @param {number} cfu course cfu
 * @param {number} enrolledstudents enrolled students in the course
 * @param {number} maxstudents max number of students in the course
 * @param {object} propaedeuticity propedeutic course. Can be a string or a complex object
 * @param {object} incompatibilities incompatibilitible courses.
 */
function Course(code, name, cfu, enrolledstudents, maxstudents, propaedeuticity, incompatibilities) {
   //se non sono presenti, vanno undefined
   this.code = code;
   this.name = name;
   this.cfu = cfu;
   this.enrolledstudents = enrolledstudents;
   this.maxstudents = maxstudents;
   this.propaedeuticity = propaedeuticity;
   this.incompatibilities = incompatibilities;
}

exports.Course = Course;