import API from '../API';
import { useEffect, useState } from 'react';

import MainView from "./MainView";

function Home(props) {

    //in home ci sta la logica globale

    const [courses, setCourses] = useState([]);
    const [studyPlan, setStudyPlan] = useState({ courses: [], fulltime: undefined, totCfu: 0 });
    const [studyPlanSafe, setStudyPlanSafe] = useState({ courses: [], fulltime: undefined, totCfu: 0 }); //serve per quando ci sono più utenti che in concorrenza inseriscono un piano di studi
    const [refreshingCourses, setRefreshingCourses] = useState(true);
    const [refreshingStudyPlan, setRefreshingStudyPlan] = useState(false);
    const [editing, setEditing] = useState(false);
    const { loggedIn, setGlobalErrorMsg, handleError, setRefreshingMessage, setRefreshing } = props;

    useEffect(() => {
        setRefreshingCourses(true);
        if (loggedIn)
            setRefreshingStudyPlan(true);
    }, [loggedIn])

    useEffect(() => {
        // fetch /api/courses
        if (refreshingCourses) {
            //se mi trovo in editing mentre carico i corsi è perchè c'è stato un conflitto
            //dunque devo poter mostrare l'errore, quindi qui ora non si deve resettare il messaggio di errore
            if (!editing)
                setGlobalErrorMsg("");
            API.getAllCourses()
                .then((c) => {
                    setCourses(c);
                    setRefreshingCourses(false);
                    if (editing) {
                        //Ora setto i corsi che sono andati in overflow
                        //prendendo i dati dai corsi rinfrescati, 
                        setStudyPlan(studyPlan => { //lato studyplan mi interessa solo aggiornare i corsi che hanno creato conflitto, mettendoli in overflow
                            return {
                                ...studyPlan,
                                courses: studyPlan.courses.map(c => {
                                    const corso = courses.find(cc => cc.code === c.code);
                                    return corso.enrolledstudents === corso.maxstudents ?
                                        { ...c, enrolledstudents: corso.enrolledstudents + 1, }
                                        : c
                                })
                            }
                        });
                        setCourses(courses => courses.map(c => { //adesso aggiorno la tab di sx
                            if (studyPlan.courses.some(x => x.code === c.code) && !studyPlanSafe.courses.some(x => x.code === c.code)) { //se il corso è nuovo nello studyplan
                                return { ...c, enrolledstudents: c.enrolledstudents + 1 };
                            }
                            else if (!studyPlan.courses.some(x => x.code === c.code) && studyPlanSafe.courses.some(x => x.code === c.code)) { //se il corso è stato cancellato in locale dallo studyplan
                                return { ...c, enrolledstudents: c.enrolledstudents - 1 };
                            }
                            return c;
                        }));
                    }
                }).catch(err => {
                    setRefreshingCourses(false);
                    setCourses([]);
                    handleError(err);
                })
        }
        //eslint-disable-next-line
    }, [refreshingCourses]);

    useEffect(() => {
        // fetch /api/studyPlan
        if (refreshingStudyPlan && loggedIn) {
            setGlobalErrorMsg("");
            API.getStudyPlan()
                .then((s) => {
                    if (s) {
                        setStudyPlan(s);
                    } else {
                        setStudyPlan({ courses: [], fulltime: undefined, totCfu: 0 });
                        setStudyPlanSafe({ courses: [], fulltime: undefined, totCfu: 0 });
                    }
                    setRefreshingStudyPlan(false);
                }).catch(err => {
                    setRefreshingStudyPlan(false);
                    setStudyPlan({ courses: [], fulltime: undefined, totCfu: 0 });
                    setStudyPlanSafe({ courses: [], fulltime: undefined, totCfu: 0 });
                    handleError(err);
                })
        } else if (!loggedIn) {
            setStudyPlan({ courses: [], fulltime: undefined, totCfu: 0 });
            setStudyPlanSafe({ courses: [], fulltime: undefined, totCfu: 0 });
        }
        //eslint-disable-next-line
    }, [refreshingStudyPlan, loggedIn]);

    const inviaStudyPlan = () => {
        const thenOperations = () => {
            setRefreshingMessage("");
            setRefreshing(false);
            setRefreshingStudyPlan(true);
            setRefreshingCourses(true);
            setEditing(false);
        }

        const catchOperations = (err) => {
            //questo refreshing è fatto perchè se la catch è dovuta al fatto che qualche altro utente mi ha rubato il posto,
            //ottengo la lista aggiornata all'ultima versione dei corsi con relativi posti occupati
            setRefreshingCourses(true);
            setEditing(true);
            handleError(err);
        }

        setRefreshingMessage("Sending studyPlan");
        setEditing(false);
        setRefreshing(true)
        studyPlan.new ?
            API.addStudyPlan(studyPlan)
                .then(() => { thenOperations(); })
                .catch(err => { catchOperations(err); })
            :
            API.updateStudyPlan(studyPlan)
                .then(() => { thenOperations(); })
                .catch(err => { catchOperations(err); })
    }

    const eliminaStudyPlan = () => {
        setRefreshingMessage("Deleting studyPlan");
        setRefreshing(true)
        API.deleteStudyPlan()
            .then(() => {
                setRefreshingMessage("");
                setRefreshing(false);
                setRefreshingCourses(true);
                setRefreshingStudyPlan(true);
            })
            .catch(err => {
                setRefreshingCourses(true);
                setRefreshingStudyPlan(true);
                handleError(err);
            })
    }

    const annullaOperazioni = () => {
        setEditing(false);
        setRefreshingCourses(true);
        setRefreshingStudyPlan(true);
    }


    return (
        <MainView
            courses={courses} studyPlan={studyPlan}
            setCourses={setCourses} setStudyPlan={setStudyPlan}
            editing={editing} setEditing={setEditing}

            loggedIn={loggedIn}

            refreshingCourses={refreshingCourses}
            setStudyPlanSafe={setStudyPlanSafe}
            refreshingStudyPlan={refreshingStudyPlan}
            eliminaStudyPlan={eliminaStudyPlan} inviaStudyPlan={inviaStudyPlan}
            annullaOperazioni={annullaOperazioni}
        />
    );
}

export default Home