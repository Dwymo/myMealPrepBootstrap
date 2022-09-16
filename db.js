// Database

// require module mysql2 - Database (mysql was not working, online investigation suggested mysql2 which worked)
const mysql = require('mysql2');


//Ensure these details are all added otherwise you will not connect
//Note: your IP may change so it may fail, open allowable hosts of database and change IP if so
const connection = mysql.createConnection({
//Information currently removed incase GitIgnore failes during upload to GitHub.
});

// connect to the database, log a message based on if onnection was successfull or not
connection.connect((error) => {
	if (error) {
		console.log("Connection Failed");
	} else {
		console.log("Connected");
	}
});

// export the connection so it can be used in files that require it
module.exports = connection