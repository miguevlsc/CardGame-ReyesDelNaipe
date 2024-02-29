const socket = io("http://localhost:3000");



function ajaxGet1(controlador1) {
	let data;
	let ajax1 = new XMLHttpRequest();
	ajax1.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			data = this.responseText;
		}
	};
	// Imporatante que este AJAX sea SÍNCRONO para que pueda retornar la información antes de intentar utilizarla
	ajax1.open('GET', controlador1, false);
	ajax1.send();

	return data;
}


window.addEventListener('load', function () {

	// Variables locales
	let userNick = '';
	let nick = this.document.getElementById('nick');

	let sala;

	let divJugador;
	let turnoH2;

	// Almacenar la información de los demas usuarios en la partida
	let users = [];
	let usersDiv = {};

	let cartaUsada;

	let createGame = this.document.getElementById('createGame');
	if (createGame) {
		createGame.addEventListener('click', function (e) {
			e.preventDefault();
			userNick = nick.value;

			// Informar al servidor de crear una nueva partida
			socket.emit('createGame', nick.value);

		});
	}

	let gameIdInput = this.document.getElementById('gameId');
	let joinGame = this.document.getElementById('joinGame');
	if (joinGame) {
		joinGame.addEventListener('click', function (e) {
			e.preventDefault();
			userNick = nick.value;

			// Informar al servidor de unirse a una partida
			socket.emit('joinGame', gameIdInput.value, nick.value);

		});
	}

	// Recibir mensaje privado del servidor
	socket.on('msg', data => {
		console.log(`Mensaje del servidor: ${data}`);
	});

	// Recibir mensaje del servidor para todos los jugadores de la partida
	socket.on('msgRoom', data => {
		this.alert(`Mensaje para la sala: ${data}`);
	});

	// Confirmar la unión a una partida
	socket.on('joined', (gameId, nick) => {

		// Imprimir la información de la partida
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

		// Pedir toda la información de la partida al servidor
		socket.emit('getGameData', gameId, nick);
		socket.on('getGameData', (gameData, host) => {
			salaP.innerHTML = gameId;
			usersP.innerHTML = gameData.users;

			// Si es HOST te dará la opción de iniciar partida
			if (host) {
				let button1 = this.document.createElement('button');
				button1.id = 'initGame';
				button1.innerHTML = 'Iniciar partida';
				divDatos.appendChild(button1);
			}


			let initGame = this.document.getElementById('initGame');
			if (initGame) {
				initGame.addEventListener('click', function (e) {
					e.preventDefault();

					// Informar al servidor de crear una nueva partida
					socket.emit('initGame', gameId, nick);
				});
			}
		});
	})



	// Actualizar la información de los usuarios en la partida
	socket.on('userConnected', (users, gameId) => {
		let salaP = this.document.getElementById('sala');
		let usersP = this.document.getElementById('users');
		usersP.innerHTML = users;
		salaP.innerHTML = gameId;
	})

	let lastSelectedCard = null;

	socket.on('gameInitiated', (gameId, user, data, cards, firstCard) => {
		sala = gameId;

		let oData = JSON.parse(data);
		let cartas = JSON.parse(cards);
		let userId = JSON.parse(user);

		users = oData.users;

		// Coger la estructura del juego con AJAX
		let body = document.querySelector('body');
		let cardStructure = ajaxGet1('./Views/card-structure.html');
		body.innerHTML = (cardStructure);

		// Imprimir el número de sala
		let gameIdH2 = this.document.getElementById('gameId');
		gameIdH2.innerHTML = 'Sala: ' + gameId;

		// Asignar las cartas al div de cada usuario
		for (i = 0; i < users.length; i++) {
			let jugador = this.document.getElementById('jugador' + i);
			
			let usuario = users[i];
			usersDiv[usuario] = jugador.id;

			if (userId == users[i]) {
				jugador.classList.add('jugadorCartas');
				jugador.classList.remove('jugador');
				divJugador = jugador;
			}
			else { jugador.classList.add('jugador'); }

			let nombre = this.document.createElement('h2');
			nombre.innerHTML = users[i];
			
			let mano = jugador.querySelector('#mano');

			if (userNick == users[i]) {

				let userIdH2 = this.document.getElementById('userId');
				userIdH2.innerHTML = 'Nick: ' + users[i];

				// Añadir tantas cartas como haya a la mano del jugador
				for (let j = 1; j <= cartas.length; j++) {
					let cardImg = this.document.createElement('img');
					cardImg.setAttribute('id', 'carta' + j);
					mano.appendChild(cardImg);
					cardImg.setAttribute('src', './Assets/img/' + cartas[j - 1] + '.gif');
					cardImg.classList.add('img');

					// Evento para seleccionar una carta
					cardImg.addEventListener('click', function (e) {
						e.preventDefault();

						if (lastSelectedCard) { lastSelectedCard.classList.remove('selected') };
						cardImg.classList.add('selected');
						lastSelectedCard = cardImg;
					});

				}
			}
			else {
				let nombreH2 = jugador.querySelector('#name');
				nombreH2.innerHTML = users[i];

				// Añadir cartas volteadas a cada jugador
				for (let j = 1; j <= cartas.length; j++) {
					let cardImg = this.document.createElement('img');
					cardImg.setAttribute('id', 'carta' + j);
					cardImg.setAttribute('src', './Assets/img/back.jpg');
					cardImg.classList.add('img');
					mano.appendChild(cardImg);
					
				}
			}
		}

		turnoH2 = this.document.getElementById('turno');
		turnoH2.innerHTML = 'Turno: ' + oData.turn;

		cartaUsada = this.document.getElementById('cartaUsada');
		cartaUsada.setAttribute('src', './Assets/img/' + firstCard + '.gif');

		// Usar una carta
		let useCard = this.document.getElementById('usarCarta');
		if (useCard) {
			useCard.addEventListener('click', function (e) {
				e.preventDefault();
				
				let cardRoot = lastSelectedCard.src
				let cardNum = cardRoot.substring(cardRoot.lastIndexOf("/") + 1, cardRoot.lastIndexOf("."))

				// Enviar una carta al servidor
				socket.emit('useCard', gameId, userId, cardNum);
			})
		}

		// Robar una carta
		let robarCartabtn = this.document.getElementById('robarCarta');
		if (robarCartabtn) {
			robarCartabtn.addEventListener('click', function (e) {
				e.preventDefault();
				let numCards = 1;

				// Pedir una carta al servidor
				socket.emit('robarCarta', userNick, sala, numCards);
			})
		}
	});

	// Cambiar de turno la partida
	socket.on('nextTurn', (turn, cardNum, dataUser) => {
		
		let dataUserLast = JSON.parse(dataUser);
		let userLast = dataUserLast.user;
		let cardNumLast = parseInt(dataUserLast.cards);

		// Identificar al turno anterior para quitarle la carta usada
		let jugador = this.document.getElementById(usersDiv[userLast]);
		let cartas = jugador.querySelectorAll('img');

		let mano = jugador.querySelector('#mano');

		// Comprobar si es otro jugador
		if (userLast != userNick) {

			// Dejamos al usuario con las cartas que nos diga el servidor
			for (let i = 1; i <= cartas.length; i++) {
				let carta = mano.querySelector('#carta' + i);

				if (i <= cardNumLast) {
					carta.setAttribute('src', './Assets/img/back.jpg');
					carta.classList.remove('imgNone');
				}
				else {
					carta.setAttribute('src', '');
					carta.classList.add('imgNone');
				}
			}
		}
		// Mano del jugador
		else if (userLast == userNick) {
			for (let i = 1; i <= cartas.length; i++) {
				let carta = mano.querySelector('#carta' + i);
				let cartaRoot = carta.src;
				let cartaNum = cartaRoot.substring(cartaRoot.lastIndexOf("/") + 1, cartaRoot.lastIndexOf("."))
				if (cartaNum == cardNum) {
					carta.setAttribute('src', '');
					carta.classList.remove('selected');
					carta.classList.add('imgNone');
				}
			}
		}
		turnoH2.innerHTML = 'Turno: ' + turn;
		cartaUsada.setAttribute('src', './Assets/img/' + cardNum + '.gif');
	});


	// Evento robar carta
	socket.on('robarCarta', (cartas, userId) => {

		if (userNick == userId) {
			for (let i = 1; i <= cartas.length; i++) {
				const card = cartas[i-1];

				let mano = divJugador.querySelector('#mano');
				
				// Explorar imágenes sin atributo 'src' para evitar su creación innecesaria
				let cartaImg = mano.querySelector('#carta' + i);
				if (cartaImg) {
					cartaImg.setAttribute('src', './Assets/img/' + card + '.gif');
					cartaImg.classList.remove('imgNone');
				}
				else {
					let cardImg = this.document.createElement('img');
					cardImg.id = 'carta' + i;
					cardImg.setAttribute('src', './Assets/img/' + card + '.gif');
					cardImg.classList.add('img');
					mano.appendChild(cardImg);

					// Alternar la selección de cartas
					cardImg.addEventListener('click', function (e) {
						e.preventDefault();

						if (lastSelectedCard) { lastSelectedCard.classList.remove('selected') };
						cardImg.classList.add('selected');
						lastSelectedCard = cardImg;
					});
				}
			}
		}
		else {

			divId = usersDiv[userId];

			let jugador = this.document.getElementById(divId);
			let mano = jugador.querySelector('#mano');


			for (let i = 1; i <= cartas.length; i++) {
				let cartaImg = mano.querySelector('#carta' + i);
				if (cartaImg) {
					cartaImg.setAttribute('src', './Assets/img/back.jpg');
				}
				else {
					let cartaBack = this.document.createElement('img');
					cartaBack.id = 'carta' + i;
					cartaBack.setAttribute('src', './Assets/img/back.jpg');
					cartaBack.classList.add('img');
					cartaBack.classList.remove('selected');

					mano.appendChild(cartaBack);
				}
			}
		}
	});


	// Evento carta 10 para cambiar de palo
	socket.on('elegirPalo', () => {
		
		// Imprimimos las opciones
		let data = ajaxGet1('./Views/elegirPalo.html');

		let div2 = this.document.getElementById('div2');
		div2.innerHTML += data;

		let palos = this.document.getElementById('palos');
		let palosBtn = palos.querySelectorAll('input');

		for (let i = 0; i < palosBtn.length; i++) {
			let palo = palosBtn[i];
			palo.addEventListener('click', function (e) {
				e.preventDefault();
				// Enviamos al servidor la respuesta
				socket.emit('paloElegido', (palo.value));
				let divPalos = div2.querySelector('#palos');
				div2.removeChild(divPalos);
			});

		}

	})

	// Informar por pantalla del jugador ganador
	socket.on('partidaTerminada', (userId) => {
		turnoH2.innerHTML = 'Partida ganada por: ' + userId;
	})

});