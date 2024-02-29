// Importa el módulo 'express' para crear una aplicación web.
const express = require('express');

// Importa el módulo 'http' para crear un servidor HTTP.const http = require('http');
const http = require('http');

// Crea una instancia de la aplicación web utilizando 'express'.
const app = express();

// Crea un servidor HTTP utilizando la instancia de la aplicación.
const server = http.createServer(app);

// Importa el módulo 'socket.io' para la comunicación en tiempo real.
const { Server } = require('socket.io');

// Crea una instancia de 'Server' para manejar las conexiones y eventos en tiempo real.
const io = new Server(server);

// Objeto para guardar la información de las partidas y sus jugadores
const games = require('./data/games.json');

// Permitir que express utilize archivos estáticos como engine.js y estilos.css
app.use(express.static("client"));

// Inicializar servidor en el PUERTO 3000
const PUERTO = 3000
server.listen(3000, () => {
  console.log(`Servidor corriendo en el puerto ${PUERTO}`)
})

// Evento nativo de conexión con cliente
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
      console.log('GamesData: ' + JSON.stringify(games));
    });


    socket.on('useCard', (gameId, userId, cardNum) => {
      useCard(socket, gameId, userId, cardNum);
    });

    socket.on('robarCarta', (userId, gameId, numCards) => {
      if(games[gameId].turn == userId){
        robarCarta(gameId, userId, numCards);
        let carta = games[gameId].lastCard;
        cambiarTurno(gameId,carta, 1);
      }
      else{
        sendMsg(socket, 'No es tu turno, no puedes robar.')
      }
    });

  } catch (e) {
    console.error(e.stack);
    console.error(e.name);
    console.error(e.message);
  }
  
})

// Crear una partida
function createGame(socket, nick) {

  let gameId = Math.floor(Math.random() * 9000) + 1000;
  
  if (!games[gameId]) {

    // Añadir la información inicial del juego al objeto games{}
    games[gameId] = {
      maxUsers: 4,
      users: [nick],
      host: nick,
      sockets: [socket.id],
      init: false,
      cardsRobar : 0
    }

    // Unir al host a la sala
    gameId = gameId.toString().trim();
    socket.join(gameId);

    // Evento para informar al usuario de la creación correcta de la partida
    socket.emit('joined', gameId, nick);
    
    // Informar a toda la sala de la unión de un jugador (ayuda al usuario a imprimir la información del juego)
    io.to(gameId).emit('userConnected', games[gameId].users, gameId);
  }
}

// Unirse a una partida
function joinGame (socket, gameId, nick) {

  // Verificar el nick y el estado de la partida
  if (!games[gameId]) {
    sendMsg(socket, `No se encontró una partida con el código ${gameId}`)
  } else if (games[gameId].users.indexOf(nick) !== -1) {
    sendMsg(socket, `Ya hay un usuario con el nick ${nick}, pruebe con otro`);
  } else if (games[gameId].users.length >= 4) {
    sendMsg(socket, `La partida está llena`);
  } else {

    // Añadir usuario a la partida
    games[gameId].users.push(nick);
    games[gameId].sockets.push(socket.id);

    // Añadir el usuario a la sala
    gameId = gameId.toString().trim();
    socket.join(gameId);

    // Evento para informar al usuario para unirse a la partida
    socket.emit('joined', gameId, nick);
    
    // Informar a toda la sala de la unión de un jugador
    io.to(gameId).emit('userConnected', games[gameId].users, gameId);
  }
}

// Iniciar la partida
function initGame(socket, gameId, nick){

  if(nick != games[gameId].host){sendMsg(socket, `Solo el host de la sala puede iniciar la partida`);}
  else if(games[gameId].init == true) {sendMsg(socket, `La partida ya ha sido iniciada`);}
  else if(games[gameId].users <= 1) {sendMsg(socket, `Se necesita un mínimo de 2 jugadores para comenzar la partida`);}
  else{

    // Cambiar el estado de la partida a INICIADA
    games[gameId].init = true;

    // Generar una baraja y repartir cartas
    let cards = shuffleCards(games[gameId]);
    
    // Guardar la baraja mezclada en la información de la partida
    games[gameId]['cards'] = cards;

    // Inicar la primera carta de la baraja como la carta de apertura
    let shuffledDeck = games[gameId].shuffledDeck;
    let firstCard = shuffledDeck[shuffledDeck.length-1];
    shuffledDeck.shift();

    // Crear objeto cardsNum en la partida
    games[gameId]['cardsNum'];

    // Guardar el numero de cartas de cada jugador
    for (let i = 0; i < cards.length; i++) {
      games[gameId].cardNum[cards[i]] = cards[i].length;
    }

    // Guardar la carta de apertura como la última usada
    games[gameId]['lastCard'] = firstCard;

    // Crear objeto para mandarlo a todos los jugadores de la partida
    let data = {
      'users': games[gameId].users,
      'turn' : games[gameId].turn
    };

    // Informar a toda la sala que el juego ha sido iniciado
    for (let i = 0; i < games[gameId].sockets.length; i++) {
      io.to(games[gameId].sockets[i]).emit('gameInitiated', gameId, JSON.stringify(games[gameId].users[i]), JSON.stringify(data), JSON.stringify(cards[games[gameId].users[i]]), firstCard);      
    }     
  }
  
}

// Comprobar si el Usuario tiene un nombre (nick) válido
function validateNick(nick) {
  return String(nick).length != '' & String(nick).length != null
}

// Barajar cartas
function shuffleCards(game){

  // Crear baraja ordenada
  let deck = [
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
  
  // Mezclar la baraja y guardarla en la partida
  game['shuffledDeck'] = deck.sort(()=> Math.random() - 0.5);
  
  let shuffledDeck = game.shuffledDeck;
  
  game['cardsNum'] = {};
  let cardsNum = game.cardsNum;
  
  // Asignar cartas de la baraja a cada jugador
  let data = {};
  let users = game.users;
  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    let userCards = [];

    // Asignar cartas al usuario y quitarlas de la baraja guardada
    userCards = shuffledDeck.splice(0, 5);

    data[user] = userCards;
    cardsNum[user] = userCards.length;
    
  }

  // Se inica el turno del jugador (el siguiente al creador de la partida)
  game['turn'] = game.users[1]

  return data;
}

// Devolver la carta separando el palo y el número
function getCartaPaloNum(cardNum){
  const regex = /(\D+)-(\d+)/;
  const cartaPaloNum = cardNum.match(regex);
  return cartaPaloNum;
}

// Usar una carta
function useCard(socket, gameId, userId, cardNum) {

  // Comprobar turno del jugador
  let cards = games[gameId].cards[userId];
  const userCards = Object.values(cards);
  const cardExists = userCards.some(cards => cards.includes(cardNum));

  if(games[gameId].turn != userId){sendMsg(socket, 'No es tu turno');}
  else if(!cardExists){sendMsg(socket, 'Carta inválida')}
  else{
    
    let lastCard = games[gameId].lastCard;
    
    // Generar una lista que almacena el palo y el número
    const cartaNueva = getCartaPaloNum(cardNum);
    let cartaUltima = getCartaPaloNum(lastCard);

    if (cartaNueva && cartaUltima) {
      const paloNuevo = cartaNueva[1];
      const numeroNuevo = parseInt(cartaNueva[2]);
      const paloUltimo = cartaUltima[1];
      const numeroUltimo = parseInt(cartaUltima[2]);

      // La carta es un 10
      if(numeroNuevo == 10){
        cartaSota(socket, gameId, userId, cardNum);
      }
      // Comprobar si coinciden las cartas en palo o número
      else if(paloNuevo == paloUltimo || numeroNuevo == numeroUltimo) {
        
        games[gameId].lastCard = cardNum;

        // La carta es 1 o 2
        if(numeroNuevo == 1 || numeroNuevo == 2) {

          // Comprobar si el siguiente jugador tiene una carta igual
          let result = carta1and2(socket, gameId, numeroNuevo); 
          
          // Quitamos la carta usada de la mano del jugador
          const cards = games[gameId].cards[userId];
          let cardIndex = cards.indexOf(cardNum);
          if(cardIndex){cards.splice(cardIndex, 1)};
          
          comprobarGanar(gameId, userId);

          // Saltar o no al siguiente jugador
          if(result){
            cambiarTurno(gameId, cardNum, 2);
          }else{
            cambiarTurno(gameId, cardNum, 1);
          }


        }
        // La carta es un 11 
        else if(numeroNuevo == 11){

          // Quitamos la carta usada de la mano del jugador
          const cards = games[gameId].cards[userId];
          let cardIndex = cards.indexOf(cardNum);
          if(cardIndex){cards.splice(cardIndex, 1)};
          
          comprobarGanar(gameId, userId);

          // Saltar al siguiente jugador
          cambiarTurno(gameId, cardNum, 2);
          
        }
        // La carta es cualquier otro número
        else{
          // Quitamos la carta usada de la mano del jugador
          const cards = games[gameId].cards[userId];
          cardIndex = cards.indexOf(cardNum);
          if(cardIndex){cards.splice(cardIndex, 1)};
          
          comprobarGanar(gameId, userId);
          cambiarTurno(gameId, cardNum, 1);
        }
      }
      else{sendMsg(socket, 'No puedes usar esa carta')}
      
    } else {
      console.log('El formato no es válido');
    }
  }
}

// Gestionar carta 1 y 2
function carta1and2(socket, gameId, numeroNuevo){
   
  let nextUser = getNextTurn(gameId);

  // Comprobamos si el siguiente usuario tiene una carta del mismo numero
  let robar;
  let cards = games[gameId].cards[nextUser];
  for(let i in cards){

    carta = getCartaPaloNum(cards[i]);
    let numCarta = parseInt(carta[2]);

    
    if(numCarta === numeroNuevo){
      robar = false;
      break;
    }
    else{
      if(robar !== false){
        robar = true;
      }
      }
  }

  // Hacer robar carta/s al siguiente jugador
  if(robar){

    addCartasRobar(gameId, numeroNuevo);
    let userNext = getNextTurn(gameId);
    let sockets = games[gameId].sockets;
    let socketUser = sockets.at(userNext);

    let robarNum = games[gameId].cardsRobar;
    sendMsg(socketUser, 'Tienes que robar: ' + robarNum + ' carta/s');

    robarCarta(gameId, userNext, robarNum);
    resetCartasRobar(gameId);

    return true;

  }else{

    // Acumular las cartas que hay que robar
    addCartasRobar(gameId, numeroNuevo);
    
    return false;

  }
}

// Gestionar carta 10 / sota
function cartaSota(socket, gameId, userId, cardNum){

  //Se informa al usuario de que debe elegir un palo nuevo
  socket.emit('elegirPalo');
  
  // Recibir la respuesta del usuario
  socket.on('paloElegido', (palo) => {
    
    // Quitamos la carta usada de la mano del jugador
    const cards = games[gameId].cards[userId];
    let cardIndex = cards.indexOf(cardNum);
    if(cardIndex){cards.splice(cardIndex, 1)};

    // Cambiar la última carta al palo elegido
    let cartaNum = palo + '-10';
    games[gameId].lastCard = cartaNum;
    
    comprobarGanar(gameId, userId);
    cambiarTurno(gameId, cardNum, 1);

    sendRoomMsg(gameId, `Se ha cambiado el palo a ${palo}`)

  })
}

// Hacer robar cartas al usuario
function robarCarta(gameId, userId, numCards){
  let carta;
  let shuffledDeck = games[gameId].shuffledDeck;
  let cartas = [];

  // Robar tantas cartas como se indique
  for (let i = 0; i < numCards; i++) {
    carta = shuffledDeck[0];
    cartas.push(carta);
    shuffledDeck.shift();
    games[gameId].cards[userId].push(carta);
  }

  // Informar a los jugadores del robo de carta
  let cardsNum = games[gameId].cards[userId];
  io.to(gameId).emit('robarCarta', cardsNum, userId);
}

// Acumular cartas para robar
function addCartasRobar(gameId, numeroNuevo){
  let game = games[gameId];
  game.cardsRobar += numeroNuevo;
}

// Reiniciar cartas para robar
function resetCartasRobar(gameId){
  let game = games[gameId];
  game.cardsRobar = 0;
}

// Devuelve el turno del siguiente jugador
function getNextTurn(gameId){
  let users = games[gameId].users;
  let userId = games[gameId].turn;
  userNext = (users.indexOf(userId) + 1) % users.length; // devuelve un índice
  userNext = users[userNext];
  
  return userNext;
}

// Establecer el siguiente turno del juego
function setNextTurn(gameId){
  let userNext = getNextTurn(gameId);
  games[gameId].turn = userNext;
}

// Cambiar el turno del juego teniendo en cuenta saltos de jugadores
function cambiarTurno(gameId, cardNum, steps){
  
  let actualTurn = games[gameId].turn;
  for (let i = 0; i < steps; i++) {
    setNextTurn(gameId);    
  }

  // Crear objeto para mandarlo a todos los jugadores de la partida
  let dataUser = {
    'user': actualTurn,
    'cards': games[gameId].cards[actualTurn].length
  }

  // Informar a todos los jugadores del siguiente turno, la última carta usada, ...
  io.to(gameId).emit('nextTurn', games[gameId].turn, cardNum,  JSON.stringify(dataUser));
}

// Comprobar si el jugador se ha quedado sin cartas
function comprobarGanar(gameId, userId){

  let cards = games[gameId].cards[userId]
  if(cards.length == 0){

    io.to(gameId).emit('partidaTerminada', userId);
  }
}

// Mandar mensaje a un jugador específico
function sendMsg(socket, data) {
  io.to(socket).emit('msg', data);
}

// Mandar mensaje a todos los jugadores de la partida
function sendRoomMsg(gameId, data) {
  io.to(gameId).emit('msgRoom', data);
}

