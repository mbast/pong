;
(function() {
    'use strict';

    var Ball = function(canvas_size) {
        this.canvas_size = canvas_size;
        this.radius = 12;
        this.velocity = this.velocity_start();
        this.center = this.center_start();
    };

    Ball.prototype = {
        velocity_start: function() {
            return {
                x: (Math.random() - 0.5),
                y: 4.3*Math.sign(Math.random() - 0.5)
            };
        },
        center_start: function() {
            return {
                x: this.canvas_size.x / 2,
                y: this.canvas_size.y / 2
            };
        },
        draw: function(screen) {
            screen.beginPath();
            screen.strokeStyle = "#AAAAAA";
            screen.fillStyle = "#AAAAAA";
            screen.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false);
            screen.fill();
            screen.stroke();
            screen.closePath();
        },
        check_collision: function(paddle) {
            var direction = Math.sign(this.velocity.y);
            var py = paddle.center.y - paddle.size.y / 2;
            var by = this.center.y + direction * this.radius;
            var diff_y = direction * (py - by);
            if (
                ((this.center.x + this.radius) >= (paddle.center.x - paddle.size.x / 2)) &&
                ((this.center.x - this.radius) <= (paddle.center.x + paddle.size.x / 2)) &&
                (diff_y > -2.0 * this.radius) &&
                (diff_y <= 0.0)
            ) {
                if (this.center.x >= (paddle.center.x + paddle.size.x / 2)) {
                    var diff_x = this.center.x - (paddle.center.x + paddle.size.x / 2);
                    this.velocity.x = 0.5*diff_x;
                }
                if (this.center.x <= (paddle.center.x - paddle.size.x / 2)) {
                    var diff_x = this.center.x - (paddle.center.x - paddle.size.x / 2);
                    this.velocity.x = 0.5*diff_x;
                }

                this.velocity.y *= -1.0;
            }
        },
        update: function(paddle1, paddle2) {

            // ueberpruefe ob der Ball die Leinwand nach unten verlaesst
            if ((this.center.y + this.radius) >= this.canvas_size.y) {
                this.velocity = this.velocity_start();
                this.center = this.center_start();
                return [1, 0];
            }

            // ueberpruefe ob der Ball die Leinwand nach oben verlaesst
            if ((this.center.y) <= this.radius) {
                this.velocity = this.velocity_start();
                this.center = this.center_start();
                return [0, 1];
            }

            // ueberpruefe Kollision mit rechter Wand
            if ((this.center.x + this.radius) >= this.canvas_size.x) {
                this.velocity.x *= -1.0;
            }

            // ueberpruefe Kollision mit linker Wand
            if ((this.center.x) <= this.radius) {
                this.velocity.x *= -1.0;
            }

            // ueberpruefe Kollision mit paddle1
            if (this.velocity.y > 0.0) this.check_collision(paddle1);

            // ueberpruefe Kollision mit paddle2
            if (this.velocity.y < 0.0) this.check_collision(paddle2);

            // bewege den Ball
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;

            return [0, 0];
        },
    };

    var Paddle = function(canvas_size, center) {
        this.canvas_size = canvas_size;
        this.size = {
            x: 80,
            y: 8
        };
        this.velocity = 0.0;
        this.max_velocity = 4.0;
        this.center = center;
    };

    Paddle.prototype = {
        draw: function(screen, body) {
            screen.beginPath();
            screen.strokeStyle = "#FFFFFF";
            screen.fillStyle = "#FFFFFF";
            screen.rect(this.center.x - this.size.x / 2,
                this.center.y - this.size.y / 2,
                this.size.x,
                this.size.y);
            screen.fill();
            screen.stroke();
            screen.closePath();
        },
        left: function() {
            if ((this.center.x - this.size.x / 2) > 0) {
                this.velocity = -this.max_velocity;
                this.center.x += this.velocity;
            }
        },
        right: function() {
            if ((this.center.x + this.size.x / 2) < this.canvas_size.x) {
                this.velocity = this.max_velocity;
                this.center.x += this.velocity;
            }
        },
        update: function(keys_down) {
            this.velocity = 0.0;
            if (keys_down.left) {
                this.left();
            } else if (keys_down.right) {
                this.right();
            }
        },
        follow: function(body) {
            this.velocity = 0.0;
            if (body.center.x > (this.center.x + this.max_velocity)) {
                this.right();
            } else if (body.center.x < (this.center.x - this.max_velocity)) {
                this.left();
            }
        },
    };

    var Keyboarder = function() {
        var keyState = {};
        window.onkeydown = function(e) {
            keyState[e.keyCode] = true;
        };
        window.onkeyup = function(e) {
            keyState[e.keyCode] = false;
        };
        this.isDown = function(keyCode) {
            return keyState[keyCode] === true;
        };
        this.keys_down = function() {
            return {
                left: this.isDown(37),
                right: this.isDown(39),
                space: this.isDown(32)
            };
        };
    };

    window.onload = function() {
        var canvas = document.getElementById("screen");

        var screen = canvas.getContext('2d');
        screen.font = "20px PressStart2PRegular";
        document.body.style.backgroundColor = "black";

        var canvas_size = {
            x: canvas.width,
            y: canvas.height
        };

        var keyboarder = new Keyboarder();

        var ball = new Ball(canvas_size);

        var paddle1 = new Paddle(canvas_size, {
            x: canvas_size.x / 2,
            y: canvas_size.y - 100
        });
        var paddle2 = new Paddle(canvas_size, {
            x: canvas_size.x / 2,
            y: 100
        });

        var score = {
            player1: 0,
            player2: 0
        };

        var game_paused = true;

        var tick = function() {
            // loesche den Bildschirm
            screen.clearRect(0, 0, canvas_size.x, canvas_size.y);

            // zeichne die Box um das Spielfeld
            screen.beginPath();
            screen.strokeStyle = "#FFFFFF";
            screen.fillStyle = "#FFFFFF";
            screen.rect(0, 0, canvas_size.x, canvas_size.y);
            screen.lineWidth = 10;
            screen.stroke();
            screen.lineWidth = 1;
            screen.closePath();

            // schreibe Score auf den Bildschirm
            screen.fillText("score: " + score.player2.toString() + "-" + score.player1.toString(), 20, 40);

            // zeichne Objekte
            ball.draw(screen);
            paddle1.draw(screen);
            paddle2.draw(screen);

            // Keyboard-input
            var keys_down = keyboarder.keys_down();

            if (game_paused) {
                // Spiel ist angehalten
                // warte bis der Spieler die Leertaste drueckt
                if (score.player1 > 9) screen.fillText("you lost", 20, 140);
                if (score.player2 > 9) screen.fillText("you won", 20, 140);
                screen.fillText("hit space to start", 20, 180);
                if (keys_down.space) {
                    game_paused = false;
                    // Spiel startet
                    // wir setzen den Score zurueck auf null
                    score.player1 = 0;
                    score.player2 = 0;
                }
            } else {
                // Spiel laeuft
                // bewege den Ball
                var score_increment = ball.update(paddle1, paddle2);
                // update den Score
                score.player1 += score_increment[0];
                score.player2 += score_increment[1];
                // bewege den Spieler paddle
                paddle1.update(keys_down);
                // bewege den Computer paddle
                paddle2.follow(ball);
            }

            // falls Spieler oder Computer 10 Punkte erreicht, halten wir an
            if (score.player1 > 9 || score.player2 > 9) game_paused = true;

            // naechster AnimationFrame
            requestAnimationFrame(tick);
        };

        tick();
    };
})();
