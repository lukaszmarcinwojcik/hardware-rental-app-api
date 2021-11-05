const express = require("express");
const router = express.Router();
const sha512 = require("js-sha512");

const { createTokens } = require("../JWT");

const User = require("../models/user");

router.get("/", function (req, res, next) {
  res.json({ title: "uzytkownik" });
});

router.post("/register", (req, res) => {
  const { firstName, lastName, email, avatar, password, confirmPassword } =
    req.body.user;

  let errors = [];
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    errors.push({ message: "Please complete all fields" });
  }

  if (password !== confirmPassword) {
    errors.push({ message: "Passwords do not match" });
  }

  if (password.length < 8) {
    errors.push({
      message: "Your password must contain at least 8 characters",
    });
  }

  if (email.length > 250) {
    errors.push({
      message: "The email may contain a maximum of 250 characters",
    });
  }

  if (errors.length > 0) {
    console.log("validate errors");
    res.json({
      errors,
      user: {
        firstName,
        lastName,
        email,
        avatar,
        password,
        confirmPassword,
      },
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        console.log("This email address is already in use.");
        errors.push("This email address is already in use.");
        res.json({
          errors,
          user: {
            firstName,
            lastName,
            email,
            avatar,
            password,
            confirmPassword,
          },
        });
      } else {
        const newUser = new User({
          firstName,
          lastName,
          email: email.toLowerCase(),
          avatar,
          password,
        });
        newUser.password = sha512(newUser.password);
        newUser
          .save()
          .then((user) => {
            console.log("Successfully registered");
            res.json({
              message: "Successfully registered",
              user: {
                firstName: "",
                lastName: "",
                email: "",
                avatar: "",
                password: "",
                confirmPassword: "",
              },
            });
          })
          .catch((err) => res.json(err));
      }
    });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body.user;
  const hashpassword = sha512(password);

  let errors = [];

  if (!email) {
    errors.push({ message: "Please complete email fields" });
  }
  if (!password) {
    errors.push({ message: "Please complete password fields" });
  }

  if (errors.length > 0) {
    console.log("validate errors");
    res.json({
      errors,
      user: {
        email,
        password,
      },
    });
  } else {
    const user = User.findOne({
      email: email.toLowerCase(),
      password: hashpassword,
    }).then((user) => {
      if (!user) {
        console.log("Invalid login or password");
        errors.push({ message: "Invalid login or password" });
        res.json({
          errors,
          user: {
            email,
            password,
          },
        });
      } else {
        const accessToken = createTokens(user);
        res.json({
          message: "Successfully logged in",
          isUserLogged: true,
          accessToken: accessToken,
          user: {
            email,
            password,
          },
          userInfo: user,
        });
      }
    });
  }
});

module.exports = router;
