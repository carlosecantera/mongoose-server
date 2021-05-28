'use strict'

//Importing and setting up
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const express = require ('express');
const app = express();
app.use(cors());
app.use(express.json());
const UserInfo=require('./UserInfo.js');
const mongoose = require('mongoose');


//jwt verification stuff
const client = jwksClient({
  //CARLOS GONE, this may be a problem
  jwksUri: 'https://thefourth.us.auth0.com/.well-known/jwks.json',
});


function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function verifyToken(token, callback) {
  jwt.verify(token, getKey, {}, (err, user) => {
    if (err) {
      console.error('Something went wrong');
      return callback(err);
    }
    callback(user);
  })
}

//Mongoose database setup
console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;

//When opening the database check if it is empty and add the hard coded values if so
db.once('open', function () {
  app.listen(process.env.PORT, () => {

    //LOOK HERE!!
    UserInfo.UserModel.find({})
      .then(results => {
        if (results.length === 0) {
          const firstBook = new UserInfo.BooksModel({
              title: 'Old Man and the Sea',
              author: 'Ernest Hemingway',
          });
          const secondBook = new UserInfo.BooksModel({
            title: 'Dune',
            author: 'Frank Herbert',
        });
          const FirstUser = new UserInfo.UserModel({ email: 'nocturnumfortuna@gmail.com', books: [firstBook, secondBook] });
          FirstUser.save();
        }
      });

    console.log('API server running :::' + process.env.PORT);
  });
});


//ROUTING AREA

// GETting back the books of the user doing the request
//Connection made via Auth0 email
app.get('/books', (req, res) => {
  
  // Grab and verify token
  const token = req.headers.authorization.split(' ')[1];
  verifyToken(token, findBooks);

  //Find books of verified user
  async function findBooks(user) {
    let Users = await UserInfo.UserModel.find({ email: user.email });
    console.log(Users);
    //if the user isn't in DB yet aybe create a new user with the info passed in here
    if (!Users.length) {
      res.send([]);
    }
    //Send those books out
    console.log("Server Side return of /books get")
    console.log(Users[0].books);
    res.send(Users[0].books);
  }
});

//Alright, POSTing books now
app.post('/books', (req, res) => {
  
  // Grab and verify token
  const token = req.headers.authorization.split(' ')[1];
  verifyToken(token, postBooks);

  //Creating a new book and saving it in
  async function postBooks(user) {
    //Load in the data from the request
    let tempTitle = req.query.title;
    let tempAuthor = req.query.author;
    let tempDescription = req.query.description;
    let tempStatus = req.query.status;
    let tempBook = {title: tempTitle, 
                    author: tempAuthor, 
                    description: tempDescription, 
                    status: tempStatus};

    //Find the correct user in the DB, then add the book in, save the data, and send new data back
    let Users = await UserInfo.UserModel.find({ email: user.email })
    Users[0].books.push(tempBook);
    Users[0].save();
    res.send(Users[0].books);
  } 
});

//Alright, DELETE'ing books now
app.delete('/books/:id', (req, res) => {
  // console.log('server side delete');
  // console.log(req.params)
  
  // Grab and verify token
  const token = req.headers.authorization.split(' ')[1];
  verifyToken(token, deleteBook);

  //Find books of verified user
  async function deleteBook(user) {

    //Find the correct user in the DB
    let Users = await UserInfo.UserModel.find({ email: user.email })
    let newBooks = Users[0].books.filter((book) => (book.id !== req.params.id));
    
    //Put it back in the loaded Users[0] to be sent out to all relevant areas
    if(newBooks.length){
      Users[0].books = newBooks;
    } else {
      Users[0].books = [];
    }

    //Save the data locally and then send it back
    Users[0].save();
    res.send(Users[0].books);
  }
});

//Alright, PUT'ing books now
app.put('/books/:book', (req, res) => {
  
  // Grab and verify token
  const token = req.headers.authorization.split(' ')[1];
  verifyToken(token, updateBook);

  //Find books of verified user
  async function updateBook(user) {

    //Find the correct user in the DB
    let Users = await UserInfo.UserModel.find({ email: user.email })
    let index = Users[0].books.indexOf(req.params.book);
    Users[0].books[index] = req.params.book;
    // Users[0].books.splice(index,1,req.params.book);

    //Save the data locally and then send it back
    Users[0].save();
    res.send(Users[0].books);
  }
});

//Test to see if you sent in a correct Auth0 token
app.get('/test', (request, response) => {

  //Grab relevant info from the request
  const token = request.headers.authorization.split(' ')[1];

  // Verify the token, use the getKey from the docs above
  jwt.verify(token, getKey, {}, (err, user) => {
    if (err) {
      response.send('This threw an error: ' + err);
    }
    //Sending user back to prove they were verrified
    response.send(user);
  });
});

//proof of life check
app.get('/helloWorld', (request, response) => {
  response.send('Hello World!');
})
