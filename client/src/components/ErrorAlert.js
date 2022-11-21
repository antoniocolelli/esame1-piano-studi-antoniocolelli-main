import { useState } from "react";
import { Alert, } from "react-bootstrap";

function ErrorAlert(props) {
    const [show, setShow] = useState(true);
    const {headerMsg ,errorMsg, closable}=props;
    const allowClose = closable || false;
    return <>
        {show ?
            <Alert variant="danger" className="roundedError" onClose={() => setShow(false)} {...(allowClose ? { dismissible: allowClose } : {})}>
                <Alert.Heading>{headerMsg}</Alert.Heading>
                <p>
                    {errorMsg}
                </p>
            </Alert>
            : false
        }
    </>;
}


export default ErrorAlert