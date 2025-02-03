const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// Регистрация пользователя
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Проверка на существование пользователя с таким email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }
    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Создание токенов
    const tokens = generateTokens(newUser);

    // Добавление refresh token в http-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    res.status(400).json({ message: "Error creating user" });
  }
};

// Авторизация пользователя
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя по email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Создание токенов
    const tokens = generateTokens(user);

    // Добавление refresh token в http-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(403).json({ message: "User not found" });

    // Создание токенов
    const tokens = generateTokens(user);

    // Добавление refresh token в http-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None", // Разрешает передачу cookies между разными доменами
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None", // Разрешает передачу cookies между разными доменами
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.clearCookie("refreshToken");
    res.status(403).json({ message: "Forbidden" });
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.json({ message: "Logged out" });
};

module.exports = { register, login, refreshToken, logout };
