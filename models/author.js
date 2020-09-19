const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: { type: String, required: true, maxlength: 100 },
    family_name: { type: String, require: true, maxlength: 100 },
    date_of_birth: Date,
    date_of_death: Date,
});

AuthorSchema.virtual("name").get(function () {
    let fullname = '';
    if (this.first_name && this.family_name) {
        fullname = this.family_name + ', ' + this.first_name
    }
    if (!this.first_name || !this.family_name) {
        fullname = '';
    }

    return fullname;
});

AuthorSchema.virtual("lifespan").get(function () {
    let death_date = this.date_of_death === undefined || this.date_of_death === null ? new Date() : this.date_of_death;
    let birth_date = this.date_of_birth;
    if (birth_date === undefined || birth_date === null)
        return "unknown"
    else
        return (death_date.getYear() - birth_date.getYear()).toString()
});

AuthorSchema
    .virtual('url')
    .get(function () {
        return '/catalog/author/' + this._id;
    });
AuthorSchema.virtual("date_of_birth_formatted").get(function () {
    return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
});
AuthorSchema
    .virtual("date_of_death_formatted")
    .get(function () {
        return this.date_of_death ? moment(this.date_of_death).format("YYYY-MM-DD") : "";
    })
module.exports = mongoose.model('Author', AuthorSchema);