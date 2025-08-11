const express = require("express");
const routes = require("./routes");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

mongoose.set('strictQuery', true)
// conexion a mongo
mongoose.connect('mongodb://0.0.0.0:27017/almacen')
.then(() => {
    console.log('Se conecto correctamente a la BDMongo')
})
.catch((err) => {
    console.log('No se conecto correctamente a la BDMongo', err)
})

//crear servidor
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))



app.use(cors());

app.use('/', routes())

//definir el puerto
const port = 4000

app.listen(port, () => {
    console.log('El servidor esta ejecutandose en el puerto' + port)
})