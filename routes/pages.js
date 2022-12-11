const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const cookieParser = require("cookie-parser");
const mysql = require("mysql");


const db = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE
});




router.get('/', (req, res) => {
	res.render('index');
});

router.get('/register', (req, res) => {
	res.render('register');
});


router.get('/login', (req, res) => {
	res.render('login');
});



router.get('/chats', (req, res) => {
    var chats = [];
    const token = req.cookies.token;
    const user = jwt.verify(token, process.env.SECRET_KEY);
    console.log(user);
    /*
    try{
        const token = req.cookie.token;
        const user = jwt.verify(token, process.env.SECRET_KEY);
        console.log(user);
    } catch{
        res.clearCookie("token");
        return res.redirect("/login");
    }
    */
    const username = user.Username; 
    const user_id = user.UserID;

    db.query('SELECT GroupID FROM `Users-Groups` WHERE UserID = ?', [user_id], function (error, results, fields) {

        if(error) {
            console.log(error);
        }
        if (results.length > 0){
            var i = 0;
            while(i < results.length){
                
                db.query('SELECT GroupID, GroupName FROM Groups WHERE GroupID = ?', [results[i].GroupID], function (err, result, field) {
                    console.log(result);
                    chats.push(result[0].GroupName);
                    console.log(chats);
                    
                });
                i++;
            }   
            //var html = "";
            //html += "<li>"+results[0].GroupID+"</li>";
            //Object.document.getElementById("chats-selector").innerHTML += html;
            console.log(chats[0]);
            res.render('chats', {chats: JSON.stringify(chats),});
           
        }
        
    });
    
	
});

router.get('/reports', (req, res) => {
	res.render('reports');
});



module.exports = router;