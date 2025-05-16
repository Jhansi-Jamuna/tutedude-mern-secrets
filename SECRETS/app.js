// const express = require('express');
// const bodyParser = require('body-parser');
// const encrypt = require('mongoose-encryption');
// const mongoose = require("mongoose");

// const app = express();

// app.set("view engine", "ejs");
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));

// // Connect to the correct MongoDB database
// mongoose.connect("mongodb+srv://jamunapawar12:jhansi2313@secondsdb.nfyn5ad.mongodb.net/userDB?retryWrites=true&w=majority&appName=secondsdb");

// // Define the schema
// const trySchema = new mongoose.Schema({
//     email: String,
//     password: String
// });

// // Apply encryption plugin
// const secret = "thisislittlesecret.";
// trySchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

// // Use 'User' to map to 'users' collection
// const User = mongoose.model("User", trySchema);

// // Routes
// app.get("/", function (req, res) {
//     res.render("home");
// });

// app.get("/login", function (req, res) {
//     res.render("login");
// });

// app.get("/register", function (req, res) {
//     res.render("register");
// });

// app.post("/register", async function (req, res) {
//     try {
//         const newUser = new User({
//             email: req.body.username,
//             password: req.body.password
//         });

//         await newUser.save();
//         res.render("secrets");
//     } catch (err) {
//         console.error(err);
//         res.send("Error saving user");
//     }
// });

// app.post("/login", async function (req, res) {
//     const username = req.body.username;
//     const password = req.body.password;

//     try {
//         const foundUser = await User.findOne({ email: username });

//         if (foundUser) {
//             if (foundUser.password === password) {
//                 res.render("secrets");
//             } else {
//                 res.send("Incorrect password");
//             }
//         } else {
//             res.send("User not found");
//         }
//     } catch (err) {
//         console.error(err);
//         res.send("Error during login");
//     }
// });

// // Start the server
// app.listen(5000, function () {
//     console.log("Server started on port 5000");
// });

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const User = require("./models/userSchema");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "VPnuEL6WpHZv9nuGrize", // Use process.env.SECRET in production
    resave: false,
    saveUninitialized: false,
  })
);

// MongoDB Connection with Mongoose Atlas URI
mongoose
  .connect("mongodb+srv://jamunapawar12:jhansi2313@secondsdb.nfyn5ad.mongodb.net/userDB?retryWrites=true&w=majority&appName=secondsdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// Email and password regex
const emailRegex = /^\S+@\S+\.\S+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

// Middleware to protect routes
const requireLogin = async (req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  next();
};

// Routes
// Show empty registration form
app.get("/register", (req, res) => {
  res.render("register", {
    error: null,
    formData: { email: "" }
  });
});

app.post("/register", async (req, res) => {
  const { name, username: email, password } = req.body;
  const formData = { email };

  if (!emailRegex.test(email)) {
    return res.render("register", {
      error: "Invalid email format",
      formData
    });
  }

  if (!passwordRegex.test(password)) {
    return res.render("register", {
      error: "Password must contain uppercase, lowercase, a number, and be at least 6 characters.",
      formData
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", {
        error: "Email already registered",
        formData
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return res.redirect("/login");
  } catch (err) {
    console.error(err);
    return res.render("register", {
      error: "Error registering user, please try again",
      formData
    });
  }
});


app.get('/login', (req, res) => {
  res.render('login', {
    error: null,
    formData: { email: '' }
  });
});

app.post('/login', async (req, res) => {
  const { username: email, password } = req.body;
  const formData = { email };

  if (!emailRegex.test(email)) {
    return res.render('login', {
      error: 'Invalid email format',
      formData
    });
  }

  if (!password) {
    return res.render('login', {
      error: 'Password is required',
      formData
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', {
        error: 'No account found with that email',
        formData
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        error: 'Incorrect password',
        formData
      });
    }

    req.session.userId = user._id;
    return res.redirect('/secrets');

  } catch (err) {
    console.error(err);
    return res.render('login', {
      error: 'Invalid email or password, try again.',
      formData
    });
  }
});


app.get("/secrets", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("secrets", { user });
  } catch (err) {
    console.error(err);
    res.send("Error loading secrets");
  }
});

app.get("/submit", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("submit", { user });
  } catch (err) {
    console.error(err);
    res.send("Error loading submit page");
  }
});

app.post("/submit", requireLogin, async (req, res) => {
  const { secret } = req.body;

  try {
    await User.findByIdAndUpdate(req.session.userId, { secret });
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.send("Error submitting secret");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
