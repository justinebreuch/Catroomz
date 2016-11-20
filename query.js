var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://chatroom.db');

conn.query("SELECT * FROM messages", function(error, result) {
  		console.log(result);
  		
  		if (error) {
  			console.log(error);
  		}

  		for (var i = 0; i < result.rows.length; i++) {
  			var data = result.rows[i].nickname + ', ' + result.rows[i].message;
			console.log(data);
		}
});