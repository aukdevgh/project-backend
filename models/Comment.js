const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    productId: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 500,
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // минимальный рейтинг
        max: 5, // максимальный рейтинг
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
