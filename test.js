const data = require('./data/data.json');
const { v4: uuidv4 } = require('uuid');

const newData = data.map((prod) => {
    return {
        id: uuidv4(),
        ...prod,
    };
});

console.log(JSON.stringify(newData));

// Пример добавления комментария с рейтингом:
fetch('https://your-server-url/api/comments/60d21b4667d0d8992e610c85', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'your_jwt_token_here', // JWT токен для авторизации
    },
    body: JSON.stringify({
        text: 'This is a great product! Highly recommend.',
        rating: 5,
    }),
})
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error('Error:', error));

// Пример получения комментариев:
fetch('https://your-server-url/api/comments/60d21b4667d0d8992e610c85', {
    method: 'GET',
    headers: {
        'x-auth-token': 'your_jwt_token_here', // JWT токен для авторизации
    },
})
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error('Error:', error));

/**
 * пример ответа
 * 
 * [{
    "_id": "60d2345678f1234abc123456",
    "productId": "60d21b4667d0d8992e610c85",
    "userId": {
      "_id": "60d20b4667d0d8992e610c80",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "text": "This is a great product! Highly recommend.",
    "rating": 5,
    "createdAt": "2021-06-20T12:34:56.789Z",
    "__v": 0
  },
...
]
 */
