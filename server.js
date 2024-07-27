const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/gymtracker', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

const PerformanceSchema = new mongoose.Schema({
  username: String,
  workout: String,
  duration: Number
});

const User = mongoose.model('User', UserSchema);
const Performance = mongoose.model('Performance', PerformanceSchema);

const JWT_SECRET = 'your_jwt_secret'; // Change this to a secure key

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).send('User created!');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ username }, JWT_SECRET);
  res.json({ token });
});

app.post('/performance', async (req, res) => {
  const { token, workout, duration } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const performance = new Performance({
      username: decoded.username,
      workout,
      duration
    });
    await performance.save();
    res.status(201).send('Performance recorded!');
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
});

app.get('/performance', async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const performances = await Performance.find({ username: decoded.username });
    res.json(performances);
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
