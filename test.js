const data = require('./data/data.json')
const { v4: uuidv4 } = require('uuid');

const newData = data.map(prod => {
	return {
		id: uuidv4(),
		...prod
	}
})

console.log(JSON.stringify(newData))
