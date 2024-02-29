const socket = io("http://localhost:3000");

window.addEventListener('load', function () {

	let userNick = '';
	let sala;

	let nick = this.document.getElementById('nick');
	
	let divJugador;
	let turnoH2;
	let users = [];
	let usersDiv = {};
	let gameData = {};
	let cartaUsada;
	
	let createGame = this.document.getElementById('createGame');
	if (createGame) {
		createGame.addEventListener('click', function (e) {
			e.preventDefault();
			console.log('Crear una partida', nick.value);
			userNick = nick.value;
			socket.emit('createGame', nick.value);
			
		});
	}
	
	let gameIdInput = this.document.getElementById('gameId');
	let joinGame = this.document.getElementById('joinGame');
	if (joinGame) {
		joinGame.addEventListener('click', function (e) {
			e.preventDefault();
			console.log('Unirse a una partida', nick.value);
			userNick = nick.value;
			
			socket.emit('joinGame', gameIdInput.value, nick.value);
			
		});
	}
	
	socket.on('InvalidNick', data => {
		console.log(data);
	})

	socket.on('msg', data => {
		console.log(`Mensaje del servidor: ${data}`);
	});
	socket.on('msgRoom', data => {
		this.alert(`Mensaje para la sala: ${data}`);
	});

	// Al recibir un evento los parámetros deben ir entre paréntesis, al enviarlo desde el server no hay que ponerlos
	socket.on('joined', (gameId, nick) => {
		//window.location.href = `/game.html?gameId=${gameId}&nick=${nick}`;

		let body = document.querySelector('body');

		let divDatos = document.createElement('div');
		divDatos.id = 'datos';
		divDatos.classList.add('sec_inicio');

		let salaH3 = document.createElement('h3')
		salaH3.innerHTML = 'Sala: '
		let usersH3 = document.createElement('h3')
		usersH3.innerHTML = 'Usuarios: '
		let salaP = document.createElement('p')
		salaP.id = 'sala';

		let usersP = document.createElement('p')
		usersP.id = 'users';

		divDatos.append(salaH3, salaP, usersH3, usersP);

		body.innerHTML = '';
		body.appendChild(divDatos);

		console.log('data sended')
		socket.emit('getGameData', gameId, nick);
		socket.on('getGameData', (gameData, host) => {
			console.log('server data: ' + JSON.stringify(gameData) + 'host: ' + host);
			console.log('Partida: ' + JSON.stringify(gameData) + ' User: ' + nick);
			salaP.innerHTML = gameId;
			usersP.innerHTML = gameData.users;

			if (host) {
				let button1 = this.document.createElement('button');
				button1.id = 'initGame';
				button1.innerHTML = 'Iniciar partida';
				divDatos.appendChild(button1);
			}

			let initGame = this.document.getElementById('initGame');
			console.log('asdasda')
			if (initGame) {
				console.log('iniciadooo')
				console.log('gameId: ' + gameId)
				initGame.addEventListener('click', function (e) {
					e.preventDefault();
					socket.emit('initGame', gameId, nick);
				});

			} else { console.log('No se ha encontrado el boton') }


		});
	})


	let salaP;
	let usersP;

	socket.on('userConnected', (users, nick, gameId) => {
		console.log(`Usuario: ${nick} conectado a la sala: ${gameId}`);
		salaP = this.document.getElementById('sala');
		usersP = this.document.getElementById('users');
		usersP.innerHTML = users;
		salaP.innerHTML = gameId;
	})

	let lastSelectedCard = null;

	socket.on('gameInitiated', (gameId, user, data, cards, firstCard) => {
		sala = gameId;
		console.log('data: ' + data)
		console.log('cards: ' + JSON.parse(cards));
		console.log('json: ' + JSON.parse(data));

		let oData = JSON.parse(data);
		let cartas = JSON.parse(cards);
		let userId = JSON.parse(user);
		//let primeraCarta = JSON.parse(firstCard);
		//console.log('primeraCarta: ' + primeraCarta);
		console.log('firstCard: ' + firstCard);
		console.log('cartas: ' + cartas)
		console.log('data: ' + oData);
		console.log('turno: ' + oData.turn);
		
		users = oData.users;
		let body = document.querySelector('body');

		ajaxGet1('./Views/card-structure.html');

		let gameIdH2 = this.document.getElementById('gameId');
		gameIdH2.innerHTML = 'Sala: ' + gameId;
		
		//cardsImg = 5;
		for (i = 0; i < users.length; i++) {
			let jugador = this.document.getElementById('jugador' + i);
			console.log('jugador' + i + ' ' + jugador)
			let usuario = users[i];
			gameData[usuario] = 5;
			console.log('usuario: ' + usuario);
			usersDiv[usuario] = jugador.id;
			if(userId == users[i]){
				jugador.classList.add('jugadorCartas');
				jugador.classList.remove('jugador');
				divJugador = jugador;
			}
			else{jugador.classList.add('jugador');}

			let nombre = this.document.createElement('h2');
			nombre.innerHTML = users[i];
			/*jugador.appendChild(nombre); */
			let mano = jugador.querySelector('#mano');
			

			console.log('userNick: ' + userNick)
			console.log('user: ' + userId)

			if (userNick == users[i]) {

				let userIdH2 = this.document.getElementById('userId');
				userIdH2.innerHTML = 'Nick: ' + users[i];

				for (let j = 1; j <= 5; j++) {
					let cardImg = this.document.createElement('img');
					cardImg.setAttribute('id', 'carta'+j);
					mano.appendChild(cardImg);
					cardImg.setAttribute('src', './Assets/img/' + cartas[j - 1] + '.gif');
					cardImg.classList.add('img');
					/* let carta = jugador.querySelector('#carta' + j);
					console.log(carta);
					carta.setAttribute('src', './Assets/img/' + cartas[j - 1] + '.gif'); */

					//carta.src = './Assets/img/' + cards[-j] + '.jpg';

					// Evento para seleccionar una carta
					cardImg.addEventListener('click', function (e) {
						e.preventDefault();
						console.log('lastSelectedCard: ' + lastSelectedCard)
						if (lastSelectedCard) { lastSelectedCard.classList.remove('selected') };
						cardImg.classList.add('selected');
						lastSelectedCard = cardImg;
						console.log('lastSelectedCard2: ' + lastSelectedCard.src)
					})

				}
			}
			else {
				let nombreH2 = jugador.querySelector('#name');
				nombreH2.innerHTML = users[i];
				//jugador.appendChild(nombre);
				for (let j = 1; j <= 5; j++) {
					let cardImg = this.document.createElement('img');
					cardImg.setAttribute('id', 'carta'+j);
					cardImg.setAttribute('src', './Assets/img/back.jpg');	
					cardImg.classList.add('img');
					mano.appendChild(cardImg);
					/* let carta = jugador.querySelector('#carta' + j);
					console.log(carta);
					carta.setAttribute('src', './Assets/img/back.jpg'); */
				}
			}


			//let nombre = jugador.querySelector('h2');
			console.log('usuario: ' + nombre.innerHTML);
			//nombre.innerHTML = users
			//jugador.innerHTML = users[i];
		}
		console.log('usersDiv: ' + JSON.stringify(usersDiv));
		console.log('gameData: ' + JSON.stringify(gameData));
		
		turnoH2 = this.document.getElementById('turno');
		turnoH2.innerHTML = 'Turno: ' + oData.turn;

		cartaUsada = this.document.getElementById('cartaUsada');
		cartaUsada.setAttribute('src', './Assets/img/' + firstCard + '.gif') ;

		console.log('turn: ' + oData.turn + ' user: ' + userNick);

		// COmprobar si es el turno del jugador para activar el botón
		let useCard = this.document.getElementById('usarCarta');

		if(oData.turn == userId) {
			console.log('Es tu turno');
		}
		else{
			console.log('No es tu turno');
		}
		// Boton para mandar la carta
		if (useCard) {
			useCard.addEventListener('click', function (e) {
				e.preventDefault();

				let cardRoot = lastSelectedCard.src
				let cardNum = cardRoot.substring(cardRoot.lastIndexOf("/") + 1, cardRoot.lastIndexOf("."))
				console.log('cardNum: ' + cardNum);
				// cardsImg--; //Restamos a la cantidad de cartas que tiene el usuario
				// TODO: Terminar el socket.emit y recivirlo por el server
				socket.emit('useCard', gameId, userId, cardNum);
			})
		}

		let robarCartabtn = this.document.getElementById('robarCarta');
		if(robarCartabtn){
			robarCartabtn.addEventListener('click', function(e){
				e.preventDefault();
				console.log('userNick: ' + userNick);
				let numCards = 1;
				socket.emit('robarCarta', userNick, sala, numCards);
			})
		}
		
	});

	socket.on('nextTurn', (turn, userId, cardNum, dataUser) => {
		let dataUserLast = JSON.parse(dataUser);
		let userLast = dataUserLast.user;
		console.log('userLast: ' + userLast);
		let cardNumLast = parseInt(dataUserLast.cards);
		console.log('dataUserLast: ' + dataUser);
		console.log('jugador: ' + usersDiv[userLast]);
		console.log('cardNum: ' + cardNumLast);
		console.log('cardNummm: ' + cardNum);

		let jugador = this.document.getElementById(usersDiv[userLast]);
		console.log('jugador: ' + jugador);
		let cartas = jugador.querySelectorAll('img');
		/* let nombreH2 = jugador.querySelectorAll('h2');
		console.log('Nombre: ' + nombreH2[1].innerHTML); */
		console.log('cartas: '+ cartas.length);
		let mano = jugador.querySelector('#mano');
		if(userLast != userNick){

			let user= gameData[userId];
			gameData[userId] = user--;
			console.log('gameData: ' + JSON.stringify(gameData));

			//for (let i = 1; i <= cardNumLast; i++) {
			for (let i = 0; i < cartas.length; i++) {
				let j = i+1;
				let carta = mano.querySelector('#carta' + j);
				console.log('cartaId: ' + carta.id);
				console.log('carta: ' + carta);
				console.log('i: ' + i);
				if(cardNumLast>=j){
					console.log('aaaa');
					carta.setAttribute('src', './Assets/img/back.jpg');
				}
				else{
					console.log('bbbbb');
					carta.setAttribute('src', '');
				}
			}	
		}
		else if(userLast == userNick){
			
			for (let i = 1; i <= cartas.length; i++) {
				let carta = mano.querySelector('#carta' + i);
				let cartaRoot = carta.src;
				let cartaNum = cartaRoot.substring(cartaRoot.lastIndexOf("/") + 1, cartaRoot.lastIndexOf("."))
				if(cartaNum == cardNum){
					carta.setAttribute('src', '');
					carta.classList.remove('selected');
					carta.classList.add('imgNone');
				}
			}
		}
		turnoH2.innerHTML = 'Turno: ' + turn;
		cartaUsada.setAttribute('src', './Assets/img/' + cardNum + '.gif');
	});
	
	
	socket.on('robarCarta', (cartas, userId) => {

		console.log('num cartas: ' + cartas.length);
		
		if(userNick == userId){

			for (let i = 0; i < cartas.length; i++) {
				const card = cartas[i];
				//cardsImg++;
				console.log('Tienes que robar una carta');
				let j = i+1;
				let mano = divJugador.querySelector('#mano');
				let cartaImg = mano.querySelector('#carta'+j);
				console.log(cartaImg);
				if(cartaImg){
					cartaImg.setAttribute('src', './Assets/img/' + card + '.gif');
					cartaImg.classList.remove('imgNone');
				}
				else{
					let cardImg = this.document.createElement('img');
					cardImg.id = 'carta'+j;
					cardImg.setAttribute('src', './Assets/img/' + card + '.gif');
					cardImg.classList.add('img');
					console.log(divJugador);
					//let mano = divJugador.getElementsByClassName('mano');
					mano.appendChild(cardImg);
					cardImg.addEventListener('click', function (e) {
						e.preventDefault();

						console.log('lastSelectedCard: ' + lastSelectedCard)
						if (lastSelectedCard) { lastSelectedCard.classList.remove('selected') };

						cardImg.classList.add('selected');
						lastSelectedCard = cardImg;
						console.log('lastSelectedCard2: ' + lastSelectedCard.src)
					});
				}

			}
			
		}
		else{
			let user= gameData[userId];
			gameData[userId] = user++;
			console.log('gameData: ' + JSON.stringify(gameData));
			
			console.log('usersDiv: ' + JSON.stringify(usersDiv))
			console.log('usersNext: ' + userId)
			divId = usersDiv[userId];
			console.log('divId: ' + divId);
			
			let jugador = this.document.getElementById(divId);
			let mano = jugador.querySelector('#mano');
			let cardsImg = mano.querySelectorAll('img');
			for (let i = 0; i < cartas.length; i++) {
				let j = i+1
				let cartaImg = mano.querySelector('#carta'+j);
				if(cartaImg){
					cartaImg.setAttribute('src', './Assets/img/back.jpg');
				}
				else{
					let cartaBack = this.document.createElement('img');
					cartaBack.id = 'carta'+j; // ---------------------------------------------------------------------------------------
					cartaBack.setAttribute('src', './Assets/img/back.jpg');
					cartaBack.classList.add('img');
					cartaBack.classList.remove('selected');

					mano.appendChild(cartaBack);
				}
				
			}
		}

	});

	socket.on('elegirPalo', () => {
		let controlador = './Views/elegirPalo.html'
		let data = ajaxGet2(controlador);
		console.log('data: ' + data);
		let div2 = this.document.getElementById('div2');
		div2.innerHTML += data;
		let palos = this.document.getElementById('palos');
		let palosBtn = palos.querySelectorAll('input');
		console.log(palosBtn);
		for (let i = 0; i < palosBtn.length; i++) {
			let palo = palosBtn[i];
			palo.addEventListener('click', function(e){
				e.preventDefault();
				socket.emit('paloElegido', (palo.value));
				let divPalos = div2.querySelector('#palos');
				div2.removeChild(divPalos);
				console.log('palo: ' + palo);
			});
			
		}

	})


	socket.on('partidaTerminada', (userId) => {
		turnoH2.innerHTML = 'Partida ganada por: ' + userId;
	})
	
});


async function userConnected(usersP, salaP) {
	console.log('userConnected');
	socket.on('userConnected', (users, nick, gameId) => {
		console.log(`Usuario: ${nick} conectado a la sala: ${gameId}`);
		usersP.innerHTML = users;
		salaP.innerHTML = gameId;
	})
}


/* INICIO - ajaxGet1 - Devuelve el resultado a un DIV (GET) */
function ajaxGet1(controlador1) {
	let ajax1 = new XMLHttpRequest();
	ajax1.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			console.log('ajax' + this.responseText);
			document.querySelector('body').innerHTML = this.responseText;
			//document.getElementById(div1.id).innerHTML = this.responseText;
		}
	};
	// Imporatante que este AJAX sea SÍNCRONO para que pueda mostrar la información antes de intentar utilizarla
	ajax1.open('GET', controlador1, false);
	ajax1.send();
	console.log('sended');
}
	/* FIN - ajaxGet1 - Devuelve el resultado a un DIV (GET) */

/* INICIO - ajaxGet1 - Devuelve el resultado a un DIV (GET) */
function ajaxGet2(controlador1) {
	let data;
	let ajax1 = new XMLHttpRequest();
	ajax1.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//console.log('ajax' + this.responseText);
			data = this.responseText;
			//document.getElementById(div1.id).innerHTML = this.responseText;
		}
	};
	// Imporatante que este AJAX sea SÍNCRONO para que pueda mostrar la información antes de intentar utilizarla
	ajax1.open('GET', controlador1, false);
	ajax1.send();
	console.log('sended');
	return data;
}
	/* FIN - ajaxGet1 - Devuelve el resultado a un DIV (GET) */
