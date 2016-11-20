var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://chatroom.db');

conn.query('CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, body TEXT, time DATETIME DEFAULT CURRENT_TIMESTAMP)')
	.on('end', function(){
		console.log('Made table!');
	});





