class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.speedElement = document.getElementById('speed');
        this.sizeElement = document.getElementById('size');
        
        // Configurações do jogo
        this.gridSize = 20;
        this.cols = this.canvas.width / this.gridSize;
        this.rows = this.canvas.height / this.gridSize;
        
        // Estado do jogo
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.speed = 1;
        this.snakeSize = 1;
        
        // Cobra
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        
        // Comida
        this.food = this.generateFood();
        this.foodType = 'normal'; // normal, special, speed, size
        
        // Efeitos visuais
        this.particles = [];
        this.backgroundOffset = 0;
        
        // Controles
        this.keys = {};
        this.lastUpdate = 0;
        this.updateInterval = 150;
        
        this.init();
    }
    
    init() {
        this.updateHighScore();
        this.setupEventListeners();
        this.loadSprites();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggleGame();
                    break;
                case 'KeyR':
                    this.restart();
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    this.handleDirection(e.code);
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    handleDirection(keyCode) {
        const directions = {
            'ArrowUp': {x: 0, y: -1},
            'ArrowDown': {x: 0, y: 1},
            'ArrowLeft': {x: -1, y: 0},
            'ArrowRight': {x: 1, y: 0}
        };
        
        const newDirection = directions[keyCode];
        if (newDirection) {
            // Evita movimento reverso
            if (this.direction.x !== -newDirection.x || this.direction.y !== -newDirection.y) {
                this.nextDirection = newDirection;
            }
        }
    }
    
    toggleGame() {
        switch(this.gameState) {
            case 'menu':
                this.startGame();
                break;
            case 'playing':
                this.pauseGame();
                break;
            case 'paused':
                this.resumeGame();
                break;
            case 'gameOver':
                this.restart();
                break;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideOverlay();
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.showOverlay('JOGO PAUSADO', 'Pressione ESPAÇO para continuar');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.hideOverlay();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showOverlay('GAME OVER', `Pontuação: ${this.score}`);
        this.createGameOverParticles();
    }
    
    restart() {
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.score = 0;
        this.speed = 1;
        this.snakeSize = 1;
        this.food = this.generateFood();
        this.particles = [];
        this.gameState = 'menu';
        this.showOverlay('JOGO DA COBRINHA', 'Pressione ESPAÇO para começar');
        this.updateScore();
        this.updateStats();
    }
    
    showOverlay(title, message) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        this.overlay.style.display = 'flex';
    }
    
    hideOverlay() {
        this.overlay.style.display = 'none';
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        // 10% de chance de comida especial
        const specialChance = Math.random();
        if (specialChance < 0.1) {
            const types = ['speed', 'size'];
            this.foodType = types[Math.floor(Math.random() * types.length)];
        } else {
            this.foodType = 'normal';
        }
        
        return food;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval / this.speed) return;
        this.lastUpdate = now;
        
        // Atualiza direção
        this.direction = {...this.nextDirection};
        
        // Move a cobra
        const head = {...this.snake[0]};
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Verifica colisões
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Verifica se comeu a comida
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }
        
        // Atualiza partículas
        this.updateParticles();
        
        // Atualiza fundo
        this.backgroundOffset += 0.5;
    }
    
    checkCollision(head) {
        // Colisão com paredes
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            return true;
        }
        
        // Colisão com o próprio corpo
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }
    
    eatFood() {
        this.score += this.foodType === 'normal' ? 10 : 20;
        this.updateScore();
        
        // Efeitos especiais
        switch(this.foodType) {
            case 'speed':
                this.speed = Math.min(this.speed + 0.2, 3);
                this.createSpeedParticles();
                break;
            case 'size':
                this.snakeSize = Math.min(this.snakeSize + 0.1, 2);
                this.createSizeParticles();
                break;
            default:
                this.createEatParticles();
        }
        
        this.food = this.generateFood();
        this.updateStats();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
            localStorage.setItem('snakeHighScore', this.highScore);
        }
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    updateStats() {
        this.speedElement.textContent = this.speed.toFixed(1);
        this.sizeElement.textContent = this.snakeSize.toFixed(1);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha fundo estilo Stardew Valley
        this.drawBackground();
        
        // Desenha grade
        this.drawGrid();
        
        // Desenha cobra
        this.drawSnake();
        
        // Desenha comida
        this.drawFood();
        
        // Desenha partículas
        this.drawParticles();
    }
    
    drawBackground() {
        // Gradiente de fundo estilo Stardew Valley
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2d5016');
        gradient.addColorStop(0.3, '#4a7c59');
        gradient.addColorStop(0.7, '#6b8e23');
        gradient.addColorStop(1, '#8fbc8f');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Adiciona textura de grama
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.1)';
        for (let i = 0; i < this.canvas.width; i += 4) {
            for (let j = 0; j < this.canvas.height; j += 4) {
                if (Math.random() > 0.7) {
                    this.ctx.fillRect(i, j, 2, 2);
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize * this.snakeSize;
            
            // Cor da cobra (verde pixelizado)
            const green = index === 0 ? '#00ff00' : '#008000';
            this.ctx.fillStyle = green;
            
            // Desenha segmento com borda pixelizada
            this.ctx.fillRect(x, y, size, size);
            
            // Borda escura
            this.ctx.strokeStyle = '#004000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);
            
            // Olhos na cabeça
            if (index === 0) {
                this.ctx.fillStyle = '#000000';
                const eyeSize = 3;
                const eyeOffset = 4;
                
                // Olhos baseados na direção
                if (this.direction.x === 1) { // direita
                    this.ctx.fillRect(x + size - eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + size - eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // esquerda
                    this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // cima
                    this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + size - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                } else if (this.direction.y === 1) { // baixo
                    this.ctx.fillRect(x + eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                    this.ctx.fillRect(x + size - eyeOffset - eyeSize, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                }
            }
        });
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const size = this.gridSize;
        
        // Cor baseada no tipo
        let color;
        switch(this.foodType) {
            case 'speed':
                color = '#ff6b6b';
                break;
            case 'size':
                color = '#4ecdc4';
                break;
            default:
                color = '#ffd700';
        }
        
        // Desenha comida com efeito pixelizado
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Borda
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        
        // Efeito de brilho
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(x + 4, y + 4, 4, 4);
    }
    
    createEatParticles() {
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                maxLife: 30,
                color: '#ffd700',
                size: 3
            });
        }
    }
    
    createSpeedParticles() {
        const head = this.snake[0];
        const x = head.x * this.gridSize + this.gridSize / 2;
        const y = head.y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 40,
                maxLife: 40,
                color: '#ff6b6b',
                size: 4
            });
        }
    }
    
    createSizeParticles() {
        const head = this.snake[0];
        const x = head.x * this.gridSize + this.gridSize / 2;
        const y = head.y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 35,
                maxLife: 35,
                color: '#4ecdc4',
                size: 5
            });
        }
    }
    
    createGameOverParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 60,
                maxLife: 60,
                color: '#ff0000',
                size: 6
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            return particle.life > 0;
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
    }
    
    loadSprites() {
        // Sprites podem ser carregados aqui se necessário
        // Por enquanto, usamos desenho programático
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializa o jogo quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
}); 