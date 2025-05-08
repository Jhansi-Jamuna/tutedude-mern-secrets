// const express=require('express')
// const bodyParser= require('body-parser');
// const encrypt= require('mongoose-encryption');


// var app=express();
// app.set("view engine", "ejs");
// app.use(express.urlencoded({extended: true}));
// app.use(express.static('public'))

// const mongoose=require("mongoose");
// mongoose.connect("mongodb://localhost:27017/secrets");
// const trySchema=new mongoose.Schema({
//     email:String,
//     password:String
// });
// const secret="thisislittlesecret.";
// trySchema.plugin(encrypt, {secret:secret, encryptedFields:["password"] })

// const item=mongoose.model("second", trySchema);

// app.get("/", function(req,res){
//     res.render("home");
// })

// app.get("/login", function(req,res){
//     res.render("login");
// })

// app.post("/register", async function(req, res) {
//     try {
//         const newUser = new item({
//             email: req.body.username,
//             password: req.body.password
//         });

//         await newUser.save(); // no callback here
//         res.render("secrets");
//     } catch (err) {
//         console.error(err);
//         res.send("Error saving user");
//     }
// });

// app.post("/login", async function(req, res) {
//     const username = req.body.username;
//     const password = req.body.password;

//     try {
//         const foundUser = await item.findOne({ email: username });

//         if (foundUser) {
//             if (foundUser.password === password) {
//                 res.render("secrets"); // This will render secrets.ejs
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

// app.get("/register", function(req,res){
//     res.render("register");
// })


// app.listen(5000, function(){
//     console.log("Server started");
// })


const express = require('express');
const bodyParser = require('body-parser');
const encrypt = require('mongoose-encryption');
const mongoose = require('mongoose');
require('dotenv').config(); // Optional in Render, needed for local testing

const app = express();

// Middleware & View engine
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB Atlas using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Schema & Encryption
const trySchema = new mongoose.Schema({
    email: String,
    password: String
});

trySchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = mongoose.model("User", trySchema);

// Routes
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
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

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
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

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
