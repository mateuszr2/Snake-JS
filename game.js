window.onload = function() {
    Game = new Snake('gameCanvas')
    
    var snakeAudio = document.querySelector('.snake-audio')
    var gameMusic = document.querySelector('.game-music')
    var gameButton = document.querySelector('.game-button')

    gameButton.onclick = function() {
	element = localStorage.getItem("myElement");
	document.querySelector('.best-container').innerHTML = element
        if (Game.isOverGame) {
            // gdy koniec gry
            Game.restart()
        }

        if (Game.isInGame) {
            // jeśli gra zapauzowana
            this.innerHTML = 'WZNÓW'
            Game.stopGame()
            Game.isOpenAudio && snakeAudio.pause()
        } else {
            // podczas gry
            this.innerHTML = 'PAUZA'
            Game.startGame()
            Game.isOpenAudio && snakeAudio.play()
        }
        Game.isInGame = !Game.isInGame
    }

    gameMusic.onclick = function() {
        var isClose = this.classList.toggle('close')

        if (isClose) {
            // jeśli dźwięk wyłaączony
            Game.isOpenAudio = false
            if (Game.isInGame) {
                snakeAudio.pause()
            }
        } else {
            // jeśli dźwięk właczony
            Game.isOpenAudio = true
            if (Game.isInGame) {
                snakeAudio.play()
            }
        }
    }
}

var Snake = function (id) {
    this.canvas = document.getElementById(id)
    this.ctx = this.canvas.getContext('2d')
    this.mapLength = 25
    this.grid = 18
   
    this.isInGame = false
    this.isOverGame = false
    // kierunek podczas startu gry r = prawo
    this.moveDir = 'r'
    
    this.preDir = this.moveDir
   
    this.MaxSpeed = 240
    this.minSpeed = 80
    this.speed = this.MaxSpeed
    this.snakeTimer = null
    this.snakeData = this._initSnakeMap()
    this.food = []
    this.score = 0
    this.bestScore = 0
    this.isOpenAudio = true
    this._init()
}

// inicjacja współrzędnych węża
Snake.prototype._initSnakeMap = function() {
    var array = []
    var head = 1 //oś x
    for (var i = 0; i < 3; i++) {
        array[i] = []
        array[i][0] = 14 //oś y
        array[i][1] = head-- 
    }
    return array
}

Snake.prototype._init = function() {
    // rysowanie koloru tła
    this._drawGridBg()
    // wyswietlanie obrazka startowego
    this.drawLogo()
    // powiązanie przycisków klawiatury z kierunkiem
    this._bindEvent()
}

// ustawienia przy restarcie gry
Snake.prototype.restart = function() {
    this.isOverGame = false
    this.moveDir = 'r'
    this.preDir = this.moveDir
    this.speed = this.MaxSpeed
    this.snakeTimer = null
    this.snakeData = this._initSnakeMap()
    this.food = []
    this.score = 0
    this.saveScore(0)
}
// przypisanie klawiszy do kierunku 
Snake.prototype._bindEvent = function() {
    var _this = this
    var json = {
        37: 'l', //lewo
        38: 'u', //góra
		39: 'r', //prawo
        40: 'd'  // dół
    }
	// zbieranie informacji o naciśnietym przycisku i porównanie z kierunkiem
    document.onkeydown = function(ev) {
        if (!_this.isInGame) {
            return
        }
        
        var keyCode = ev.keyCode
        if (!json[keyCode] || json[keyCode] === _this.moveDir) {
            return
        }
        for (var n in json) {
            if (json[n] === _this.moveDir) {
                if (Math.abs(keyCode - n) === 2) {
                    return
                }
            }
        }
        // ustawienie przygotowanego kierunku
        _this.preDir = json[keyCode]
    }
}
// zatrzymanie gry podczas pauzy (zatrzymanie interwalu wykonywanej funkcji)
Snake.prototype.stopGame = function() {
    window.clearInterval(this.snakeTimer)
}
// wznowienie gry po pauzie
Snake.prototype.startGame = function() {
    this.goGame()
    this.snakeTimer = setInterval(() => {
        this.goGame()
    }, this.speed)
}

Snake.prototype.goGame = function() {
    if (!this.food.length) {
        // tworzenie celu
        this._createFood()
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // rysowanie siatki
    this._drawGridBg()

    var direct = this.moveDir = this.preDir
    var nextPos = this._nextPos(direct)
    // kloizja ze ścianą = koniec gry
    var isOver = this._isCollision(nextPos)
    var isChangeSpeed = null
	// jeśli nie jest koniec gry wąż się przemieszcza
    if (!isOver) {
        isChangeSpeed = this._walk(nextPos)
    }
    this._drawSnake()
	this._drawFood()

    // jeśli jest koniec gry to wyświetl koniec gry
    if (isOver) {
        this._drawOver()
        return
    }
    // zmiana prędkości 
    if (isChangeSpeed) {
        this.stopGame() //zatrzymanie interwału wykonywanej funkcji
        this.startGame() // ustawienie nowego interwału wykonywanej funkcji
    }
}

// sprawdzanie czy wystapiła kolizja jeśli tak to zatrzymanie gry i jej koniec
Snake.prototype._isCollision = function(nextPos) {
    if (this._collisionDetection(nextPos)) {
        this.stopGame()
        this._overGame()
        return true
    }
    return false
}

// detekcja kolizji
Snake.prototype._collisionDetection = function(next) {
   // kolizja ze ścianą
    if (
        next[0] <= -1 || next[1] <= -1 || next[0] >= this.mapLength || next[1] >= this.mapLength
    ) {
        return true
    }
	// kolizja z samym sobą
    for (let i = 0; i < this.snakeData.length; i++) {
        
        if (this.snakeData[i][0] === next[0] && this.snakeData[i][1] === next[1]) {
            return true
        }
    }
}
// rysowanie węża
Snake.prototype._drawSnake = function() {
    for (var i = 0; i < this.snakeData.length; i++) {
        var x = this.snakeData[i][0]
        var y = this.snakeData[i][1]
        var w = y * this.grid
        var h = x * this.grid
        if (i === 0) {
            // porównywanie kierunku przemieszczania sie do ustawień głowy
            var nextX = this.snakeData[i + 1][0]
            var nextY = this.snakeData[i + 1][1]
            var dir = null
            if (nextY - y === 1) {
                // lewo
                dir = 'l'
            } else if (nextY - y === -1) {
                // prawo
                dir = 'r'
            } else if (nextX - x === 1) {
                // góra
                dir = 'u'
            } else if (nextX - x === -1) {
                // dół
                dir = 'd'
            }
            this.drawSnakeHead(w, h, dir)
        } else if (i === this.snakeData.length - 1) {
            // porównywanie kierunku przemieszczania sie do ustawień ogona
            var preX = this.snakeData[i - 1][0]
            var preY = this.snakeData[i - 1][1]
            var dir = null
            if (preY - y === 1) {
                // prawo
                dir = 'r'
            } else if (preY - y === -1) {
                // lewo
                dir = 'l'
            } else if (preX - x === 1) {
                // dół
                dir = 'd'
            } else if (preX - x === -1) {
                // góra
                dir = 'u'
            }
            this.drawSnakeTail(w, h, dir)
        } else {
            this.drawSnakeBody(w, h)
        }
    }
}

Snake.prototype._walk = function(nextPos) {
    var isChange = false
    // sprawdzanie czy cel trafiony
	
    if (this._isEat(nextPos)) {
        // wyznaczanie lokalizacji celu
        this._createFood()
        // dodanie punktu za trafienie 
        var nowScore = this.score += 1
        this.bestScore = nowScore > this.bestScore ? nowScore : this.bestScore  
        this.saveScore(nowScore)
        this.saveBestScore(this.bestScore)
        // zwiększanie prędkości poruszania się wzależności od punktów 
        var residue = this.MaxSpeed - parseInt(this.score / 5) * this.minSpeed
        // sprawdzanie czy prędkość się zwiększyła
        if (residue !== this.speed && residue >= this.minSpeed) {
            isChange = true
        }
        this.speed = residue <= this.minSpeed ? this.minSpeed : residue
        // odtwarzanie dźwięku trafienia
        this.eatAudioPlay()
		this.snakeData.push() 
    } else {
        this.snakeData.pop() 
    }
    this.snakeData.unshift(nextPos)

    return isChange
}
// wyświetlanie aktualnego wyniku
Snake.prototype.saveScore = function(score) {
    document.querySelector('.score-container').innerHTML = score
}
// zapisywanie najlepszego wyniku
Snake.prototype.saveBestScore = function(score) {
	element = localStorage.getItem("myElement");
	if(score > element && score != null){
	localStorage.setItem("myElement", score);
	const element = localStorage.getItem("myElement");
    }
	
	
}

// // sprawdzanie czy cel został trafiony
Snake.prototype._isEat = function(nextPos) {
    if (this.food[0] === nextPos[0] && this.food[1] === nextPos[1]) {
        return true
    } else {
        return false
    }
}

// wyznaczanie kierunku w zależności od przycisku
Snake.prototype._nextPos = function(direct) {
    var nextArray = []
    var x = this.snakeData[0][0]
    var y = this.snakeData[0][1]

    if (direct === 'u') {
        nextArray[0] = x - 1
        nextArray[1] = y
    } else if (direct === 'r') {
        nextArray[0] = x
        nextArray[1] = y + 1
    } else if (direct === 'd') {
        nextArray[0] = x + 1
        nextArray[1] = y
    } else if (direct === 'l') {
        nextArray[0] = x
        nextArray[1] = y - 1
    }
    return nextArray
}
// tworzenie celu
Snake.prototype._createFood = function() {
    var food_x = parseInt(Math.random() * this.mapLength)
    var food_y = parseInt(Math.random() * this.mapLength)
    var isExist = false
    
    for (var i = 0; i < this.snakeData.length; i++) {
        if (this.snakeData[i][0] === food_x && this.snakeData[i][1] === food_y) {
            
            isExist = true
            break
        }
    }

    if (isExist) {
        this._createFood()
    } else {
        this.food = [food_x, food_y]    
    }
}
// rysowanie celu
Snake.prototype._drawFood = function() {
    this.drawFruit(this.food[1] * this.grid, this.food[0] * this.grid)
}
// rysowanie siatki
Snake.prototype._drawGridBg = function() {
    for (var i = 0; i < this.mapLength; i++) {
        for (var j = 0; j < this.mapLength; j++) {
            this._gridFill(
                j * this.grid,
                i * this.grid,
                j + i * this.grid + 1,
                i + 1
            )
        }
    }
}
//kolorowanie siatki
Snake.prototype._gridFill = function(x, y, isColor, i) {
    var color_1 = i % 2 == 1 ? '#123005' : '#0d2404'      
    var color_2 = i % 2 != 1 ? '#123005' : '#0d2404'
    
    var fillStyle = isColor % 2 == 1 ? color_1 : color_2
    this.ctx.fillStyle = fillStyle
    this.ctx.fillRect (x, y, this.grid, this.grid);
}
// pobieranie zdjęcia celu
Snake.prototype.drawFruit = function(x, y) {
    var fruitImage = new Image()
    fruitImage.src = 'images/fruit.png'
    this.ctx.drawImage(fruitImage, x, y, this.grid, this.grid)
}
// pobieranie zdjęć węża
var snakeImage = (function() {
    var img = new Image()
    img.src = 'images/snake.png'
    return img
})()

// przypisanie stopni obrotu ciała do kierunku przemieszczania 
var directionWithAngle = function(direction) {
    if (direction === 'u') {
        return 90
    } else if (direction === 'r') {
        return 180
    } else if (direction === 'd') {
        return 270
    } else {
        return 0
    }
}
// rysowanie głowy 
Snake.prototype.drawSnakeHead = function(x, y, direction) {
    this.ctx.save()
    var cx = x + this.grid/2
    var cy = y + this.grid/2
    
    this.ctx.translate(cx, cy)
    this.ctx.rotate(directionWithAngle(direction) * Math.PI / 180)
    this.ctx.drawImage(snakeImage, 0, 0, this.grid, this.grid, -this.grid/2, -this.grid/2, this.grid, this.grid)
    this.ctx.restore()
}
// rysowanie ciała
Snake.prototype.drawSnakeBody = function(x, y) {
    this.ctx.drawImage(snakeImage, 18, 0, this.grid, this.grid, x, y, this.grid, this.grid)
}
// rysowanie ogona
Snake.prototype.drawSnakeTail = function(x, y, direction) {
    this.ctx.save()
    var cx = x + this.grid/2
    var cy = y + this.grid/2
    
    this.ctx.translate(cx, cy)
    this.ctx.rotate(directionWithAngle(direction) * Math.PI / 180)
    this.ctx.drawImage(snakeImage, 36, 0, this.grid, this.grid, -this.grid/2, -this.grid/2, this.grid, this.grid)
    this.ctx.restore()
}
// wyświetlanie ekranu startowego
Snake.prototype.drawLogo = function() {
	
	 var overImage = new Image()
    overImage.src = 'images/title.png'
    overImage.onload = () => {
       
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.drawImage(overImage, (0) / 2, (0) / 2, 450, 450)
    }
 

    this.ctx.restore()
}

// wyświetlanie okna końca gry
Snake.prototype._drawOver = function(x, y) {
    var overImage = new Image()
    overImage.src = 'images/over.png'
    overImage.onload = () => {
        this.ctx.fillStyle = 'rgba(55,44,34,0.7)'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.drawImage(overImage, (450 - 255) / 2, (450 - 163) / 2, 255, 163)
    }
}

// koniec gry 
Snake.prototype._overGame = function() {
    this.isOverGame = true
    this.isInGame = false
    document.querySelector('.game-button').innerHTML = 'RESTART'
    this.overAudioPlay()
}

Snake.prototype.eatAudioPlay = function() {
    var eatAudio = document.querySelector('.eat-audio')
    this.isOpenAudio && eatAudio.play()
}

Snake.prototype.overAudioPlay = function() {
    var overAudio = document.querySelector('.over-audio')
    this.isOpenAudio && overAudio.play()

    var snakeAudio = document.querySelector('.snake-audio')
    this.isOpenAudio && snakeAudio.pause()
}