var http = require('http'); 
var express = require('express');
var engines = require('consolidate');
var app = express();
var bodyParser = require('body-parser'); 
var server = http.createServer(app);
var io = require('socket.io').listen(server);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/views'));

app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname + '/templates'); // tell Express where to find templates

var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://chatroom.db');

app.get('/recents', function(request, response){
    var sql = 'SELECT * FROM messages GROUP BY room ORDER BY time ASC';
    
    conn.query(sql, function(err, results) {
        if (!results.rowCount == 0) {
            response.send(results.rows);
        }

    });
});


app.get('/new', function(request, response){
    createNewChatroom(response);
});

function createNewChatroom(response) {
    var chatroomID = generateID();
    var sql = 'SELECT * FROM messages WHERE room=$1 ORDER BY time ASC';

    conn.query(sql, [chatroomID], function(err, results) {
        
        if (results.rowCount != 0) {
            response.redirect('/new');
        } 
    });
    
    response.send('/' + chatroomID);
}

function generateID() {
    var chatID = "";
    var alfanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++) {
        chatID += alfanumeric.charAt(Math.floor(Math.random() * alfanumeric.length));
    }

    return chatID;
}
=
app.get('/:roomName', function(request, response) {
    var name = request.params.roomName; 
    response.render('room.html', {roomName: name});
});


io.sockets.on('connection', function(socket){
    // clients emit this when they join new rooms
    console.log('a user connected');
    var roomName;
    socket.on('join', function(roomName, nickname, callback){
        
        socket.join(roomName); // this is a socket.io method
        socket.nickname = nickname; // yay JavaScript! see below
        socket.roomName = roomName;
        
        // get a list of messages currently in the room, then send it back
        var sql = "SELECT * FROM messages WHERE room = '" + roomName + "'";
        
        var messages;

        conn.query(sql, function(error, result) {
            console.log(result.rows);
            
            if (error) {
                console.log(error);
            }

            // encode the messages object as JSON and send it back
            messages = result.rows;

            callback(messages);
        });
    });

    // this gets emitted if a user changes their nickname
    socket.on('nickname', function(nickname){
        socket.nickname = nickname;
        io.sockets.in(roomName).emit('nickname', nickname);
    });


    // the client emits this when they want to send a message
    socket.on('message', function(message){
        // process an incoming message (don't forget to broadcast it to everyone!
        console.log(message);

        var roomName = message.roomName;
        
        var nickname = message.nickname; 
    
        // add to database
        var sql = "INSERT INTO messages(room, nickname, body) VALUES ($1, $2, $3)";
        
        console.log("sql is " + sql);
        
        conn.query(sql, [roomName, nickname, message.message]).on('error', console.error);
        io.sockets.in(roomName).emit('message', nickname, message.message);
    });

    socket.on('membershipChange', function(roomName, callback) {
        io.sockets.in(roomName).emit('membershipChange', callback(getActiveUsers(roomName)));
    });

    // the client disconnected/closed their browser window
    socket.on('disconnect', function() {
        socket.leave();
        io.sockets.in(socket.roomName).emit('leave');
    });

    function getActiveUsers(roomName) {

        if (io.sockets != undefined) {
            active_users = [];
            var clients = io.sockets.adapter.rooms[roomName].sockets;
            for (var clientId in clients) {
                var client_socket = io.sockets.connected[clientId];
                active_users.push(client_socket.nickname);
                console.log(client_socket.nickname);
            }
            return active_users;
        }
    }
    
});


app.get('*', function(request, response){
    response.send("You've missed the point of the application");
});



server.listen(8080);
