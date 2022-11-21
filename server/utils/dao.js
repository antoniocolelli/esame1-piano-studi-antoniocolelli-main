"use strict";
const { Course } = require("./Course");
const { StudyPlan } = require("./StudyPlan");

const sqlite = require("sqlite3");

// open the database
const db = new sqlite.Database("data.db", (err) => {
  if (err) throw err;
});

/**
 * Get all courses
 */
exports.listCourses = () => {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM course";
    db.all(sql, [], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const courses = rows.map(
        (c) =>
          new Course(
            c.code,
            c.name,
            c.cfu,
            c.enrolled_students,
            c.max_students,
            c.propaedeuticity,
            undefined
          )
      );
      resolve(courses);
    });
  });
};

/**
 * Get the studyplan of the logged in user
 * @param {number} user_id the id of the user
 */
exports.getStudyPlan = (user_id) => {
  return new Promise(async (resolve, reject) => {
    const sql =
      "SELECT * FROM user_course,course WHERE user_id=? AND user_course.course_code=course.code";
    db.all(sql, [user_id], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const courses = rows.map(
        (c) =>
          new Course(
            c.code,
            c.name,
            c.cfu,
            c.enrolled_students,
            c.max_students,
            c.propaedeuticity,
            undefined
          )
      );
      resolve(courses);
    });
  });
};

/**
 * Insert the studyplan of the logged in user
 * @param {StudyPlan} studyPlan an object describing the studyplan to insert
 * @param {number} user_id the id of the user
 */
exports.insertStudyPlan = (studyPlan, user_id) => {
  const promises = studyPlan.courses.map(c =>
    new Promise(async (resolve, reject) => {
      let sql = "INSERT INTO user_course(user_id,course_code) VALUES (?,?)";
      db.run(sql, [user_id, c], (err) => {
        if (err) {
          reject(err);
        }
        sql = 'UPDATE course SET enrolled_students=enrolled_students+1 WHERE code = ?';
        db.run(sql, [c], (err) => {
          if (err) {
            reject(err);
            return;
          } else
            resolve(null);
        });

      });
    }));

  promises.push(new Promise(async (resolve, reject) => {
    const sql = "UPDATE user SET fulltime=? WHERE id = ?";
    db.run(sql, [studyPlan.fulltime, user_id], (err) => {
      if (err) {
        reject(err);
      } else resolve(null);
    });
  }))
  return Promise.all(promises);
}


/**
 * Delete the studyplan of the logged in user
 * @param {number} user_id the id of the user
 */
exports.deleteStudyPlan = (user_id) => {
  return new Promise(async (resolve, reject) => {
    const sql =
      "UPDATE course SET enrolled_students=enrolled_students-1 " +
      "WHERE EXISTS (SELECT course_code " +
      "FROM user_course " +
      "WHERE course_code=course.code AND user_course.user_id=?" +
      ")";
    db.run(sql, [user_id], async (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(
        Promise.all([
          new Promise(async (resolve, reject) => {
            const sql = "DELETE FROM user_course WHERE user_id = ?";
            db.run(sql, [user_id], (err) => {
              if (err) {
                reject(err);
              } else resolve(null);
            });
          }),
          new Promise(async (resolve, reject) => {
            const sql = "UPDATE user SET fulltime=NULL WHERE id = ?";
            db.run(sql, [user_id], (err) => {
              if (err) {
                reject(err);
              } else resolve(null);
            });
          }),
        ])
      );
    });
  });
};

/**
 * Given a course code, get all its incompatibilities courses
 * @param {string} code the course code
 */
exports.getIncompatibilities = (code) => {
  return new Promise(function (resolve, reject) {
    const sql =
      "SELECT * FROM incompatibility WHERE course_code_1=? OR course_code_2=?";
    db.all(sql, [code, code], function (err, rows) {
      if (err) {
        return reject(err);
      } else if (rows.length == 0) resolve(undefined);
      const incompatibilities = rows.map((i) =>
        i.course_code_1 === code ? i.course_code_2 : i.course_code_1
      );
      resolve(incompatibilities);
    });
  });
};
