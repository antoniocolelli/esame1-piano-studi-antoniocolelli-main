"use strict";
const dao = require("./dao"); // module for accessing the DB
const { StudyPlan } = require("./StudyPlan");
const userDao = require("./user-dao"); // module for accessing the users in the DB

/**
 * Get all courses
 * @param {boolean} detailed true:return detailed info(code,name,cfu) about propaedeutic and incompatibles course. false:return only the coded
 */
exports.listCourses = async (detailed) => {
  try {
    const courses = await dao.listCourses();
    for (const course of courses) {
      course.incompatibilities = await dao.getIncompatibilities(course.code);
      if (detailed) {
        course.propaedeuticity = getCourseInfo(courses, course.propaedeuticity, detailed);
        course.incompatibilities = course.incompatibilities
          ? course.incompatibilities.map((c) =>
            getCourseInfo(courses, c, detailed)
          ).sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }

            // names must be equal
            return 0;
          })
          : undefined;
      }
    }
    return courses.sort((a, b) => {
      const nameA = a.name.toUpperCase(); // ignore upper and lowercase
      const nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });
  } catch (err) {
    throw err;
  }
};

/**
 * Given the code of a course, this function returns the course info detailed or not according to detailed value
 * @param {array<Course>} courses the list of courses
 * @param {string} code the course code to manage
 * @param {boolean} detailed true:return code,name,cfu. false:return code
 */
const getCourseInfo = (courses, code, detailed) => {
  const row =
    detailed && code ? courses.find((c) => c.code === code) : undefined;
  return detailed && code
    ? {
      code: row.code,
      name: row.name,
      cfu: row.cfu,
    }
    : code;
};

/**
 * Given the user id, return the list of courses in the studyplan
 * @param {number} user_id the id of the user
 */
exports.getStudyPlan = async (user_id) => {
  const detailed = 1;
  try {

    const courses = await dao.getStudyPlan(user_id);

    const fulltime = await userDao.getUserFullTimeInfo(user_id);

    const allCourses = await dao.listCourses();
    let totCfu = 0;
    for (const course of courses) {
      totCfu += course.cfu;


      course.incompatibilities = await dao.getIncompatibilities(course.code);
      if (detailed) {
        course.propaedeuticity = getCourseInfo(allCourses, course.propaedeuticity, detailed);
        course.incompatibilities = course.incompatibilities
          ? course.incompatibilities.map((c) =>
            getCourseInfo(allCourses, c, detailed)
          ).sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }

            // names must be equal
            return 0;
          })
          : undefined;
      }


    }
    return { fulltime: fulltime, totCfu: totCfu, courses: courses };
  } catch (err) {
    throw err;
  }
};

/**
 * Insert the studyplan of the logged in user
 * @param {boolean} fulltime 0:part-time , 1: full-time
 * @param {number} user_id the id of the user
 * @param {array<string>} courses an array of courses to be inserted
 */
exports.insertStudyPlan = async (fulltime, user_id, courses) => {
  try {

    const studyPlan = new StudyPlan(fulltime, courses);

    const response = await studyPlanConstraintsCheck(studyPlan, user_id);

    if (response.type === "ok") //in response.type ci può essere ok o il codice di errore
      await dao.insertStudyPlan(studyPlan, user_id);
    return response;
  } catch (err) {
    throw err;
  }
};

/**
 * Edit the studyplan of the logged in user
 * @param {boolean} fulltime 0:part-time , 1: full-time
 * @param {number} user_id the id of the user
 * @param {array<string>} courses an array of courses to be inserted
 */
exports.editStudyPlan = async (fulltime, user_id, courses) => {
  try {
    const studyPlan = new StudyPlan(fulltime, courses);
    const response = await studyPlanConstraintsCheck(studyPlan, user_id);
    if (response.type === "ok") //in response.type ci può essere ok o il codice di errore
    {
      //la edit per semplicità si fa eliminando il vecchio e inserendo il nuovo
      await dao.deleteStudyPlan(user_id);
      await dao.insertStudyPlan(studyPlan, user_id);
    }
    return response;

  } catch (err) {
    throw err;
  }
};

/**
 * Given the user id, delete the corresponding studyPlan
 * @param {number} user_id the id of the user
 */
exports.deleteStudyPlan = async (user_id) => {
  try {
    await dao.deleteStudyPlan(user_id);
  } catch (err) {
    throw err;
  }
};

/**
 * Given some studyPlan informations, this function checks if the studyPlane is legit
 * @param {StudyPlan} studyPlan an object describing the studyplan to check
 * @param {number} user_id user id to check if the studyPlan for that user does not exists (in case of insert) or exists(in case of update the function retrieves it) 
 */
const studyPlanConstraintsCheck = async (studyPlan, user_id) => {
  try {

    //1)controllo che un corso stia nella lista una sola volta(no duplicati)
    const repliche = studyPlan.courses.filter(c => studyPlan.courses.filter(cc => cc === c).length > 1)
    if (repliche.length)
      return { type: 422, error: `Courses [${[...new Set(repliche)]}] have been inserted more than one time` }; //set x evitare che stesso corso sia scritto più volte

    //mi prendo le informazioni dei corsi che voglio inserire
    const courseList = await this.listCourses(false);
    const detailedCourses = studyPlan.courses.map((c) => {
      const courseFound = courseList.find((cc) => cc.code === c.toUpperCase());
      return courseFound ? courseFound : c; //se il corso non viene trovato, al posto di un oggetto Course si lascia la stringa. Stringa verrà passata all'errore poi
    });

    //2)controllo che tutti i corsi che ho nella lista esistano
    const notExisting = detailedCourses.filter(c => typeof c === 'string')
    if (notExisting.length)
      return { type: 404, error: `Courses [${notExisting}] does not exists` };

    //3)conto i cfu[FULLTIME=60-80,PART-TIME=20-40]
    const totCfu = detailedCourses.reduce((total, course) => {
      return total + course.cfu;
    }, 0);
    if (studyPlan.fulltime && !(totCfu >= 60 && totCfu <= 80))
      return { type: 422, error: `Full-time [60-80] but cfu count is ${totCfu}` };
    else if (!studyPlan.fulltime && !(totCfu >= 20 && totCfu <= 40))
      return { type: 422, error: `Part-time [20-40] but cfu count is ${totCfu}` };

    //4)controllo che tutti i corsi non siano pieni(filtrando su eventuali corsi già in frequentazione)

    //Se sto facendo update, devo controllare che ci sia posto solo nei corsi a cui ancora non partecipo
    const currentStudyPlan = await this.getStudyPlan(user_id);
    //se currentStudyPlan non è vuoto, sto aggiornando=>se tra i detailedCourses ci sono corsi in currentStudyPlan, non li controllo
    const fullFilled = detailedCourses.filter(c => !currentStudyPlan.courses.some(r => r.code === c.code))
      .filter(c => c.maxstudents && c.maxstudents <= c.enrolledstudents);
    if (fullFilled.length)
      return { type: 422, error: `Courses [${fullFilled.map(c => c.code)}] are fullfilled` };

    //5)controllo che non ci siano conflitti di incompatibilità
    const incompatibleList = detailedCourses.map((c) => {
      if (c.incompatibilities) { //se il corso ha incompatibilità
        const incompatibles = c.incompatibilities.filter(cc => detailedCourses.find((dc) => dc.code === cc) !== undefined);
        if (incompatibles.length) //se tra le incompatibilità ce n'è almeno una in lista corsi
          return { course: c.code, incompatibles: incompatibles }
        return undefined;
      }
      return undefined;
    }).filter(c => c !== undefined);
    if (incompatibleList.length)
      return { type: 422, error: `Courses [${incompatibleList.map(r => " " + r.course + " with ( " + r.incompatibles + " ) ")}] are incompatible` };

    //6)controllo che i corsi propedeutici siano in lista
    const propedeuticList = detailedCourses.map((c) => {
      if (c.propaedeuticity) { //se il corso ha un corso propedeutico
        const isPresent = detailedCourses.find(((dc) => dc.code === c.propaedeuticity));
        if (!isPresent) //se non trovo il corso propedeutico nella lista dei corsi
          return c.code;
        return undefined;
      }
      return undefined;
    }).filter(c => c !== undefined);
    if (propedeuticList.length)
      return { type: 422, error: `The propaedeutic course of these courses are missing [${propedeuticList}]` };

    //se tutto è ok, non c'è l'errore e quindi posso aggiungere/aggiornare
    return { type: "ok" };
  } catch (err) {
    throw err;
  }
};
