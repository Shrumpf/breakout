let gameWidth;
let gameHeight;
let Canvas;
let ctx;
let game;


const Droppables = [
    {
        Weight: 0.9,
        Name: "Nothing",
        Value: 0
    },
    {
        Weight: 0.01,
        Name: "Double Balls",
        Value: 1,
    },
    {
        Weight: 0.05,
        Name: "Bigger Paddle",
        Value: 2
    },
    {
        Weight: 0.04,
        Name: "Smaller Paddle",
        Value: 3
    },
    {
        Weight: 0,
        Name: "Faster Balls",
        Value: 4
    },
    {
        Weight: 0,
        Name: "Slow motion",
        Value: 5
    }
]
function getRandomDroppable() {
    var num = Math.random(),
        s = 0,
        lastIndex = Droppables.length - 1;

    for (var i = 0; i < lastIndex; ++i) {
        s += Droppables[i].Weight;
        if (num < s) {
            return Droppables[i];
        }
    }

    return Droppables[lastIndex];
};


function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

class Game {
    _paddleHitPositions = [];
    _left_pressedkey;
    _right_pressedkey;
    delta = null;

    Paddle = new Paddle(0, gameHeight - 47);
    Balls = [new Ball(this.Paddle.Width / 2, gameHeight - 70)];
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
        this.Paddle.X += mousePos * this.Paddle.Velocity * this.delta;
    }

    init() {
        let xOffset = (gameWidth / 2) - (this._columns / 2 * 110)
        let yOffset = 60;
        console.log(xOffset);

        for (let y = 0; y < this._columns; y++) {
            for (let x = 0; x < this._rows; x++) {
                this.Breaks.push(new Stone(x * 110 + xOffset, y * 30 + yOffset))
            }
        }
        this.State = 1;
        window.requestAnimationFrame(this.gameloop.bind(this));
    }

    RectCircleColliding(ball, block) {
        const distX = Math.abs(ball.X - block.X - block.Width / 2);
        const distY = Math.abs(ball.Y - block.Y - block.Height / 2);

        if (distX > (block.Width / 2 + ball.Radius) || distY > (block.Height / 2 + ball.Radius)) {
            return false;
        }

        if (distX <= (block.Width / 2) || distY <= (block.Height / 2)) {
            return true;
        }

        const dx = distX - block.Width / 2;
        const dy = distY - block.Height / 2;
        return (dx * dx + dy * dy <= (ball.r * ball.r));
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
                if (this.Balls.length === 1) {
                    this.State = 0;
                    if (this.Score > this.Highscore) {
                        localStorage.setItem('highscore', this.Score);
                    }
                    console.log(this._paddleHitPositions)
                    Start();
                } else {
                    this.Balls = this.Balls.filter(b => !(b.X === ball.X && b.Y === ball.Y))
                }
            }

            const paddleHitX = bx + br > this.Paddle.X && bx - br < this.Paddle.X + this.Paddle.Width;
            const paddleHitY = by + br >= this.Paddle.Y && by - br < this.Paddle.Y + this.Paddle.Height;
            if (paddleHitX && paddleHitY) {

                let paddleHitPos = (ball.X - this.Paddle.X - (this.Paddle.Width / 2)) / (this.Paddle.Width / 2);
                this._paddleHitPositions.push(paddleHitPos);
                ball.DX = Math.min(Math.max(paddleHitPos * ball.Velocity, -ball.Velocity), ball.Velocity);
                ball.DY = -ball.DY;
            }

            this.Breaks.forEach((b) => {
                if (b.State) {
                    if (this.RectCircleColliding(ball, b)) {
                        b.State = false;
                        this.Score++;
                        ball.DY = -ball.DY;
                        this.Breaks = this.Breaks.filter(brick => !(brick.X === b.X && brick.Y === b.Y));
                        
                        let randomDrop = getRandomDroppable();

                        switch (randomDrop.Value) {
                            case 1:
                                // Double balls
                                if (this.Balls.length <= 10) {
                                    this.Balls.push(new Ball(ball.X, ball.Y));
                                }
                                break;
                            case 2:
                                if (this.Paddle.Width * 2 <= this.Paddle.MaxWidth) {
                                    this.Paddle.Width *= 2;
                                }
                                // Bigger
                                break;
                            case 3:
                                if (this.Paddle.Width / 2 >= this.Paddle.MinWidth) {
                                    this.Paddle.Width = this.Paddle.Width / 2;
                                }
                                // Smaller
                                break;
                            case 4:
                                // Faster
                                break;
                            case 5:
                                // Slowmotion
                                break;
                        }

                        if (this.Breaks.length === 0) {
                            console.log(this._paddleHitPositions);
                            for (let y = 0; y < this._columns; y++) {
                                for (let x = 0; x < this._rows; x++) {
                                    this.Breaks.push(new Stone(x * 110, y * 30))
                                }
                            }
                        }
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
            if (this._oldTimeStamp === undefined) {
                this._oldTimeStamp = timeStamp;
            }
            this.delta = (timeStamp - this._oldTimeStamp) / (1000 / 100);
            this._secondsPassed = (timeStamp - this._oldTimeStamp) / 1000;
            this._oldTimeStamp = timeStamp;

            // Calculate fps
            this.Fps = Math.round(1 / this._secondsPassed);

            if (this._left_pressedkey) {
                this.Paddle.X -= this.Paddle.Velocity * this.delta;
            }

            if (this._right_pressedkey) {
                this.Paddle.X += this.Paddle.Velocity * this.delta;
            }

            // if (this._paddleHitPositions.length < 11) {                
            //     this.Paddle.X = (this.Balls[0].X - this.Paddle.Width / 1.5);
            // } else if (this._paddleHitPositions.length < 21) {
            //     this.Paddle.X = (this.Balls[0].X - this.Paddle.Width / 3);
            // } else if (this._paddleHitPositions.length < 31) {
            //     this.Paddle.X = (this.Balls[0].X - this.Paddle.Width / 2);
            // }

            this.collisionDetection();
            this.clear();

            this.Balls.forEach(ball => {
                ball.X += ball.DX * this.delta// * (this.Score ? this.Score : 1 * 0.1);
                ball.Y += ball.DY * this.delta// * (this.Score ? this.Score : 1 * 0.1);;
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
                [ball.X + ball.Radius, ball.Y + ball.Radius],
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
    DefaultHeight = 25;
    MaxHeight = 25;
    Height = this.DefaultHeight;

    DefaultWidth = 200;
    Width = this.DefaultWidth;
    MinWidth = 50;
    MaxWidth = 800;
    Velocity = 2;
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
    Velocity = 6;
    constructor(x, y) {
        this.X = x;
        this.Y = y;
        this.DX = this.Velocity;
        this.DY = -this.Velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.arc(this.X, this.Y, this.Radius, 0, (Math.PI / 180) * 360);
        ctx.fill();
    }
}

function Start() {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;

    Canvas = document.getElementById('Paper')
    ctx = Canvas.getContext('2d');

    Canvas.width = gameWidth;
    Canvas.height = gameHeight;
    game = new Game(8, 8);
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

Canvas.requestPointerLock = Canvas.requestPointerLock ||
                            Canvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;

Canvas.onclick = function() {
  Canvas.requestPointerLock();
};

let x = 0;
let y = 0;

function updatePosition(evt) {
    game.moveMouse(evt.movementX);
}

document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

function lockChangeAlert() {
  if (document.pointerLockElement === Canvas ||
      document.mozPointerLockElement === Canvas) {
    document.addEventListener("mousemove", updatePosition, false);
  } else {
    document.removeEventListener("mousemove", updatePosition, false);
  }
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        X: evt.clientX - rect.left,
        Y: evt.clientY - rect.top
    };
}

