import CoursesManagement from "./CoursesManagement";
import { Row, Col, Spinner, Button, } from "react-bootstrap";
import Tooltip from 'react-bootstrap/Tooltip'
import { useEffect } from 'react';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger'

function MainView(props) {
    //in MainView ci sta la logica della visualizzazione

    const { courses, studyPlan,
        setCourses, setStudyPlan,
        editing, setEditing,
        loggedIn,
        refreshingCourses,
        setStudyPlanSafe,
        refreshingStudyPlan,
        eliminaStudyPlan, inviaStudyPlan,
        annullaOperazioni
    } = props;

    const calcoloDipendenze = () => { //qui dentro ci entro quando premo edit/create/add/delete
        dipendenzeCourses();
        dipendenzeStudyPlan();
    }

    useEffect(() => {
        if (editing) {
            calcoloDipendenze();
        }
        //eslint-disable-next-line
    }, [studyPlan.courses.length, editing])

    const dipendenzeCourses = () => {
        let coursesList = courses;
        coursesList.forEach((c) => {
            //dipendenze lato courses
            //1)controllo che il corso non sia già nello studyPlan
            if (studyPlan.courses.some(r => r.code === c.code)) {
                coursesList = coursesList.map(cc => (cc.code === c.code) ? { ...cc, message: 'il corso è già nello studyPlan' } : cc);
                return;
            }

            //2)controllo che il corso non sia pieno
            if (c.maxstudents !== undefined && c.enrolledstudents >= c.maxstudents) {
                coursesList = coursesList.map(cc => (cc.code === c.code) ? { ...cc, message: 'il corso ha raggiunto il numero massimo di studenti iscrivibili' } : cc);
                return;
            }

            //3)controllo che non ci siano conflitti di incompatibilità
            if (c.incompatibilities) { //se il corso ha incompatibilità
                const incompatibles = c.incompatibilities.filter(cc => studyPlan.courses.find((dc) => dc.code === cc.code) !== undefined);
                if (incompatibles.length) {
                    coursesList = coursesList.map(cc => (cc.code === c.code) ? { ...cc, message: `Questo corso è incompatibile con i seguenti corsi dello studyPlan: [${incompatibles.map(r => " " + r.code + " ")}]` } : cc);
                    return;
                }
            }

            //4)controllo che i corsi propedeutici siano in lista
            if (c.propaedeuticity) {
                const isPresent = studyPlan.courses.some(cc => cc.code === c.propaedeuticity.code)
                if (!isPresent) {
                    coursesList = coursesList.map(cc => (cc.code === c.code) ? { ...cc, message: `Questo corso non può essere aggiunto perchè il suo corso propedeutico [ ${c.propaedeuticity.code} ] non è nello studyPlan` } : cc);
                    return;
                }
            }

            //5)controllo che inserendo il corso non si sforino i cfu[FULLTIME=60-80,PART-TIME=20-40]
            if ((studyPlan.fulltime && (studyPlan.totCfu + c.cfu > 80)) ||
                (!studyPlan.fulltime && (studyPlan.totCfu + c.cfu > 40))) {
                coursesList = coursesList.map(cc => (cc.code === c.code) ? { ...cc, message: 'inserendo il corso si sfora il max di cfu' } : cc);
                return;
            }

            //se tutto è ok, non c'è l'errore e quindi posso aggiungere
            coursesList = coursesList.map(cc => (cc.code === c.code) ? { ...cc, message: 'ok' } : cc);
            return;
        });
        setCourses(coursesList);
    }

    const dipendenzeStudyPlan = () => {
        let courses = studyPlan.courses;
        courses.forEach((c) => {
            //1)controllo che il corso non sia propedeutico per qualche altro corso nello studyPlan
            const propedeutis = courses.filter(cc => { return cc.propaedeuticity !== undefined ? cc.propaedeuticity.code === c.code : false });
            if (propedeutis.length) {
                courses = courses.map(cc => (cc.code === c.code) ? { ...cc, message: `Questo corso è propedeutico per i seguenti corsi dello studyPlan: [${propedeutis.map(r => " " + r.code + " ")}]` } : cc);
                return;
            }
            courses = courses.map(cc => (cc.code === c.code) ? { ...cc, message: `ok` } : cc);
            return;
        })
        setStudyPlan(studyPlan => { return { ...studyPlan, courses: courses } });
    }

    return (
        <Row className="mb-4 ">
            <FirstCol
                courses={courses} studyPlan={studyPlan}
                setCourses={setCourses} setStudyPlan={setStudyPlan}
                editing={editing} loggedIn={loggedIn}
                refreshingCourses={refreshingCourses}
            />

            <Col md="auto">
            </Col>

            <SecondCol
                courses={courses} studyPlan={studyPlan}
                setCourses={setCourses} setStudyPlan={setStudyPlan}
                setStudyPlanSafe={setStudyPlanSafe}
                editing={editing} setEditing={setEditing}
                refreshingStudyPlan={refreshingStudyPlan}
                eliminaStudyPlan={eliminaStudyPlan} inviaStudyPlan={inviaStudyPlan}
                annullaOperazioni={annullaOperazioni}
                loggedIn={loggedIn}
            />
        </Row>
    )
}

function FirstCol(props) {
    const {
        courses, studyPlan,
        setCourses, setStudyPlan,
        editing, loggedIn,
        refreshingCourses
    } = props;

    const addCourse = (code) => {
        setCourses(courses => courses.map(c => c.code === code ? { ...c, enrolledstudents: c.enrolledstudents + 1 } : c));
        const corso = courses.find(c => c.code === code);
        setStudyPlan(studyPlan => { return { ...studyPlan, totCfu: studyPlan.totCfu + corso.cfu, courses: studyPlan.courses.concat({ ...corso, enrolledstudents: corso.enrolledstudents + 1 }) } });
    }

    return (
        <Col className="roundedElement shadowBorders">
            <Row className={!studyPlan.courses.length && !editing ? "topFormNoStudyPlan" : "topForm"}>
                <Col>
                    <h2 className="shadowText"> Corsi disponibili </h2>
                </Col>
            </Row>
            <Row className="ms-3">
                {
                    refreshingCourses ?
                        <div className="mb-4  ms-4">
                            <Spinner as="span" animation="border" variant="primary" size="md" role="status" aria-hidden="true" />
                            Loading courses</div>
                        : (
                            courses.length === 0
                                ? <div className="mb-4 ms-4">No courses found</div>
                                : <CoursesManagement courses={courses} buttonType={"+"} buttonAction={addCourse} editing={loggedIn ? editing : false} />
                        )
                }
            </Row>
        </Col>
    )
}

function SecondCol(props) {
    const {
        courses, studyPlan,
        setCourses, setStudyPlan,
        setStudyPlanSafe,
        editing, setEditing,
        refreshingStudyPlan,
        eliminaStudyPlan, inviaStudyPlan,
        annullaOperazioni,
        loggedIn
    } = props;

    const deleteCourse = (code) => {
        setCourses(courses => courses.map(c => c.code === code ? { ...c, enrolledstudents: c.enrolledstudents - 1 } : c));
        const corso = courses.find(c => c.code === code);
        setStudyPlan(studyPlan => { return { ...studyPlan, totCfu: studyPlan.totCfu - corso.cfu, courses: studyPlan.courses.filter(c => c.code !== code) } });
    }

    const creaStudyPlan = (fullTime) => {
        setStudyPlan(studyPlan => { return { ...studyPlan, fulltime: fullTime, new: 1 } });
        setEditing(true);
    }

    const modificaStudyPlan = () => {
        setEditing(true);
        setStudyPlanSafe(studyPlan);
    }

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {canIsend() ? "Clicca per inviare lo studyPlan" : "Range cfu non rispettato"}
        </Tooltip>

    );

    const canIsend = () => {
        const totCfu = studyPlan.totCfu;
        return studyPlan.fulltime ? (totCfu >= 60 && totCfu <= 80) : (totCfu >= 20 && totCfu <= 40);
    }

    return (
        <Col className={loggedIn ? "roundedElement shadowBorders" : ""}>
            {
                loggedIn ? (
                    <>
                        <Row className={!studyPlan.courses ? "topFormNoStudyPlan" : "topForm"}>
                            <Col>
                                <Row>
                                    <h2 className="shadowText"> Piano di studi </h2>
                                </Row>
                                {studyPlan.courses.length || editing ?
                                    <Row className="ms-1">
                                        <Row>
                                            <Col><h4 className="shadowText littletext">{studyPlan.fulltime ? "Full-time [60-80]" : "Part-time [20-40]"}</h4></Col>
                                        </Row>
                                        <Row className="mb-4">
                                            <Col><h4 className="shadowText littletext">Totale crediti {studyPlan.totCfu}
                                            </h4></Col>
                                        </Row>
                                    </Row>
                                    : false
                                }
                            </Col>

                            <Col align="right">
                                {!studyPlan.courses.length && !editing
                                    ?
                                    <>
                                        <Button variant="outline-primary" onClick={() => { creaStudyPlan(0) }} className="roundedButton">Crea Part-Time</Button>
                                        <Button variant="outline-primary" onClick={() => { creaStudyPlan(1) }} className="roundedButton ms-2 ">Crea Full-Time</Button>

                                    </>
                                    : (
                                        !editing ? (
                                            <>
                                                <Button variant="outline-primary" className="roundedButton" onClick={() => { modificaStudyPlan() }}>Modifica</Button>
                                                <Button variant="outline-danger" className="roundedButton ms-2" onClick={() => { eliminaStudyPlan() }}>Elimina</Button>
                                            </>
                                        ) : (
                                            <>
                                                <OverlayTrigger
                                                    placement="bottom"
                                                    delay={{ show: 250, hide: 400 }}
                                                    overlay={renderTooltip}
                                                >
                                                    <span>
                                                        <Button variant="outline-primary" disabled={!canIsend() ? "disabled" : ""} className="roundedButton" onClick={() => inviaStudyPlan()}>Invia</Button>
                                                    </span>
                                                </OverlayTrigger>
                                                <Button variant="outline-danger" className="roundedButton ms-2" onClick={() => { annullaOperazioni() }}>Annulla</Button>
                                            </>
                                        )
                                    )}
                            </Col >
                        </Row>

                        <Row className="ms-3">
                            {
                                refreshingStudyPlan ? (
                                    <div className="mb-4 ms-4">
                                        <Spinner as="span" animation="border" variant="primary" size="md" role="status" aria-hidden="true" />
                                        Loading studyPlan</div>
                                ) : (
                                    <>{
                                        !studyPlan.courses.length && !editing
                                            ? <h3 className="mb-4 ms-4 shadowText">No studyPlan found</h3  >
                                            : <CoursesManagement courses={studyPlan.courses} buttonType={"x"} buttonAction={deleteCourse} editing={editing} />
                                    }</>
                                )
                            }
                        </Row>
                    </>
                ) :
                    <Row className="mb-3 ms-2 mt-4"> <h2 align="center" className="shadowText"> Effettuare il login per gestire il piano di studi </h2></Row>
            }
        </Col>
    )
}

export default MainView
