import { Row, Col, Button, Accordion } from "react-bootstrap";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

function CoursesManagement(props) {
    const { courses, buttonType, buttonAction, editing } = props;

    return (
        <Accordion alwaysOpen defaultActiveKey="1" className="mb-3" >
            {courses.map(
                (c) => <CourseRow key={c.code} course={c} buttonType={buttonType} buttonAction={buttonAction} editing={editing} />
            )}
        </Accordion>
    )
}

function CourseRow(props) {
    const { course, buttonType, buttonAction, editing } = props;

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {course.message !== "ok" ? course.message : "Clicca per inserire nello studyPlan"}
        </Tooltip>
    );


    return (
        <Row className="d-flex justify-content-center align-items-center mb-3">
            <Col>
                <Accordion.Item
                    className={`
                     
                    ${course.message ? (course.maxstudents && course.enrolledstudents > course.maxstudents ? "error" :
                            (course.message === 'il corso è già nello studyPlan' ? "instudyplan" :
                                (course.message !== 'ok' ? "disabled" : "")
                            )) : ""
                        }
                    `}

                    eventKey={course.code}>
                    <Accordion.Header className={`
                    accordionHeaderEdit 
                    ${course.message ? (course.maxstudents && course.enrolledstudents > course.maxstudents ? "error" :
                            (course.message === 'il corso è già nello studyPlan' ? "instudyplan" :
                                (course.message !== 'ok' ? "disabled" : "")

                            )) : ""
                        }
                    `}>
                        <CourseData course={course} />
                    </Accordion.Header>
                    <Accordion.Body className="accordionBodyEdit ">
                        {
                            <SubCourseData course={course} />
                        }
                    </Accordion.Body>
                </Accordion.Item>
            </Col>

            <Col md="auto">
                {
                    editing ? (
                        <OverlayTrigger
                            placement="bottom"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderTooltip}
                        >
                            <div>
                                <Button className={`addButton rounded-circle ${course.message ? (course.maxstudents && course.enrolledstudents > course.maxstudents ? "error" :
                                    (course.message === 'il corso è già nello studyPlan' ? "instudyplan" :
                                        (course.message !== 'ok' ? "disabled" : ""))) : ""}`}

                                    disabled={course.message && course.message !== "ok" ? "disabled" : ""} onClick={() => buttonAction(course.code)} variant="outline-primary">
                                    {
                                        buttonType === "+" ? (
                                            course.maxstudents && course.enrolledstudents > course.maxstudents ?
                                                <i className="bi bi-dash"></i> : (course.message === "il corso è già nello studyPlan" ? <i className="bi bi-check"></i> :
                                                    (course.message !== 'ok' ? <i className="bi bi-dash"></i> : <i className="bi bi-plus"></i>)
                                                )
                                        )
                                            :
                                            (course.message === "ok" && !(course.maxstudents && course.enrolledstudents > course.maxstudents) ? <i className="bi bi-x"></i> : <i className="bi bi-dash"></i>)
                                    }</Button>
                            </div>
                        </OverlayTrigger>
                    ) : false
                }
            </Col>
        </Row >
    );
}

function CourseData(props) {
    const { course } = props;
    return (
        <>
            <Row
                className={`
            d-flex justify-content-center align-items-center ${course.message && course.message !== "ok" && !(course.maxstudents && course.maxstudents < course.enrolledstudents) ?
                        "shadowTextWhite" : "shadowText"
                    }`}
            >
                <Col md="auto" >{course.code}</Col>
                <Col   >
                    <Row className="mb-1">
                        <Col    >{course.name}</Col>
                    </Row>
                    <Row className="mb-1">
                        <Col> {course.cfu} CFU</Col>
                    </Row>
                    <Row >
                        <Col> Iscrizioni: {course.enrolledstudents}{course.maxstudents ? ` su ${course.maxstudents}` : false}</Col>
                    </Row>
                </Col>
            </Row>

        </>
    );
}

function SubCourseData(props) {
    const { course } = props;
    return (
        <>
            <Row >
                <Col md="auto">
                    <Row md="auto" className="mb-2"><strong>Propedeuticità :</strong></Row>
                    <Row md="auto"><strong>Incompatibilità :</strong></Row>
                </Col>
                <Col>
                    <Row className="mb-2">
                        {course.propaedeuticity !== undefined ?

                            `${course.propaedeuticity.name} [ ${course.propaedeuticity.code} ] - ${course.cfu} CFU`
                            :
                            "nessuna"
                        }
                    </Row>
                    <Row>
                        {
                            course.incompatibilities ?
                                course.incompatibilities.map(
                                    (c) => <Row key={c.code}>
                                        {`${c.name} [ ${c.code} ] - ${course.cfu} CFU`}
                                    </Row>
                                )
                                : "nessuna"
                        }
                    </Row>
                </Col>
            </Row>
        </>
    );
}

export default CoursesManagement