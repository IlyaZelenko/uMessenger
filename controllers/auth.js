
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');


const db = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE
});

exports.register = (req, res) => {
    
    const username = req.body.Username; 
    const phonen_num = req.body.PhoneNumber;
    const password = req.body.Password; 
    const password_confirm = req.body.PasswordConfirm;
    
    console.log(req.body);


    db.query('SELECT Username, PhoneNum FROM Users WHERE Username = ? OR PhoneNum = ?', [username, phonen_num], function (error, results, fields) {

        if(error) {
            console.log(error);
        }
        let i = 0;
        while(i < results.length){
            if(results[i].Username == username){
                return res.render('register', {
                    user_error_message: username + ' has been taken'
                });
            } 
            i++;
        }
        i = 0;
        while(i < results.length){
            if(results[i].PhoneNum == phonen_num){
                return res.render('register', {
                    phone_error_message: phonen_num + ' is already in use'
                });
            } 
            i++;
        };

        if(password !== password_confirm) {
            return res.render('register', {
                pass_error_message: 'Passwords do not match'
            });
        }
        let user_id;
        bcrypt.genSalt(8, function (err, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                console.log(hash);
                db.query('SELECT UserID FROM Users ORDER BY UserID DESC LIMIT 2', function (error, result, field) {
                    user_id = parseInt(result[0].UserID, 10) + 1;
                    db.query('INSERT INTO Users SET ?', {UserID: user_id, Username: username, PhoneNum: phonen_num, Password: hash});
                });
            });
        });
        let group_name = "";
        db.query('SELECT Username FROM Users', function (error, result, fields) {
            if(error) {
                console.log(error);
            }
            db.query('SELECT UserID FROM Users ORDER BY UserID DESC LIMIT 2', function (error2, result2, field2) {
                db.query('SELECT UserID, Username FROM Users', function (error3, result3, field3) {
                    db.query('SELECT GroupID FROM Groups ORDER BY GroupID DESC LIMIT 2', function (error1, result1, fields1) {
                        let i = 1;
                        while(i < result.length){
                            user_id = parseInt(result2[0].UserID, 10) + 1;
                            group_name = username + "-" + result3[i].Username;
                            db.query('INSERT INTO Groups SET ?', {GroupID: result1[0].GroupID + i, GroupName: group_name});
                            db.query('INSERT INTO `Users-Groups` SET ?', {UserID: result3[i].UserID, GroupID: result1[0].GroupID + i});
                            db.query('INSERT INTO `Users-Groups` SET ?', {UserID: user_id, GroupID: result1[0].GroupID + i});
                            i++;
                        }
                    });
                });
            });
        });
        
        
        /*
            29 - salt 
            $2a$08$2H2c5fxydQBr6USA8ypOFe3OEMs.KICEoy9JlUUWLwejVswq/oMBS
        */
        res.redirect('/login');

        
    });
}

exports.login = (req, response) => {
    const username = req.body.Username; 
    const password = req.body.Password; 
    
    db.query('SELECT UserID, Role, Username, Password FROM Users WHERE Username = ?', [username], function (error, results, fields) {

        if(error) {
            console.log(error);
        }
        if (results.length > 0){
            const user = {UserID: results[0].UserID, Username: results[0].Username};
            
            
            bcrypt.compare(password, results[0].Password, function(err, res) {
                    if(res){
                        if(results[0].Role == 'Admin'){
                            return response.redirect('/reports');
                        }
                        //console.log(jwt.sign(user, process.env.SECRET_KEY, {expiresIn: "24h"}));
                        response.cookie("token", jwt.sign(user, process.env.SECRET_KEY, {expiresIn: "24h"}), {
                            httpOnly: true,
                        });
                        
                        return response.redirect('/chats');
                    }
            });

            return response.render('login', {
                pass_error_message: "Incorrect password for user '" + username + "'"
            })
            
        }
        else {
                return response.render('login', {
                    user_error_message: "User with username '" + username + "' doesn't exist" 
                })
        }
        
    });

}