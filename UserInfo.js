'use strict';

const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {type: String, required: true},
  author: {type: String},
  description:{type: String},
  status: {type: String}
})

const BooksModel = mongoose.model('Book', BookSchema);

const UserSchema = new mongoose.Schema({
  email: {type: String},
  books: [BookSchema]
})


const UserModel = mongoose.model('User', UserSchema);

module.exports = {
  UserModel,
  BooksModel,
}