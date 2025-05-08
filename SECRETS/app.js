const express = require('express');
const bodyParser = require('body-parser');
const encrypt = require('mongoose-encryption');
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to the correct MongoDB database
mongoose.connect("mongodb+srv://jamunapawar12:jhansi2313@secondsdb.nfyn5ad.mongodb.net/userDB?retryWrites=true&w=majority&appName=secondsdb");

// Define the schema
const trySchema = new mongoose.Schema({
    email: String,
    password: String
});

// Apply encryption plugin
const secret = "thisislittlesecret.";
trySchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

// Use 'User' to map to 'users' collection
const User = mongoose.model("User", trySchema);

// Routes
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", async function (req, res) {
    try {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });

        await newUser.save();
        res.render("secrets");
    } catch (err) {
        console.error(err);
        res.send("Error saving user");
    }
});

app.post("/login", async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const foundUser = await User.findOne({ email: username });

        if (foundUser) {
            if (foundUser.password === password) {
                res.render("secrets");
            } else {
                res.send("Incorrect password");
            }
        } else {
            res.send("User not found");
        }
    } catch (err) {
        console.error(err);
        res.send("Error during login");
    }
});

// Start the server
app.listen(5000, function () {
    console.log("Server started on port 5000");
});
