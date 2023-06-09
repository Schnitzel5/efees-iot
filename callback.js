import axios from 'axios';
import * as dotenv from 'dotenv';
import FormData from 'form-data';
dotenv.config();

console.log("Application started...");

var JSESSIONID = null;
var REMEMBERME = null;

var formData = new FormData();
formData.append("username", process.env.USR);
formData.append("password", process.env.PW);
formData.append("remember-me", "on");

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "https://api.efees.duo20246.webspace.spengergasse.at";
// axios.defaults.baseURL = "http://localhost:8080";

axios.post('/login',
    formData).then((res) => {
        console.log("Login successful...");
        res.headers['set-cookie'].forEach((val) => {
            var temp = val.split(" ");
            if (temp.length > 1 && temp[0].includes("JSESSIONID")) {
                JSESSIONID = temp[0];
            } else if (temp.length > 1 && temp[0].includes("remember-me")) {
                REMEMBERME = temp[0];
            }
        });
        if (process.env.DECODED_1_TEXT === "EFEES_SIGX") {
            sendEmergency();
        }
    }).catch((err) => {
        console.error("ERROR on login...");
        console.error(err.message);
    });

function relogin(callback) {
    axios.post('/login', formData)
        .then((val) => {
            if (val.status === 200) {
                console.info("Relogin successful!");
                callback();
            } else {
                console.warn("Relogin failed with status: " + val.statusText);
            }
        })
        .catch((err) => console.error(err.message));
}

function sendEmergency() {
    const date = new Date();
    const data = `${date.getFullYear()} ${date.getMonth()} ${date.getDate()} ${date.getHours()} ${date.getMinutes()} ${date.getSeconds()}`;
    var formData = new FormData();
    formData.append("dateTime", data);
    axios.post('/api/v1/metrics/IoT/emergency',
        formData, {
        headers: {
            "Cookie": `${JSESSIONID}; ${REMEMBERME}`
        }
    })
        .then((val) => {
            if (val.status === 200) {
                console.info("Emergency signal sent!");
            } else if (val.status === 401) {
                relogin(() => sendEmergency());
            } else {
                console.warn("Emergency signal sent with status: " + val.statusText);
            }
        })
        .catch((err) => console.error(err.message));
}
