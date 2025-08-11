const mongoose = require ("mongoose")
const Schema = mongoose.Schema

const estadoSchema = new Schema ({
    activo:{
        type:String,
        required: true,
        trim: true,
    },
    inactivo:{
        type:String,
        required: true,
        trim: true,
    },
});

module.exports = mongoose.model('estado', estadoSchema);