const Author = require('../models/author');
const Book = require("../models/book");

const debug = require('debug')('author');
const { check, body, validationResult } = require('express-validator');
debug("ahojte");
// Display list of all Authors.
exports.author_list = function (req, res) {
    Author.find()
        .sort([['family_name', 'ascending'], ["date_of_birth", "ascending"]])
        .exec(function (err, list_authors) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('author/list', { title: 'Author List', author_list: list_authors });
        });
};

// Display detail page for a specific Author.
exports.author_detail = function (req, res, next) {
    Promise.all([
        Author.findById(req.params.id),
        Book.find({ author: req.params.id }, "title summary"),
    ]).then(results => {
        let [author, author_books] = results;
        if (!author) {
            let err = new Error(" Author not found");
            err.status = 404;
            return next(err)
        }
        res.render("author/detail", { title: "Author Detail", author, author_books })

    }).catch(next);
};

// Display Author create form on GET.
exports.author_create_get = function (req, res) {
    res.render("author/form", { title: "Create Author", author: undefined, errors: undefined });
};

// Handle Author create on POST.
exports.author_create_post = [

    // Validate fields.
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    body('first_name').escape(),
    body('family_name').escape(),
    body('date_of_birth').toDate(),
    body('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author/form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {

    Promise.all([
        Author.findById(req.params.id),
        Book.find({ 'author': req.params.id }),
    ])
        .then(results => {
            let [author, author_books] = results;
            if (results.author === null) {
                res.redirect("/catalog/authors");
            }
            res.render("author/delete", { title: "Delete Author", author, author_books });
        })
        .catch(next)
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {
    Promise.all([
        Author.findById(req.body.authorid),
        Book.find({ 'author': req.body.authorid })
    ])
        .then(results => {
            let [author, author_books] = results;
            if (author_books.length > 0) {
                res.render("author/delete", { title: "Delete Author", author, author_books });
                return;
            }
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors')
            });

        })
        .catch(next);
}

// Display Author update form on GET
exports.author_update_get = function (req, res, next) {

    check(req).escape().trim();
    Author.findById(req.params.id, function (err, author) {
        if (err) {
            debug('update error:' + err);
            return next(err);
        }
        //On success
        res.render('author/form', { title: 'Update Author', author, errors: undefined });
    });

};

// Handle Author update on POST.
exports.author_update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
}