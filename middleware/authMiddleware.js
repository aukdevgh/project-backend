const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  let accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(accessToken, process.env.ACCESS_SECRET, (err, decoded) => {
    if (!err) {
      req.user = decoded;
      return next(); // Если accessToken валиден, продолжаем
    }

    // Если accessToken протух, проверяем refreshToken
    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      (refreshErr, refreshDecoded) => {
        if (refreshErr) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Генерируем новый accessToken
        const newAccessToken = jwt.sign(
          { id: refreshDecoded.id, email: refreshDecoded.email },
          process.env.ACCESS_SECRET,
          { expiresIn: "15m" },
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });

        req.user = refreshDecoded;
        next();
      },
    );
  });
};

module.exports = authMiddleware;
