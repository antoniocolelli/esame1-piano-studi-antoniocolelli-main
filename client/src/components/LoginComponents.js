import { Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import ErrorAlert from './ErrorAlert';

const validator = require("email-validator");

function LoginForm(props) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('u1@p.it');
    const [password, setPassword] = useState('password');
    const [errorMsg, setErrorMsg] = useState('');
    const [validated, setValidated] = useState(false);
    const {login,refreshing}=props;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMsg('');
        const credentials = { username, password };

        // Form Validation

        setValidated(true);
        try {
            if (validator.validate(username) && password.length)
                await login(credentials)
        } catch (err) {
            setErrorMsg(err.error);
        }
    };

    return (
        <>
            {
                refreshing ?
                    false :
                    <>
                        <div className='color-overlay d-flex justify-content-center align-items-center '>        {errorMsg ? <ErrorAlert headerMsg="Login validation error" errorMsg={errorMsg} closable={true} action={() => setErrorMsg("")} /> : ''}
                        </div>
                        <div className='color-overlay d-flex justify-content-center align-items-center'>
                            <Form className='roundedElement shadowBorders p-4 p-sm-3 shadowText' noValidate onSubmit={handleSubmit} >
                                <h2>Login Form</h2>
                                <Form.Group className='mb-3  '>
                                    <Form.Label >Username</Form.Label>
                                    <Form.Control
                                        required={true}
                                        type="email"
                                        className="shadowBorders roundedInput shadowText"
                                        isInvalid={validated ? (validator.validate(username) ? false : true) : false}
                                        isValid={validated ? (validator.validate(username) ? true : false) : false}

                                        placeholder="Enter username"
                                        onChange={ev => setUsername(ev.target.value.trim().toLowerCase())}
                                        value={username}
                                    />
                                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                    <Form.Control.Feedback type="invalid">
                                        Please provide a valid email.
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className='mb-3'>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        required={true}
                                        type="password"
                                        className="shadowBorders roundedInput shadowText "
                                        placeholder="Enter password"
                                        isValid={validated ? password.length > 0 : false}
                                        isInvalid={validated ? password.length < 1 : false}
                                        onChange={ev => setPassword(ev.target.value)}
                                        value={password}
                                    />
                                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                    <Form.Control.Feedback type="invalid">
                                        Please provide a valid password.
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Button variant="primary" className=" roundedButton"  type="submit">Login</Button>
                                <Button variant="outline-danger" className="roundedButton ms-2" onClick={() => navigate('/')}>Cancel</Button>
                            </Form>
                        </div>
                    </>
            }</>
    )
}

function LogoutButton(props) {
    const {logout,user}=props;
    return (
        <div className="d-flex justify-content-center "  >
            <h4 className='px-3 shadowText'>Welcome, {user?.name}</h4><Button className="roundedButton" variant="outline-danger" onClick={logout}>Logout</Button>
        </div>
    )
}

function LoginButton() {
    const navigate = useNavigate();
    return (
        <div className="navbar-nav ms-xl-auto asPointer">
            <span className='px-2 text-light d-inline-flex align-items-center'></span><Button className="roundedButton" variant="outline-danger" onClick={() => navigate('/login')}>Login</Button>
        </div>
    )
}

export { LoginForm, LogoutButton, LoginButton };