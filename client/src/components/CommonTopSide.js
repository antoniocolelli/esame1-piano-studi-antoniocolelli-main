import { Container, Navbar, Row, Col, Spinner } from "react-bootstrap";
import { Outlet, useNavigate } from "react-router-dom";
import ErrorAlert from "./ErrorAlert";
import { LogoutButton, LoginButton } from "./LoginComponents";

function CommonTopSide(props) {
    const {logout, loggedIn, user, globalErrorMsg, refreshing, refreshingMessage}=props;
    return (
        <>
            <Container>
                <Row>
                    <Col>
                        <GlobalNavbar loggedIn={loggedIn} logout={logout} user={user} />
                    </Col>
                </Row>
            </Container>
            <Container className='below-nav'>
                {
                    globalErrorMsg ?
                        <Row><ErrorAlert headerMsg={"Error"} errorMsg={globalErrorMsg} closable={true} /></Row>
                        : false
                }
                {
                    refreshing ?
                        <Row className="mb-4">
                            <Spinner as="span" animation="border" variant="primary" size="md" role="status" aria-hidden="true" />
                            {refreshingMessage}
                        </Row>
                        : false
                }

                <Row >
                    <Col>
                        <Outlet />
                    </Col>
                </Row>
            </Container>
        </>
    );
}

function GlobalNavbar(props) {
    const navigate = useNavigate();
    const {loggedIn, logout, user}=props;

    return (
        <Navbar className="shadowBordersNavbar" fixed="top">
            <Container fluid>
                {/* Logo */}
                <Navbar.Brand title="Study plan" className="asPointer" onClick={() => { navigate('/'); }}>
                    <img src="logo.png" width="250" height="36" alt="description">
                    </img>

                </Navbar.Brand>

                {loggedIn
                    ? <LogoutButton logout={logout} user={user} />
                    : <LoginButton />
                }
            </Container>
        </Navbar>
    );
}

export default CommonTopSide