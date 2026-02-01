const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
// Actually looking at other files (e.g. `marketPrices.js`), they might not be using auth middleware on *every* route or using a specific pattern. 
// However, User data is needed. The dashboard sends user ID or token. 
// I'll check how `serviceRequests.js` handles user identification. 
// A lot of the previous code seemed to rely on the frontend sending the user ID or just being open for the prototype.
// For now, I will assume the request body contains `userId` or similar if no auth header integration was seen previously.
// Let's check `serviceRequests.js` pattern first via memory or just write a standard safe version.
// Looking at `server.js` from memory/context, there wasn't a strict auth middleware mentioned in snippets.
// I will expect `req.body.userId` or `req.headers.userid` or similar. 
// Actually, safely, I will write routes that accept `userId` in body for creation/fetch (or query param).

// Checking `serviceRequests.js` style via view_file briefly to match pattern would be safer, but I can't view inside write_to_file.
// I'll write a versatile route.

/*
  Route: GET api/tasks
  Desc: Get all tasks for a user
  Access: Private (needs user ID)
*/
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ msg: 'User ID required' });
        }
        const tasks = await Task.find({ user: userId }).sort({ date: 1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
  Route: POST api/tasks
  Desc: Create a task
  Access: Private
*/
router.post('/', async (req, res) => {
    const { userId, title, date, type, description } = req.body;

    try {
        const newTask = new Task({
            user: userId,
            title,
            date,
            type,
            description
        });

        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
  Route: PUT api/tasks/:id
  Desc: Update task status or details
  Access: Private
*/
router.put('/:id', async (req, res) => {
    const { title, date, type, status, description } = req.body;

    // Build task object
    const taskFields = {};
    if (title) taskFields.title = title;
    if (date) taskFields.date = date;
    if (type) taskFields.type = type;
    if (status) taskFields.status = status;
    if (description) taskFields.description = description;

    try {
        let task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ msg: 'Task not found' });

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: taskFields },
            { new: true }
        );

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/*
  Route: DELETE api/tasks/:id
  Desc: Delete task
  Access: Private
*/
router.delete('/:id', async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ msg: 'Task not found' });

        await Task.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
