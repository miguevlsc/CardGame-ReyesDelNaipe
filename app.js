/* const {
  createGame,
  joinGame,
  intitGame,
  
  shuffleCards,
  useCard,
  comprobarGanar,

  carta1and2,
  cartaSota,

  robarCarta,
  addCartasRobar,
  resetCartasRobar,
  getCartaPaloNum,
  getNextTurn,
  setNextTurn,

  cambiarTurno,
  cambiarTurnoSalto,
  saltarTurno,

  sendMsg,
  sendRoomMsg,
} = require("./model.js"); */

const express = require('express');

//const { readFileSync } = require("fs");
//const {createServer} = require('http');
const folderPath = '/client';
const http = require('http');
const createServer = http.createServer((req,res) => {
  const filePath = path.join(folderPath, req.url);
  const fileStream = fs.createReadStream(filePath);
})
const { Server } = require('socket.io');

const util = require('util')

const app = express();
/* const server = createServer({
  key: readFileSync("C:/Users/migue/Documents/SSL/rootSSL.key"),
  cert: readFileSync("C:/Users/migue/Documents/SSL/rootSSL.pem")
},app); */
const server = http.createServer(app);

//const { send } = require('process');

const io = new Server(server);

// Objeto para guardar la información de las partidas y sus jugadores
let games = {};

// ---- Permitir que express utilize archivos estáticos como motor.js y estilos.css ----
app.use(express.static("client"));


// Comprobar si el Usuario tiene un nombre (nick) válido
function validateNick(nick) {
  return String(nick).length != '' & String(nick).length != null
}


io.on('connection', (socket) => {

  try {
    console.log("Un usuario se ha conectdo " + socket.id);



  socket.on('createGame', (nick) => {

    if (validateNick(nick)) {
      console.log('Crear partida node.js: ' + nick);
      createGame(socket, nick);
    }
    else{console.log('Usuario inválido: ' + nick);}
  });

  socket.on('joinGame', (gameId, nick) => {
    if (validateNick(nick)) {
      console.log(`El usuario "${nick}" quiere unirse a la partida ${gameId}`);
      joinGame(socket, gameId, nick);
    }
    else {
      console.log('Nick no válido ');
      sendMsg(socket,'Nick inválido');
      //socket.emit('InvalidNick', );
    }
  });

  socket.on('getGameData', (gameId, nick) => {
    let isHost = false;
    if (games[gameId].host === nick){
      isHost = true;
    }else{isHost = false}
    socket.emit('getGameData', games[gameId], isHost);
  });
  
  socket.on('initGame', (gameId, nick) => {
    initGame(socket, gameId, nick);
    /* console.log(`Ha comenzado la partida con id: ${gameId}`);
    if(nick != games[gameId].host){sendMsg(socket, `Solo el host de la sala puede iniciar la partida`); console.log('Solo el host de la sala puede iniciar la partida');}
    else if(games[gameId].init === true) {sendMsg(socket, `La partida ya ha sido iniciada`);}
    else{
      //initGame(socket, gameId, nick);
      console.log(`Partida ${gameId} iniciada con éxito`);
      games[gameId].init = true;
      //this is an ES6 Set of all client ids in the room
      console.log(io.sockets.adapter.rooms.get(gameId));
      console.log(io.sockets.adapter.rooms);
      console.log(socket.rooms);
      //socket.to(gameId).emit('gameInitiated', gameId, games[gameId].users);
      let users = games[gameId].users;
      let cards = shuffleCards(games[gameId]);
      console.log('final cards: ' + JSON.stringify(cards));
      console.log('game: ' + JSON.stringify(games));
      let data = {
        'users':users,
        'turn' : ''
      };
      let shuffledDeck = games[gameId].shuffledDeck;
      console.log('shuffledDeckkk: ' + shuffledDeck);
      let firstCard = shuffledDeck[shuffledDeck.length-1];
      shuffledDeck.shift();
      console.log('shift: ' + shuffledDeck)

      games[gameId]['cards'] = cards;

      let cardsNum = [];
      games[gameId]['cardsNum'];
      for (let i = 0; i < cards.length; i++) {
        games[gameId].cardNum[cards[i]] = cards[i].length;
        
      }
      console.log('cards: ' + util.inspect(games));

      games[gameId]['lastCard'] = firstCard;
      console.log('firsCard: ' + JSON.stringify(games[gameId]));

      

      for (let i = 0; i < games[gameId].sockets.length; i++) {
        io.to(games[gameId].sockets[i]).emit('msg', 'proud');
        console.log('indexOf: ' + games[gameId].sockets.indexOf(games[gameId].sockets[i]))
        console.log('turn: ' + games[gameId].turn);
        
        data.turn = games[gameId].turn;

        console.log(data.turn);

        io.to(games[gameId].sockets[i]).emit('gameInitiated', gameId, JSON.stringify(games[gameId].users[i]), JSON.stringify(data), JSON.stringify(cards[games[gameId].users[i]]), firstCard);
                
      }
      //io.to(games[gameId].sockets[0]).emit('msg', 'sockrrret.id');
      //io.to(games[gameId].sockets[1]).emit('msg', 'sockrrret.id');
      //socket.broadcast.to(gameId).emit('gameInitiated', gameId, JSON.stringify(data));
      //io.in(gameId).emit('gameInitiated', gameId, JSON.stringify(data));
    } */
  });


  socket.on('useCard', (gameId, userId, cardNum) => {
    useCard(socket, gameId, userId, cardNum);
  });

  socket.on('robarCarta', (userId, gameId, numCards) => {
    if(games[gameId].turn == userId){
      robarCarta(socket, gameId, userId, numCards);
      let carta = games[gameId].lastCard;
      cambiarTurno(gameId,carta);
    }
    else{
      sendMsg(socket, 'No es tu turno, no puedes robar.')
    }
  });

  } catch (e) {
    error.log(e.stack);
    error.log(e.name);
    error.log(e.message);
  }
  
  

})


// TODO Crear la baraja en una función para que se cree una diferente en cada partida y no se use siempre la misma

function initGame(socket, gameId, nick){
  console.log(`Ha comenzado la partida con id: ${gameId}`);
  if(nick != games[gameId].host){sendMsg(socket, `Solo el host de la sala puede iniciar la partida`); console.log('Solo el host de la sala puede iniciar la partida');}
  else if(games[gameId].init == true) {sendMsg(socket, `La partida ya ha sido iniciada`);}
  else if(games[gameId].users <= 1) {sendMsg(socket, `Se necesita un mínimo de 2 jugadores para comenzar la partida`);}
  else{
    //initGame(socket, gameId, nick);
    console.log(`Partida ${gameId} iniciada con éxito`);
    games[gameId].init = true;
    //this is an ES6 Set of all client ids in the room
    console.log(io.sockets.adapter.rooms.get(gameId));
    console.log(io.sockets.adapter.rooms);
    console.log(socket.rooms);
    //socket.to(gameId).emit('gameInitiated', gameId, games[gameId].users);
    let users = games[gameId].users;
    let cards = shuffleCards(games[gameId]);
    console.log('final cards: ' + JSON.stringify(cards));
    console.log('game: ' + JSON.stringify(games));
    let data = {
      'users':users,
      'turn' : ''
    };
    /*  for(sock in games[gameId].sockets){
      io.to(sock).emit('msg', 'proud');
    } */
    let shuffledDeck = games[gameId].shuffledDeck;
    console.log('shuffledDeckkk: ' + shuffledDeck);
    let firstCard = shuffledDeck[shuffledDeck.length-1];
    shuffledDeck.shift();
    console.log('shift: ' + shuffledDeck)

    games[gameId]['cards'] = cards;

    let cardsNum = [];
    games[gameId]['cardsNum'];
    for (let i = 0; i < cards.length; i++) {
      games[gameId].cardNum[cards[i]] = cards[i].length;
      
    }
    console.log('cards: ' + util.inspect(games));

    games[gameId]['lastCard'] = firstCard;
    console.log('firsCard: ' + JSON.stringify(games[gameId]));

    

    for (let i = 0; i < games[gameId].sockets.length; i++) {
      io.to(games[gameId].sockets[i]).emit('msg', 'proud');
      console.log('indexOf: ' + games[gameId].sockets.indexOf(games[gameId].sockets[i]))
      console.log('turn: ' + games[gameId].turn);
      
      data.turn = games[gameId].turn;
      /* if(games[gameId].users[i] == games[gameId].turn) {
      }else{ data.turn = false;} */
      console.log(data.turn);

      io.to(games[gameId].sockets[i]).emit('gameInitiated', gameId, JSON.stringify(games[gameId].users[i]), JSON.stringify(data), JSON.stringify(cards[games[gameId].users[i]]), firstCard);
              
    }
    //io.to(games[gameId].sockets[0]).emit('msg', 'sockrrret.id');
    //io.to(games[gameId].sockets[1]).emit('msg', 'sockrrret.id');
    //socket.broadcast.to(gameId).emit('gameInitiated', gameId, JSON.stringify(data));
    //io.in(gameId).emit('gameInitiated', gameId, JSON.stringify(data));
  }
}

function shuffleCards(game){
  let deckCards = [
    'oro-1', 'bastos-1', 'copas-1', 'espadas-1',
    'oro-2', 'bastos-2', 'copas-2', 'espadas-2',
    'oro-3', 'bastos-3', 'copas-3', 'espadas-3',
    'oro-4', 'bastos-4', 'copas-4', 'espadas-4',
    'oro-5', 'bastos-5', 'copas-5', 'espadas-5',
    'oro-6', 'bastos-6', 'copas-6', 'espadas-6',
    'oro-7', 'bastos-7', 'copas-7', 'espadas-7',
    'oro-10', 'bastos-10', 'copas-10', 'espadas-10',
    'oro-11', 'bastos-11', 'copas-11', 'espadas-11',
    'oro-12', 'bastos-12', 'copas-12', 'espadas-12'
  ];
  let deck = deckCards;
  let data = {};
  console.log(deck);
  let users = game.users;
  game['shuffledDeck'] = deck.sort(()=> Math.random() - 0.5);
  let shuffledDeck = game.shuffledDeck;
  //shuffledDeck = deck.sort(()=> Math.random() - 0.5);
  console.log(shuffledDeck, users);

  game['cardsNum'] = {};
  let cardsNum = game.cardsNum;

  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    let userCards = []; 
    userCards.push(shuffledDeck[0],shuffledDeck[1],shuffledDeck[2],shuffledDeck[3],shuffledDeck[4]);
    shuffledDeck.splice(0, 5);
    console.log('shuffledDeck: '+shuffledDeck);
    data[user] = userCards;
    console.log('data: ' + JSON.stringify(data));
    cardsNum[user] = userCards.length;
    
  }
/*   games[game['turn'] = game.users.length -1]
  console.log(games[game]); */
  game['turn'] = game.users[1]
  console.log('turnA: ' + game.users.length)
  console.log('turn: ' + game.turn)
  return data;

}

function getCartaPaloNum(cardNum){
  const regex = /(\D+)-(\d+)/;
  const cartaPaloNum = cardNum.match(regex);
  return cartaPaloNum;
}

function useCard(socket, gameId, userId, cardNum) {
  
  if(games[gameId].turn != userId){
    sendMsg(socket, 'No es tu turno');
  }
  else{
    const cartaNueva = getCartaPaloNum(cardNum);
    
    let lastCard = games[gameId].lastCard;
    let cartaUltima = getCartaPaloNum(lastCard);

    if (cartaNueva && cartaUltima) {
      const paloNuevo = cartaNueva[1];
      const numeroNuevo = parseInt(cartaNueva[2]);
      const paloUltimo = cartaUltima[1];
      const numeroUltimo = parseInt(cartaUltima[2]);
      console.log('Palabra:', paloNuevo); // Output: Palabra: copas
      console.log('Número:', numeroNuevo); // Output: Número: 11

      if(numeroNuevo == 10){
        cartaSota(socket, gameId, userId, cardNum);
      }
      else if(paloNuevo == paloUltimo || numeroNuevo == numeroUltimo) {
      //if(1==1) {
        console.log('Carta válida');
        if(numeroNuevo == 1 || numeroNuevo == 2) {
          
          let result = carta1and2(socket, gameId, numeroNuevo); 
          games[gameId].lastCard = cardNum;
          const cards = games[gameId].cards[userId];
          cardIndex = cards.indexOf(cardNum);
          if(cardIndex)cards.splice(cardIndex, 1);
          console.log('Carta quitada: ' + JSON.stringify(games[gameId].cards))
          comprobarGanar(gameId, userId);

          if(result){
            cambiarTurnoSalto(gameId, cardNum);
          }else{
            cambiarTurno(gameId, cardNum);
          }
        }
        else if(numeroNuevo == 11){
          //saltarTurno(gameId);
          games[gameId].lastCard = cardNum;
          const cards = games[gameId].cards[userId];
          cardIndex = cards.indexOf(cardNum);
          if(cardIndex)cards.splice(cardIndex, 1);
          console.log('Carta quitada: ' + JSON.stringify(games[gameId].cards))
          
          comprobarGanar(gameId, userId);
          cambiarTurnoSalto(gameId, cardNum);
        }
        else{
          games[gameId].lastCard = cardNum;
          const cards = games[gameId].cards[userId];
          cardIndex = cards.indexOf(cardNum);
          if(cardIndex)cards.splice(cardIndex, 1);
          console.log('Carta quitada: ' + JSON.stringify(games[gameId].cards))
          
          comprobarGanar(gameId, userId);
          cambiarTurno(gameId, cardNum);
        }
      }
      
    } else {
      console.log('El formato no es válido');
    }
  }
  console.log('game: ' + JSON.stringify(games));
}

function carta1and2(socket, gameId, numeroNuevo){
          
  let nextUser = getNextTurn(gameId);
  console.log('nextUser: ' + nextUser);
  // Comprobamos si el siguiente usuario tiene una carta del mismo numero
  let robar;
  for(let i in games[gameId].cards[nextUser]){
    let cards = games[gameId].cards[nextUser];
    console.log('cards: ' + games[gameId].cards[nextUser]);
    console.log('card: ' + i)
    carta = getCartaPaloNum(cards[i]);
    let paloCarta = carta[1];
    let numCarta = parseInt(carta[2]);

    console.log('paloCarta:', paloCarta); // Output: Palabra: copas
    console.log('numCarta:', numCarta); // Output: Número: 11
    
    if(numCarta == numeroNuevo){
      robar = false;
      console.log('No tiene que robar');
    }
    else{
      if(robar != false){
        robar = true;
        console.log('roba tigre.' + numCarta);
      }
      }
  }

  if(robar){
    addCartasRobar(gameId, numeroNuevo);
    let userNext = getNextTurn(gameId);
    let robarNum = games[gameId].cardsRobar;
    sendMsg(socket, 'El siguiente tiene que robar: ' + robarNum + ' cartas');
    robarCarta(socket, gameId, userNext, robarNum);
    resetCartasRobar(gameId);
    //cambiarTurnoSalto(gameId, cardNum);
    return true;
    //saltarTurno(gameId);
  }else{
    // Acumular las cartas que hay que robar
    addCartasRobar(gameId, numeroNuevo);
    return false;
  }
}

function cartaSota(socket, gameId, userId, cardNum){
  console.log('sota recivida');
  socket.emit('elegirPalo');
  
  socket.on('paloElegido', (palo) => {
    console.log('palo: ' + palo)
    
    const cards = games[gameId].cards[userId];
    cardIndex = cards.indexOf(cardNum);
    if(cardIndex)cards.splice(cardIndex, 1);
    console.log('Carta quitada: ' + JSON.stringify(games[gameId].cards))
    let cartaNum = palo + '-10';
    console.log('cardNum: ' + cartaNum);
    games[gameId].lastCard = cartaNum;
    
    comprobarGanar(gameId, userId);
    cambiarTurno(gameId, cardNum); // Pasar como parametro robarCarta : bool para saber si saltar o no a un jugador
    sendRoomMsg(gameId, `Se ha cambiado el palo a ${palo}`)

  })
}

function robarCarta(socket, gameId, userId, numCards){
  let carta;
  let shuffledDeck = games[gameId].shuffledDeck;
  let cartas = [];

  for (let i = 0; i < numCards; i++) {
    
    carta = shuffledDeck[0];
    cartas.push(carta);
    shuffledDeck.shift();
    console.log('carta robada: ' + carta);
    console.log('deck: ' + shuffledDeck);

    games[gameId].cards[userId].push(carta);
    console.log('cartas usuario: ' + games[gameId].cards[userId]);
  }
  let sockets = games[gameId].sockets;
  let socketUser = sockets.at(userId);
  console.log('Socket usuario: ' + socketUser);
  console.log(games[gameId].sockets);
  //io.to(socketUser).emit('robarCarta', (carta));
  let cardsNum = games[gameId].cards[userId].length
  let cartass = games[gameId].cards[userId];
  for (let i = 0; i < games[gameId].sockets.length; i++) {
    io.to(games[gameId].sockets[i]).emit('robarCarta', cartass, userId);
  }

}

function addCartasRobar(gameId, numeroNuevo){
  let game = games[gameId];
  game.cardsRobar += numeroNuevo;
}

function resetCartasRobar(gameId){
  let game = games[gameId];
  game.cardsRobar = 0;
}

function getNextTurn(gameId){
  let users = games[gameId].users;
  let userId = games[gameId].turn;
  userNext = (users.indexOf(userId) + 1) % users.length; // devuelve un índice
  userNext = users[userNext];
  return userNext;
}

function setNextTurn(gameId){
  let userNext = getNextTurn(gameId);
  games[gameId].turn = userNext;
}


function cambiarTurno(gameId, cardNum){
  let actualTurn = games[gameId].turn;
  setNextTurn(gameId);
  console.log('turno cambiado: ' + games[gameId].turn);

  console.log('actualTurn: ' + games[gameId].cards[actualTurn].length);

  let dataUser = {
    'user': actualTurn,
    'cards': games[gameId].cards[actualTurn].length
  }

  console.log('data: ' + JSON.stringify(dataUser));

  for (let i = 0; i < games[gameId].sockets.length; i++) {
    io.to(games[gameId].sockets[i]).emit('nextTurn', games[gameId].turn,  JSON.stringify(games[gameId].users[i]), cardNum,  JSON.stringify(dataUser));
  }
}

function cambiarTurnoSalto(gameId, cardNum){
  let actualTurn = games[gameId].turn;
  setNextTurn(gameId);
  setNextTurn(gameId);
  console.log('turno cambiado: ' + games[gameId].turn);

  console.log('actualTurn: ' + games[gameId].cards[actualTurn].length);

  let dataUser = {
    'user': actualTurn,
    'cards': games[gameId].cards[actualTurn].length
  }

  console.log('data: ' + JSON.stringify(dataUser));

  for (let i = 0; i < games[gameId].sockets.length; i++) {
    io.to(games[gameId].sockets[i]).emit('nextTurn', games[gameId].turn,  JSON.stringify(games[gameId].users[i]), cardNum,  JSON.stringify(dataUser));
  }
}

function saltarTurno(gameId){
  setNextTurn(gameId);
  console.log('turno saltado: ' + games[gameId].turn);
}

function comprobarGanar(gameId, userId){
  let cards = games[gameId].cards[userId]
  if(cards.length == 0){

    for (let i = 0; i < games[gameId].sockets.length; i++) {
      io.to(games[gameId].sockets[i]).emit('partidaTerminada', userId);
    }
  }
}

const PUERTO = 3000
server.listen(3000, () => {
  console.log(`Servidor corriendo en el puerto ${PUERTO}`)
})

function sendMsg(socket, data) {
  socket.emit("msg", data);
  /* socket.emit("msg", (data) => {
    console.log("Mensaje: " + data);
    socket.emit("chat", data);
  }) */
}
function sendRoomMsg(gameId, data) {
  for (let i = 0; i < games[gameId].sockets.length; i++) {
    io.to(games[gameId].sockets[i]).emit("msgRoom", data);
  }
}

// Unirse a una partida
function joinGame (socket, gameId, nick) {
  console.log("gameId: " + gameId);
  if (!games[gameId]) {
    console.log(`No se encontró una partida con el código ${gameId}`);
  } else if (games[gameId].users.indexOf(nick) !== -1) {
    console.log(`Ya hay un usuario con el nick ${nick}, pruebe con otro`);
  } else if (games[gameId].users.length >= 4) {
    console.log(`La partida está llena`);
  } else {
    games[gameId].users.push(nick);
    games[gameId].sockets.push(socket.id);
    socket.join(gameId);
    console.log('Usuario añadido con éxito!'); 
    console.log('Games: ' + util.inspect(games));
    //console.log(io.adapter.rooms);    

    let users = games[gameId].users;
    socket.emit('joined', gameId, nick);
    for (let i = 0; i < games[gameId].sockets.length; i++) {
      io.to(games[gameId].sockets[i]).emit('userConnected',users, nick, gameId);
    }
    //io.in(gameId).emit('userConnected',users, nick, gameId);

  }
}

// Crear una partida
function createGame(socket, nick) {
  console.log(games + " gamesss");
  console.log(nick);

  let gameId = Math.floor(Math.random() * 9000) + 1000;

  if (!games[gameId]) {

    games[gameId] = {
      maxUsers: 4,
      users: [nick],
      host: nick,
      sockets: [socket.id],
      init: false,
      cardsRobar : 0
    }

    // Unir al host al grupo
    socket.join(gameId);
    //games[gameId].sockets[nick] = socket;

    console.log('Partida creada: ' + util.inspect(games[gameId]) + 'Nick: ' + nick);
    console.log('Usuarios en la partida: ' + util.inspect(games[gameId].users) + 'Nick: ' + nick);

    // Los parámetros deben ir sin paréntesis al emitir el evento pero capturarlos en el cliente con estos
    socket.emit('joined', gameId, nick);
    let users = games[gameId].users;
    for (let i = 0; i < games[gameId].sockets.length; i++) {
      io.to(games[gameId].sockets[i]).emit('userConnected',users, nick, gameId);
    }
    //io.in(gameId).emit('userConnected',{users: games[gameId].users, nick, gameId});
    console.log('nick: ' + nick, 'gameId: ' + gameId);

  }
  else{
    console.log('No se ha podido crear la partida');
  }
  console.log('Games: ' + util.inspect(games));
  //console.log('Games[gameId]: ' + util.inspect(games[gameId]));
}


/* app.get("/", (req, res) => {
  console.log("Buenas");
  res.sendFile(`${__dirname}/client/Index.html`);
})
 */
/* app.get('/game/:gameId/:nick', (req, res) => {
  const gameId = req.query.gameId;
  const nick = req.query.nick;
  res.redirect(`${__dirname}/client/game.html?gameId=${gameId}&nick=${nick}`);
  console.log('AASSDD: ' + games[gameId]);
  if(games[gameId].users[nick]){
    res.json(games[gameId]);

  }
  else {
    res.status(404).send('Juego no encontrado');
  }
}) */


/* app.get('/game/:gameId/:nick', (req, res) => {
  const { gameId } = req.params;
  const { nick } = req.params;
  res.redirect(`${__dirname}/client/game.php?gameId=${gameId}&nick=${nick}`);
  console.log('AASSDD: ' + games[gameId]);
  if(games[gameId].users[nick]){
    res.json(games[gameId]);

  }
  else {
    res.status(404).send('Juego no encontrado');
  }
}) */

