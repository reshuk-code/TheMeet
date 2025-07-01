const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const Meet = require('./models/Meet.js');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/themeet', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.get('/', async (req, res) => {
    const meets = await Meet.find({ type: 'public' }).sort({ createdAt: -1 });
    res.render('index', { meets });
});

app.get('/create', (req, res) => {
    res.render('create');
});

app.post('/create', async (req, res) => {
    const { name, topic, type } = req.body;
    let code = '';
    if (type === 'private') code = Math.random().toString(36).substr(2, 8);
    const meet = new Meet({ name, topic, type, code });
    await meet.save();
    res.redirect(type === 'public' ? `/meet/${meet._id}` : `/private?code=${code}`);
});

app.get('/meet/:id', async (req, res) => {
    const meet = await Meet.findById(req.params.id);
    if (!meet) return res.redirect('/');
    res.render('meet', { meet });
});

app.get('/private', (req, res) => {
    res.render('private', { code: req.query.code || '' });
});

app.post('/private', async (req, res) => {
    const { code } = req.body;
    const meet = await Meet.findOne({ code, type: 'private' });
    if (!meet) return res.render('private', { error: 'Invalid code', code: '' });
    res.redirect(`/meet/${meet._id}`);
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (meetId) => {
        socket.join(meetId);
    });
    socket.on('chat message', ({ meetId, msg }) => {
        io.to(meetId).emit('chat message', msg);
    });
    socket.on('signal', ({ meetId, data }) => {
        socket.to(meetId).emit('signal', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
