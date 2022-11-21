/**
 * All the API calls
 */
const { Course } = require("./utils/Course");
const { StudyPlan } = require("./utils/StudyPlan");

const APIURL = new URL('http://localhost:3001/api/');


async function getAllCourses() {
    // call: GET /api/courses
    return new Promise((resolve, reject) => {
        fetch(new URL(`courses`, APIURL), { credentials: 'include' })
            .then(async (response) => {
                if (response.ok) {

                    const coursesJson = await response.json();
                    resolve(coursesJson.map((c) => (new Course(c.code, c.name, c.cfu, c.enrolledstudents, c.maxstudents, c.propaedeuticity, c.incompatibilities))));
                }
                else {
                    // errors 
                    response.json()
                        .then((message) => { reject(message); }) // error message in the response body error:qualcosa
                        .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
                }
            })
            .catch(() => { reject({ error: "Cannot communicate with the server." }) });
    });
}

async function getStudyPlan() {
    // call: GET /api/studyplan
    return new Promise((resolve, reject) => {
        fetch(new URL(`studyplan`, APIURL), { credentials: 'include' })
            .then(async (response) => {
                if (response.ok) {
                    let studyplanJson = await response.json();
                    studyplanJson.courses=studyplanJson.courses.map((c) => (new Course(c.code, c.name, c.cfu, c.enrolledstudents, c.maxstudents, c.propaedeuticity, c.incompatibilities)))
                    resolve(studyplanJson);
                } else if (response.status === 404) { //se non è presente, sia devo poter andare avanti
                    resolve(null);

                } else {
                    // errors 
                    response.json()
                        .then((message) => { reject(message); }) // error message in the response body error:qualcosa
                        .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
                }
            })
            .catch(() => { reject({ error: "Cannot communicate with the server." }) });
    });
}

/**
 * Constructor function for new StudyPlan objects
 * @param {StudyPlan} studyPlan studyPlan to add to the database
 */

function addStudyPlan(studyPlan) {
    // call: POST /api/studyplan
    return new Promise((resolve, reject) => {
        fetch(new URL('studyplan', APIURL), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(new StudyPlan(studyPlan.fulltime, studyPlan.courses)),
        })
            .then(response => {
                if (response.ok) {
                    resolve(null);
                } else {
                    // errors 
                    response.json()
                        .then((message) => { reject(message); }) // error message in the response body
                        .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
                }
            })
            .catch(() => { reject({ error: "Cannot communicate with the server." }) });
    });
}

/**
 * Constructor function for editing StudyPlan objects
 * @param {StudyPlan} studyPlan studyPlan to edit
 */


function updateStudyPlan(studyPlan) {
    // call: PUT /api/studyplan
    return new Promise((resolve, reject) => {
        fetch(new URL('studyplan', APIURL), {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(new StudyPlan(studyPlan.fulltime, studyPlan.courses)),
        }).then(response => {
            if (response.ok) {
                resolve(null);
            } else {
                // errors 
                response.json()
                    .then((message) => { reject(message); }) // error messages in the response body
                    .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
            }
        }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
    });
}

function deleteStudyPlan() {
    // call: DELETE /api/studyplan
    return new Promise((resolve, reject) => {
        fetch(new URL(`studyplan`, APIURL), {
            method: 'DELETE',
            credentials: 'include'
        })
            .then(response => {
                if (response.ok)
                    resolve(null);
                else {
                    // errors 
                    response.json()
                        .then((message) => { reject(message); }) // error message in the response body
                        .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
                }
            })
            .catch(() => { reject({ error: "Cannot communicate with the server." }) });
    });
}

async function logIn(credentials) {
    return new Promise((resolve, reject) => {
        fetch(new URL(`sessions`, APIURL), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })
            .then(async (response) => {
                if (response.ok) {
                    const user = await response.json();
                    resolve(user);
                }
                else {
                    // errors 
                    response.json()
                        .then((e) => { reject(e); }) // error message in the response body
                        .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
                }
            })
            .catch(() => { reject({ error: "Cannot communicate with the server." }) });
    });

}

async function logOut() {

    return new Promise((resolve, reject) => {
        fetch(new URL('sessions/current', APIURL), { method: 'DELETE', credentials: 'include' })
        .then(resolve(null)).catch(() => { reject({ error: "Cannot communicate with the server." }) });
        });


}

async function getUserInfo() {

    return new Promise((resolve, reject) => {
        fetch(new URL(`sessions/current`, APIURL), { credentials: 'include' })
            .then(async (response) => {
                if (response.ok) {
                    const userInfo = await response.json();
                    resolve(userInfo);
                }
                else if (response.status === 401) { //se non è authenticated, sia devo poter andare avanti
                    resolve(null);
                } else {
                    // errors 
                    response.json()
                        .then((message) => { reject(message); }) // error message in the response body
                        .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
                }
            })
            .catch(() => { reject({ error: "Cannot communicate with the server." }) });
    });
}

const API = { getAllCourses, getStudyPlan, addStudyPlan, updateStudyPlan, deleteStudyPlan, logIn, logOut, getUserInfo };
export default API;