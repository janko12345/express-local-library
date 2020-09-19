const BookInstance = require('../models/bookinstance');
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance/list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate("book")
        .then(bookinstance => {
            if (!bookinstance) {
                let err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            res.render("bookinstance/detail", { title: `Copy ${bookinstance.book.title}`, bookinstance })
        }).catch(next)
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {

    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) { return next(err); }
            // Successful, so render.
            res.render('bookinstance/form', { title: 'Create BookInstance', book_list: books, errors: undefined, bookinstance: undefined });
        });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().escape(),

    // Sanitize fields.
    body('status').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance/form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance });
                });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    }
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate("book")
        .then(bookinstance => {
            if (!bookinstance === null) {
                res.redirect("/catalog/bookinstances")
            }
            res.render("bookinstance/delete", { title: "Delete copy", bookinstance, book: bookinstance.book });
        })
        .catch(next)
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function (err) {
        if (err) return next(err);
        res.redirect("/catalog/bookinstances");
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};
