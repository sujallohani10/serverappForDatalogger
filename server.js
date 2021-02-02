/* Author: Govinda Lohani*/

/* import modules and declaring necessary constants*/
var express = require('express');
const fs = require('fs');
var bodyParser     =         require("body-parser");
var app = express();
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://rosterlogger:rosterlogger@cluster0-shard-00-00.a07no.mongodb.net:27017,cluster0-shard-00-01.a07no.mongodb.net:27017,cluster0-shard-00-02.a07no.mongodb.net:27017/test?ssl=true&replicaSet=atlas-h7w2ni-shard-0&authSource=admin&retryWrites=true&w=majority";

// define neccessay variables
var dataStored=[];
var dataLogIn=[];



/* to use the body parser*/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* to allow the requests*/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Allow request from everywhere
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* This fuction gets the request from the mobile app*/
app.post('/signIn', function(req, res){
	obj= JSON.parse(req.body.data);
	username=obj.username;
	console.log("Recieved......"+JSON.stringify(obj));

	// Reading data from the database with the username
	// reading data from the database
		MongoClient.connect(uri, function(err, db) {
		if (err) throw err;
		var dbo = db.db("LogInDetails");
		dbo.collection("Users").find({username:username}).toArray(function(err, result) {
		if (err) throw err;
		console.log("the retrieved data is "+JSON.stringify(result));

		// store the result in a variable
		dataStored=result;


		db.close();
		});
		});	


	// check stop if the username already has an account
	if(dataStored.length!=0){
		res.send("dupli");
	}	

	else{

		// create an array
	signInArray=[obj];

	/* write sign in details to the mongodb database*/
	MongoClient.connect(uri, function(err, client) {
		if(err) {
				console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
				res.send("no");
			}
		console.log('Writing data to the database');

		
		var col = client.db("LogInDetails").collection("Users");
		col. insertMany(signInArray,function(err,result){
			if(err) console.log(err);
			else{
				console.log('Success wititng data');
					res.send("yes");
			}
					
		}); 

				
		/* close the database connection*/
		client.close();
		}); 

	}
	
	
}); 
// sign up process finishes here

// create a app server to listen to login request
app.post('/logIn', function(req, res){
	// read recieved data
	object=JSON.parse(req.body.data);
	console.log("Recieved login details "+JSON.stringify(object));

	// read username and password
	username=object.username;
	password=object.password;

	// read data from the database from collection of users
	MongoClient.connect(uri, function(err, db) {
		if (err) throw err;
		var dbo = db.db("LogInDetails");
		dbo.collection("Users").find({username:username}).toArray(function(err, result) {
		if (err) throw err;
		console.log("the retrieved user is "+JSON.stringify(result));

		// store the result in a variable
		dataLogIn=result;

		// handle log in
		if(dataLogIn.length==0){
			res.send("acc");
		}

		else if(dataLogIn[0].password==password){
			//create an object to send back
			resObject={type: dataLogIn[0].signInType, name: dataLogIn[0].username};

			// send data back to the client
			res.send(JSON.stringify(resObject));
		}

		else{
			console.log("stored password: "+dataLogIn[0].password);
			console.log("sent password: "+password);
			res.send("no");
		}


		db.close();
		});
		});	

	
	

});
// log in process finishes here

// create a app server to post roster
app.post('/sendRoster', function(req, res){
	// read recieved data
	object=JSON.parse(req.body.data);
	console.log("Recieved login details "+JSON.stringify(object));

	// read username and password
	employeeName=object.employeeName;
	rosterData=object.rosterData;
	employerName=object.employerName;
	fromDate=object.fromDate;
	toDate=object.toDate;

	// create an object
	rosterObject={employerName: employerName, rosterData: rosterData, fromDate: fromDate, toDate:toDate}

	// create array
	rosterArray=[rosterObject];

	/* write roster details to the mongodb database*/
	MongoClient.connect(uri, function(err, client) {
		if(err) {
				console.log('Error occurred while connecting to MongoDB Cloud...\n',err);
				res.send("no");
			}
		console.log('Writing data to the database');
		
		var col = client.db("RosterDetails").collection(employeeName);
		col. insertMany(rosterArray,function(err,result){
			if(err) console.log(err);
			else{
				console.log('Success wititng data');
					res.send("yes");
			}
					
		}); 

				
		/* close the database connection*/
		client.close();
		}); 
	

});
// post roster app finishes here

// create a app server to get roster details
app.post('/getRoster', function(req, res){
	// read recieved data
	object=JSON.parse(req.body.data);
	username=object.username;
	fromDate=object.fromDate;
	toDate=object.toDate;
	console.log("Recieved username "+JSON.stringify(username));
	console.log("Recieved fromDate "+JSON.stringify(fromDate));
	console.log("Recieved toDate "+JSON.stringify(toDate));

	
	// read data from the database from collection of users
	MongoClient.connect(uri, function(err, db) {
		if (err) throw err;
		var dbo = db.db("RosterDetails");
		dbo.collection(username).find({fromDate:fromDate, toDate:toDate}).toArray(function(err, result) {
		if (err) throw err;
		console.log("the retrieved roster details is "+JSON.stringify(result));

        //check result is not empty
        if(typeof result !== 'undefined' && result.length > 0) {
            var hoursWorked;
            if(typeof result[0].workedHours !== "undefined")
            {
              hoursWorked = result[0].workedHours;
            }

            // create a response object
            rosterObj={employerName: result[0].employerName, rosterData: result[0].rosterData, fromDate:result[0].fromDate, toDate: result[0].toDate, workedHours: hoursWorked};

            // send response
            res.send(JSON.stringify(rosterObj));
        } else {
            rosterObj = {};
            res.send(JSON.stringify(rosterObj));
        }
		db.close();
		});
		});
});
// roster app finishes here

//api to get userDetails
app.post('/getUserDetails', function(req, res){
	// read recieved data
	object=JSON.parse(req.body.data);
	username=object.username;
	console.log("Recieved username "+JSON.stringify(username));

	// read data from the database from collection of users
	MongoClient.connect(uri, function(err, db) {
		if (err) throw err;
		var dbo = db.db("LogInDetails");
		dbo.collection("Users").find({username:username}).toArray(function(err, result) {
		if (err) throw err;
		console.log("the retrieved user details is "+JSON.stringify(result));

		// create a response object
		userObj={type: result[0].signInType, username: result[0].username, password: result[0].password, phoneNumber: result[0].phoneNumber, email: result[0].email};

		// send rsponse
		res.send(JSON.stringify(userObj));

		db.close();
		});
		});
});

//Employee list
app.post('/getEmployeeList', function(req, res){
	// read recieved data
	object=JSON.parse(req.body.data);
	signin_type="employee";

	// read data from the database from collection of users
	MongoClient.connect(uri, function(err, db) {
		if (err) throw err;
		var dbo = db.db("LogInDetails");
		dbo.collection("Users").find({signInType:signin_type}).toArray(function(err, result) {
		if (err) throw err;
		console.log("the retrieved user details is "+JSON.stringify(result));

		// create a response object
		//userObj={type: result[0].signInType, username: result[0].username, phoneNumber: result[0].phoneNumber};

		// send rsponse
		res.send(JSON.stringify(result));

		db.close();
		});
		});
});

// create a app server to save worked hours of employee
app.post('/saveWorkedHours', function(req, res){
	// read recieved data
	object=JSON.parse(req.body.data);
	console.log("Recieved login details "+JSON.stringify(object));

	// read username and password
	employeeName=object.employeeName;
	hoursWorked=object.hoursWorked;
	employerName=object.employerName;
	fromDate=object.fromDate;
	toDate=object.toDate;

	/* write worked hours to the mongodb database*/
	MongoClient.connect(uri, function(err, client) {
		if(err) {
				console.log('Error occurred while connecting to MongoDB Cloud...\n',err);
				res.send("no");
			}
		console.log('Writing data to the database');

		var col = client.db("RosterDetails").collection(employeeName);
		col.updateOne(
              { "employerName" : employerName, "fromDate": fromDate, "toDate": toDate},
              { $set: {"workedHours" : hoursWorked} },
              function(err,result){
                if(err) console.log(err);
                else{
                    console.log('Success writing data');
                        res.send("yes");
                }
           });

		/* close the database connection*/
		client.close();
		});


});
// post worked hours finishes here


/* define the port to listen request from*/
app.listen(3000, function(){console.log("listening on port 3000: ");});
