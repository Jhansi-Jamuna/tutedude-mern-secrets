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
const bcrypt = require("bcrypt");
const User = require("./models/userSchema");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect("mongodb+srv://jamunapawar12:jhansi2313@secondsdb.nfyn5ad.mongodb.net/userDB?retryWrites=true&w=majority&appName=secondsdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Error:", err));

// Simple in-memory session (not for production)
let loggedInUser = null;

// Email and password regex
const emailRegex = /^\S+@\S+\.\S+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

// Routes

// Home page
app.get("/", (req, res) => {
    res.render("home");
});

// Register page
app.get("/register", (req, res) => {
    res.render("register");
});

// Register logic
app.post("/register", async (req, res) => {
    const { name, username: email, password } = req.body;

    if (!emailRegex.test(email)) {
        return res.send("Invalid email format");
    }

    if (!passwordRegex.test(password)) {
        return res.send("Password must have at least one uppercase, one lowercase, one number, and be at least 6 characters long.");
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.send("Email already registered");

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.send("Error registering user");
    }
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Login logic
app.post("/login", async (req, res) => {
    const { username: email, password } = req.body;

    if (!emailRegex.test(email)) {
        return res.send("Invalid email format");
    }

    if (!password) return res.send("Password required");

    try {
        const user = await User.findOne({ email });
        if (!user) return res.send("User not found");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send("Incorrect password");

        loggedInUser = user;
        res.redirect("/secrets");
    } catch (err) {
        console.error(err);
        res.send("Error during login");
    }
});

// Protected page
app.get("/secrets", (req, res) => {
    if (!loggedInUser) {
        return res.redirect("/login");
    }
    res.render("secrets", { user: loggedInUser });
});

// Logout
app.get("/logout", (req, res) => {
    loggedInUser = null;
    res.redirect("/login");
});

app.get("/submit", (req, res) => {
    if (!loggedInUser) {
        return res.redirect("/login");
    }
    res.render("submit", { user: loggedInUser });
});


app.post("/submit", async (req, res) => {
    if (!loggedInUser) return res.redirect("/login");

    const { secret } = req.body;

    try {
        await User.findByIdAndUpdate(loggedInUser._id, { secret });
        res.redirect("/secrets");
    } catch (err) {
        console.error(err);
        res.send("Error submitting secret");
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
