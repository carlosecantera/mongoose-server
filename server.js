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
  jwksUri: 'https://grandvizier.us.auth0.com/.well-known/jwks.json',
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

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

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
          const FirstUser = new UserInfo.UserModel({ email: 'carlosecantera@yahoo.com', books: [firstBook, secondBook] });
          FirstUser.save();
        }
      });

    console.log('API server running :::' + process.env.PORT);
  });
});


//ROUTING AREA

app.get('/books', (req, res) => {
  

  // Grab and verify token
  const token = req.headers.authorization.split(' ')[1];
  verifyToken(token, findBooks);

  //Find books of verified user
  async function findBooks(user) {
    let Users = await UserInfo.UserModel.find({ email: user.email });
    if (!Users.length) {
      res.send([]);
    }

    console.log(Users[0].books);
    res.send(Users[0].books);
  }
});

app.get('/test', (request, response) => {

  // console.log(request);
  // console.log(request.headers);
  console.log(request.header.name);

  //From the request get the json web token from where we hope it is
  const token = request.headers.authorization.split(' ')[1];
    console.log(token);
  // Verify the token, use the getKey from the docs
  // gets an error or user back
  jwt.verify(token, getKey, {}, (err, user) => {

    //Check for an error
    if (err) {
      response.send('This threw an error: ' + err);
    }

    //Sending user back instead of token because we need the user info in the app
    response.send(user);
  });

})
// app.get('/books',async (req, res) => {

//   try{ 
//     let booksFromDB = await BookModeln.find({})
//     res.send(booksfromDB);
//   } catch (e) {
//     res.status(500).send('Something went wrong :(');
//   }
// });





//proof of life check
app.get('/helloWorld', (request, response) => {
  response.send('Hello World!');
})
