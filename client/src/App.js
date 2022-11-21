import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './style/App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate/*, useSearchParams, useLocation*/ } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoginForm } from './components/LoginComponents';
import Home from './components/Home'
import API from './API';
import CommonTopSide from './components/CommonTopSide';
import { Row, Col, Button, } from "react-bootstrap";

//import { useEffect, useState } from 'react';

function App() {
  return (
    <Router>
      <StudyPlanApp />
    </Router>
  );
}

function StudyPlanApp() {
  const [loggedIn, setLoggedIn] = useState(false);  // no user is logged in when app loads
  const [user, setUser] = useState({});
  const [globalErrorMsg, setGlobalErrorMsg] = useState("");     // "" means no errors to display 
  const [refreshing, setRefreshing] = useState(true);                //refreshing riferisce a login/logout
  const [refreshingMessage, setRefreshingMessage] = useState("");
  const navigate = useNavigate();

  const handleError = (err) => {
    setRefreshing(false)
    setGlobalErrorMsg(err.error)
  };

  useEffect(() => {
    setRefreshingMessage("Loading user");
    API.getUserInfo().then((u) => {
      if (u) {
        setLoggedIn(true);
        setUser(u);
      }
      setRefreshing(false)

    }).catch((err) => {
      handleError(err);
    })
  }, []);


  const doLogIn = (credentials) => {
    setGlobalErrorMsg("");
    setRefreshing(true);
    setRefreshingMessage("Loading user");

    return API.logIn(credentials)
      .then(u => {
        setUser(u);
        setLoggedIn(true);
        setRefreshing(false);
        navigate("/");
      }).catch((err) => {
        if (err.error === "Incorrect username and/or password.") {
          setRefreshing(false);
          throw err;
        } else handleError(err);
      });
  }

  const doLogOut = async () => {
    setGlobalErrorMsg("");
    setRefreshing(true);
    setRefreshingMessage("Logging out");
    await API.logOut();
    setLoggedIn(false);
    setUser({});
    setRefreshing(false);
    navigate("/");
  }
  return (
    <Routes>
      <Route path="/" element={<CommonTopSide logout={doLogOut} loggedIn={loggedIn} user={user} globalErrorMsg={globalErrorMsg} refreshing={refreshing} refreshingMessage={refreshingMessage} />}>
        <Route index element={<Home loggedIn={loggedIn} setGlobalErrorMsg={setGlobalErrorMsg} handleError={handleError} setRefreshingMessage={setRefreshingMessage} setRefreshing={setRefreshing} />} />
        <Route path='/login' element={loggedIn ? <Navigate to='/' /> : <LoginForm login={doLogIn} refreshing={refreshing} />} />
        <Route path="*" element={<NoMatch />} />
      </Route>
    </Routes>
  );
}

function NoMatch() {

  const navigate = useNavigate();
  return (
    <>
      <Row className="mb-5">
        <Col md="auto">
          <h1 className="shadowText">Questa pagina non esiste</h1>
        </Col>

      </Row>
      <Row >
        <Col>
          <Button className="roundedButton" variant="outline-danger" onClick={() => navigate('/')}>Torna alla home</Button>
        </Col>
      </Row>
    </>
  );
}

export default App;
