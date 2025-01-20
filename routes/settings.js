const express = require('express');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Получить настройки пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const settings = await Settings.findOne({ userId: req.user.id });
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }
        res.json(settings.jsonSettings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Создать / Обновить настройки пользователя
router.put('/', authMiddleware, async (req, res) => {
    const { jsonSettings } = req.body;
    console.log(req.user);

    try {
        let settings = await Settings.findOne({ userId: req.user.id });

        if (settings) {
            settings.jsonSettings = jsonSettings; // обновляем
            await settings.save();
        } else {
            settings = new Settings({ userId: req.user.id, jsonSettings });
            await settings.save(); // создаем
        }

        res.json({ jsonSettings: settings.jsonSettings });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
