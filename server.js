'use strict'

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {type: String},
  books: {type: Array}
})

const bookSchema = new mongoose.Schema({
  title: {type: String, required: true},
  author: {type: String},
  description:{type: String},
  status: {type: String}
})


const express = require ('express');
const app = express();

const BookModel= mongoose.model('books', bookSchema);
const UserModel= mongoose.model('user', userSchema);

mongoose.connect('mongodb+srv://admin:12345@cluster0.grgau.mongodb.net/books?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async() =>{
  console.log('DB connection success');
  
  let newBook = new BookModel({ title: 'Old Man and the Sea', author: 'Ernest Hemingway' });
  await newBook.save();

  let newUser = new UserModel({email: '12345@gmail.com', books: ['book1', 'book2', 'book3']});
  await newUser.save();

  
  app.listen(3002, () =>{
    // console.log(books)
  })
});


app.get('/books',async (req, res) => {

  try{ 
    let booksFromDB = await BookModeln.find({})
    res.send(booksfromDB);
  } catch (e) {
    res.status(500).send('Something went wrong :(');
  }
});





//proof of life check
app.get('/helloWorld', (request, response) => {
  response.send('Hello World!');
})
