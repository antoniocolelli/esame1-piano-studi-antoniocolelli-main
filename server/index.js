"use strict";

const express = require("express");
const morgan = require("morgan"); // logging middleware
const { check, validationResult } = require("express-validator"); // validation middleware
const passport = require("passport"); // auth middleware
const LocalStrategy = require("passport-local").Strategy; // username and password for login
const session = require("express-session"); // enable sessions
const middleware = require("./utils/middleware"); // module  for accessing the functions
const userDao = require("./utils/user-dao"); // module for accessing the users in the DB
const cors = require("cors");

const errorFormatter = ({ location, msg, param }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** Set up Passport ***/
passport.use(
  new LocalStrategy(function (username, password, done) {
    userDao.getUser(username.toLowerCase(), password).then((user) => {
      if (!user)
        return done(null, false, {
          error: "Incorrect username and/or password.",
        });
      return done(null, user);
    });
  })
);

// serialize and de-serialize the user (user object <-> session)

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDao.getUserById(id).then((user) => {
    return done(null, user);
  })
    .catch((err) => {
      done(err, null);
    });
});

// init express
const app = new express();
const port = 3001;

// set-up the middlewares
app.use(morgan("dev"));
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "not authenticated" });
};

// custom middleware: check if a given user has a studyplane
const studyPlanePresenceCheck = (req, res, next) => {

  userDao.getUserFullTimeInfo(req.user.id)
    .then((value) => {
      return value === undefined ? res.status(404).json({ error: `Study plan not found` }) : next();
    })

};

// custom middleware: check if a given user has NOT a studyplane
const studyPlaneNotPresenceCheck = (req, res, next) => {
  userDao.getUserFullTimeInfo(req.user.id)
    .then((value) => {
      return value === undefined ? next():res.status(409).json({ error: `Study plan already present` }) ;
    })
};

// custom middleware: validate the checks
const checksValidation = async (req, res, next) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (errors.isEmpty()) return next();
  return res.status(422).json({ errors: errors.array({}) }).end();
};

// set up the session
app.use(
  session({
    // by default, Passport uses a MemoryStore to keep track of the sessions
    secret: "If you don't try, you've already failed",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "strict", // Remove SameSite Warning
    },
  })
);

// then, init passport con la session
app.use(passport.initialize());
app.use(passport.session());

/*** APIs ***/

// GET /api/courses
// Get all the courses informations
app.get("/api/courses", (req, res) => {
  middleware.listCourses(true)
    .then((courses) => {
      res.json(courses);
    })
    .catch(() => { res.status(500).json({ error: `Database error while retrieving courses` }).end(); });
});

// GET /api/studyplan
// Get the studyplan of the logged in user
app.get("/api/studyplan", isLoggedIn, studyPlanePresenceCheck, (req, res) => {
  middleware.getStudyPlan(req.user.id)
    .then((courses) => {
      res.json(courses);
    }).catch(() => res.status(500).json({ error: `Database error while retrieving studyplan` }).end());
});

// POST /api/studyplan
// Create the studyplan of the logged in user
app.post("/api/studyplan", isLoggedIn, studyPlaneNotPresenceCheck,
  check("fulltime").exists().withMessage("This field is mandatory").bail().isBoolean().withMessage("This field must be a Boolean value in the form true/false or 1/0"),
  check("courses").exists().withMessage("This field is mandatory").bail().isArray({ min: 1 }).withMessage("This field is an array and can't be empty"),
  check("courses.*").exists().withMessage("This field is mandatory").bail().isString().withMessage("This field must be a string").bail()
    .isLength({ min: 7, max: 7 }).withMessage("This field length must be 7").bail().matches(/^[A-Za-z0-9]+$/).withMessage("This field must be only made of letters and digits"),
  checksValidation,
  (req, res) => {

    middleware.insertStudyPlan(req.body.fulltime, req.user.id, req.body.courses).then((response) => {
      if (response.type === "ok") {
        res.status(201).json({ message: "Studyplan inserted" }).end();
      }
      else res.status(response.type).json({ error: response.error }).end();
    }).catch(() => res.status(503).json({ error: `Database error while creating the studyplan` }).end());
  }
);

// PUT /api/studyplan
// Update the existing studyplan of the logged in user
app.put("/api/studyplan", isLoggedIn, studyPlanePresenceCheck,
  check("fulltime").exists().withMessage("This field is mandatory").bail().isBoolean().withMessage("This field must be a Boolean value in the form true/false or 1/0"),
  check("courses").exists().withMessage("This field is mandatory").bail().isArray({ min: 1 }).withMessage("This field is an array and can't be empty"),
  check("courses.*").exists().withMessage("This field is mandatory").bail().isString().withMessage("This field must be a string").bail()
    .isLength({ min: 7, max: 7 }).withMessage("This field length must be 7").bail().matches(/^[A-Za-z0-9]+$/).withMessage("This field must be only made of letters and digits"),
  checksValidation,
  (req, res) => {
    middleware.editStudyPlan(req.body.fulltime, req.user.id, req.body.courses).then((response) => {
      if (response.type === "ok") {
        res.status(201).json({ message: "Studyplan updated" }).end();
      }
      else res.status(response.type).json({ error: response.error }).end();
    }).catch(() => res.status(503).json({ error: `Database error while updating the studyplan` }).end());
  }
);

// DELETE /api/studyplan
// Delete the studyplan of the logged in user
app.delete("/api/studyplan", isLoggedIn, studyPlanePresenceCheck,
  (req, res) => {
    middleware.deleteStudyPlan(req.user.id)
      .then(() => res.status(204).end())
      .catch(() => res.status(503).json({ error: `Database error while deleting studyplan` }).end());
  }
);

/*** Users APIs ***/

// POST /api/sessions
// login
app.post("/api/sessions", function (req, res, next) {
  try {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json(info);
      }
      // success, perform the login
      req.login(user, (err) => {
        if (err) return next(err);

        // req.user contains the authenticated user, we send all the user info back
        // this is coming from user-dao.getUser()
        return res.json(req.user);
      });
    })(req, res, next);
  } catch (error) { res.status(503).json({ error: `Database error while retrieving user info` }).end(); }
});

// DELETE /api/sessions/current
// logout
app.delete("/api/sessions/current", isLoggedIn, (req, res) => {
  try {
    req.logout(() => { res.end(); });
  } catch (error) {
    res.status(503).json({ error: `Database error during the logout` }).end();
  }
});

// GET /api/sessions/current
// check whether the user is logged in or not
app.get("/api/sessions/current", (req, res) => {
  try {
    if (req.isAuthenticated()) {
      res.status(200).json(req.user);
    } else res.status(401).json({ error: "Unauthenticated user!" });
  } catch (error) {
    res.status(503).json({ error: `Database error during the login` }).end();
  }
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
