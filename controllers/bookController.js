const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const { body, validationResult } = require("express-validator");
const async = require('async');
const debug = require('debug')('book');
debug("šukar mange čaje");
exports.index = function (req, res) {

    async.parallel({

        book_count: function (callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function (callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function (callback) {
            BookInstance.countDocuments({ status: 'Available' }, callback);
        },
        author_count: function (callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function (callback) {
            Genre.countDocuments({}, callback);
        }
    }, function (err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function (req, res) {
    Book.find({}, 'title author')
        .populate('author')
        .exec(function (err, list_books) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('book/list', { title: 'Book List', book_list: list_books });
        });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
    Promise.all([
        Book.findById(req.params.id)
            .populate('author')
            .populate('genre'),
        BookInstance.find({ 'book': req.params.id }),
    ])
        .then(results => {
            let [book, book_instances] = results;
            if (book === null) {
                let err = new Error("Book not found");
                err.status = 404;
                return next(err)
            }
            res.render('book/detail', { title: book.title, book, book_instances });
        })
        .catch(next);


};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {

    // Get all authors and genres, which we can use for adding to our book.
    Promise.all([
        Author.find(),
        Genre.find(),
    ]).then(results => {
        let [authors, genres] = results;
        res.render("book/form", { title: "Create Book", authors, genres, book: undefined, errors: undefined, });
    }).catch(next);


};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();

    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),

    // Sanitize fields (using wildcard).
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            }, function (err, results) {
                if (err) { return next(err); }
                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book/form', { title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                //successful - redirect to new book record.
                res.redirect(book.url);
            });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
    Promise.all([
        Book.findById(req.params.id),
        BookInstance.find({ book: req.params.id }, "imprint")
    ])
        .then(results => {
            let [book, bookinstances] = results
            if (book === null) {
                res.redirect("/catalog/books");
                return;
            }
            res.render("book/delete", { title: "Delete book", book, bookinstances })
        })
        .catch(next)
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
    Promise.all([
        Book.findById(req.params.id),
        BookInstance.find({ book: req.params.id })
    ])
        .then(results => {
            let [book, bookinstances] = results;
            if (bookinstances.length) {
                res.render("book/delete", { title: "Delete book", book, bookinstances });
                return;
            }
            Book.findByIdAndRemove(req.body.bookid, function (err) {
                if (err) { return next(err); }
                res.redirect("/catalog/books")
            })
        })
        .catch(next)
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
    Book.find({ kasal: "šukar" }).then(result => console.log(result));
    // Get book, authors and genres for form.
    Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre'),
        Author.find(),
        Genre.find()
    ])
        .then(results => {
            let [book, authors, genres] = results;
            if (book === null) {
                let err = new Error("Book not found");
                err.status = 404;
                return next(err);
            }
            genres.forEach(genre => {
                book.genre.forEach(bookGenre => {
                    if (bookGenre._id.toString() === genre._id.toString())
                        genre.checked = "true";
                })
            })
            res.render("book/form", { title: "Update Book", authors, genres, book, errors: undefined })
        })
        .catch(next);


};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),

    // Sanitize fields.
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id: req.params.id //This is required, or a new ID will be assigned!
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            }, function (err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book/form', { title: 'Update Book', authors: results.authors, genres: results.genres, book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
                if (err) { return next(err); }
                // Successful - redirect to book detail page.
                res.redirect(thebook.url);
            });
        }
    }
];