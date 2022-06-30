const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const bodyParser = require('body-parser');

const app = express();

const corsOption = {
    origin: '*', 
    optionsSuccessStatus: 200
}

//Connect Database
connectDB();

app.use(cors(corsOption));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Init Middleware
app.use(express.json());

//Define Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));