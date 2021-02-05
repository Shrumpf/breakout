let gameWidth;
let gameHeight;
let Canvas;
let ctx;
let game;

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

class Game {
    _left_pressedkey;
    _right_pressedkey;

    Paddle = new Paddle(0, gameHeight - 47);
    Balls = [new Ball(255, 500)];
    Breaks = [];
    _secondsPassed;
    _oldTimeStamp;
    Fps;
    State = 0;
    Score = 0;
    Highscore = parseInt(localStorage.getItem('highscore') ?? 0);

    constructor(columns, rows) {
        this._columns = columns;
        this._rows = rows;

        this.init();
    }

    keypress(key, state) {
        switch (state) {
            case "down": {
                switch (key) {
                    case "left":
                        this._left_pressedkey = true;
                        break;
                    case "right":
                        this._right_pressedkey = true;
                        break;
                }
                break;
            }
            case "up": {
                switch (key) {
                    case "left":
                        this._left_pressedkey = false;
                        break;
                    case "right":
                        this._right_pressedkey = false;

                }
                break;
            }
        }
    }

    moveMouse(mousePos) {
        this.Paddle.X = mousePos.X - this.Paddle.Width / 2
    }

    init() {
        for (let y = 0; y < this._columns; y++) {
            for (let x = 0; x < this._rows; x++) {
                this.Breaks.push(new Stone(x * 110, y * 30))
            }
        }
        this.State = 1;
        window.requestAnimationFrame(this.gameloop.bind(this));
    }

    RectCircleColliding(circle, rect) {
        var distX = Math.abs(circle.X - rect.X - rect.Width / 2);
        var distY = Math.abs(circle.Y - rect.Y - rect.Height / 2);

        if (distX > (rect.Width / 2 + circle.Radius)) { return false; }
        if (distY > (rect.Height / 2 + circle.Radius)) { return false; }

        if (distX <= (rect.Width / 2)) { return true; }
        if (distY <= (rect.Height / 2)) { return true; }

        var dx = distX - rect.Width / 2;
        var dy = distY - rect.Height / 2;
        return (dx * dx + dy * dy <= (circle.r * circle.r));
    }

    collisionDetection() {
        this.Balls.forEach(ball => {

            let bx = ball.X;
            let bdx = ball.DX;
            let by = ball.Y;
            let bdy = ball.DY;
            let br = ball.Radius;

            if (bx + bdx > gameWidth - br || bx + bdx < br) {
                ball.DX = -ball.DX;
            }

            if (by + bdy < br) {
                ball.DY = -ball.DY;

            }

            if (by + br >= gameHeight) {
                ball.DY = - ball.DY;
                this.State = 0;
                if (this.Score > this.Highscore) {
                    localStorage.setItem('highscore', this.Score);
                }

                Start();
            }

            const paddleHitX = bx + br > this.Paddle.X && bx - br < this.Paddle.X + this.Paddle.Width;
            const paddleHitY = by + br >= this.Paddle.Y && by - br < this.Paddle.Y + this.Paddle.Height;
            if (paddleHitX && paddleHitY) {
            //     float paddleHitPos = (position.x - paddleX) / (PADDLE_WIDTH / 2);
			// speed.y = -speed.y;
            // speed.x = paddleHitPos * RECOIL_X_MAX;
                
                // let paddleHitPos = (ball.X - this.Paddle.X) / (this.Paddle.Width);
                let paddleHitPos = (ball.X - this.Paddle.X - (this.Paddle.Width / 2)) / (this.Paddle.Width / 2);
                
                ball.DX = Math.min(Math.max(paddleHitPos * 6, -6), 6);
                ball.DY = -ball.DY;
            }

            this.Breaks.forEach((b) => {
                if (b.State) {
                    // const hitY = by + br > b.Y && by - br < b.Y + b.Height
                    // const hitX = bx + br > b.X && bx - br < b.X + b.Width;
                    // if (hitY && hitX) {
                    //     // debugger;
                    //     this._ball.DY = -this._ball.DY;
                    //     // this._ball.DX = -this._ball.DX;
                    //     b._state = false;
                    // }

                    // const distanceX = Math.abs(this._ball.X - b.X - b.Width / 2);
                    // const distanceY = Math.abs(this._ball.Y - b.Y - b.Height / 2);

                    // if (distanceX <= (b.Width / 2)) {
                    //     // collide
                    //     // debugger;
                    // }

                    // if (distanceY <= (b.Height / 2)) {
                    //     // collide
                    //     debugger;
                    // }

                    // const dx = distanceX - b.Width / 2;
                    // const dy = distanceY - b.Height / 2;
                    // if (dx * dx + dy * dy <= (this._ball.Radius * this._ball.Radius)) {
                    //     // collide
                    //     debugger;
                    // }

                    if (this.RectCircleColliding(ball, b)) {
                        b.State = false;
                        this.Score++;
                        ball.DY = -ball.DY
                    }
                }
            })
        })
    }

    drawInterface() {
        ctx.font = "30px Roboto";
        ctx.fillText("Score: " + this.Score, gameWidth - 200, 50); 
        ctx.fillText("Highscore: " + this.Highscore, gameWidth - 200, 80);
        ctx.fillText("FPS: " + this.Fps, gameWidth - 200, 110);
    }

    gameloop(timeStamp) {
        if (this.State === 0) {
            // do nothing
        } else if (this.State === 1) {

            // Calculate the number of seconds passed since the last frame
            this._secondsPassed = (timeStamp - this._oldTimeStamp) / 1000;
            this._oldTimeStamp = timeStamp;

            // Calculate fps
            this.Fps = Math.round(1 / this._secondsPassed);

            if (this._left_pressedkey) {
                this.Paddle.X -= this.Paddle.Velocity * this._secondsPassed;
            }

            if (this._right_pressedkey) {
                this.Paddle.X += this.Paddle.Velocity * this._secondsPassed;
            }

            // this.Paddle.X = (this.Balls[0].X - this.Paddle.Width);

            this.collisionDetection();
            this.clear();

            this.Balls.forEach(ball => {
                ball.X += ball.DX;
                ball.Y += ball.DY;
            })
            this.drawInterface();
            this.draw();
            this.debug();
        }
        window.requestAnimationFrame(this.gameloop.bind(this));
    }

    draw() {
        this.Breaks.forEach((b) => {
            b.draw();
        });
        this.Paddle.draw();
        this.Balls.forEach(ball => {
            ball.draw();
        });
    }

    debug() {

        this.Balls.forEach(ball => {
            let l = [
                [ball.X +ball.Radius, ball.Y + ball.Radius],
                [ball.X - ball.Radius, ball.Y - ball.Radius],
                [ball.X + ball.Radius, ball.Y - ball.Radius],
                [ball.X - ball.Radius, ball.Y + ball.Radius],
                [ball.X, ball.Y]
            ];

            l.forEach(i => {
                ctx.beginPath();
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.arc(i[0], i[1], 2, 0, 6.283185307179586);
                ctx.fill();
            })
        })
        ctx.beginPath();
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.arc(this.Paddle.X, this.Paddle.Y, 2, 0, 6.283185307179586);
        ctx.fill();
    }

    clear() {
        ctx.clearRect(0, 0, gameWidth, gameHeight);
    }
}

class Stone {
    Height = 25;
    Width = 100;
    State = true;
    constructor(x, y) {
        this.X = x;
        this.Y = y;
        this.Color = getRandomColor();
    }

    draw() {
        if (this.State) {
            ctx.fillStyle = this.Color;
            ctx.fillRect(this.X, this.Y, this.Width, this.Height);
        }
    }
}

class Paddle {
    Height = 25;
    Width = 200;
    Velocity = 1000;
    constructor(x, y) {
        this.X = x;
        this.Y = y;
    }

    draw() {
        ctx.fillStyle = 'rgb(0, 0, 255';
        ctx.fillRect(this.X, this.Y, this.Width, this.Height);
    }
}

class Ball {
    Radius = 15;
    DX = 4;
    DY = -4;
    constructor(x, y) {
        this.X = x;
        this.Y = y;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.arc(this.X, this.Y, this.Radius, 0, (Math.PI / 180) * 360);
        ctx.fill();
    }
}

function Start() {
    gameWidth = window.innerWidth / 2;
    gameHeight = window.innerHeight / 2;
    
    Canvas = document.getElementById('Paper')
    ctx = Canvas.getContext('2d');
    
    Canvas.width = gameWidth;
    Canvas.height = gameHeight;
    game = new Game(8, 8);

    Canvas.addEventListener('mousemove', function(evt) {
        game.moveMouse(getMousePos(Canvas, evt));
      }, false);
}

Start();


window.onkeydown = function (evt) {
    if (evt.key === "ArrowRight") {
        game.keypress("right", "down");

    } else if (evt.key === "ArrowLeft") {
        game.keypress("left", "down")
    }
}

window.onkeyup = function (evt) {
    if (evt.key === "ArrowRight") {
        game.keypress("right", "up");

    } else if (evt.key === "ArrowLeft") {
        game.keypress("left", "up");
    }
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      X: evt.clientX - rect.left,
      Y: evt.clientY - rect.top
    };
  }

