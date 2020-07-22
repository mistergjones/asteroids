// COLLISION DETECTION

// detect a collsion by...if the distance between their centers is small than the sum of each of their radius.
function collision(obj1, obj2) {
    return distance_between(obj1, obj2) < obj1.radius + obj2.radius;
}
// this function calculates the distance
function distance_between(obj1, obj2) {
    return Math.sqrt(
        Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)
    );
}

// Write the asteroid game constructor
// give it the 'id' of the canvas
var AsteroidsGame = function (id) {
    // get the element id of id and assign to canvas
    this.canvas = document.getElementById(id);

    // now assign the context and provide th focus
    this.ctx = this.canvas.getContext("2d");
    // set this canvas to be focus
    this.canvas.focus();

    this.guide = false; // dont give it a grid guide
    this.ship_mass = 10;
    this.ship_radius = 15;
    this.asteroid_mass = 10000; // Mass of asteroids
    this.asteroid_push = 5000000; //max force to apply in one frame

    this.mass_destroyed = 500;

    this.health_indicator = new Indicator("health", 5, 5, 100, 10);

    this.score_indicator = new NumberIndicator(
        "score",
        this.canvas.width - 10,
        5
    );

    // define the game over message property
    this.message = new Message(this.canvas.width / 2, this.canvas.height * 0.4);
    //key event add listeners. We 'bind' these callback functions to the game instance.
    this.canvas.addEventListener("keydown", this.keyDown.bind(this), true);
    this.canvas.addEventListener("keyup", this.keyUp.bind(this), true);
    // call
    window.requestAnimationFrame(this.frame.bind(this));

    this.reset_game();
};

// this functoin will increase the level count and create more asteroids
AsteroidsGame.prototype.level_up = function () {
    this.level += 1;
    for (var i = 0; i < this.level; i++) {
        this.asteroids.push(this.moving_asteroid());
    }
};

// this functoin will help reset the game properties when the ship dies.
AsteroidsGame.prototype.reset_game = function () {
    // keep track if game is over
    this.game_over = false;
    this.score = 0;
    // alway reset the level to 0 when we die
    this.level = 0;

    // instantiate the ship in the middle of screen
    this.ship = new Ship(
        this.ship_mass,
        this.ship_radius,
        this.canvas.width / 2,
        this.canvas.height / 2,
        1000,
        200
    );

    // estalish an array to track projecti;es
    this.projectiles = [];
    //establish an aray to track/create asteroids
    this.asteroids = [];
    this.level_up();
    // now add a single moving asteroid. Need to reference the AsteroidsGame.prototype.moving_asteroid helper method
    this.asteroids.push(this.moving_asteroid()); //need to write this function
};

AsteroidsGame.prototype.moving_asteroid = function (elapsed) {
    // create an asteroid
    var asteroid = this.new_asteroid();
    // push/twist it etc
    this.push_asteroid(asteroid, elapsed);
    // return it.
    return asteroid;
};

// helpter method to create a new asteroid in random position
AsteroidsGame.prototype.new_asteroid = function () {
    return new Asteroid(
        // generate a random width and height and mass
        this.canvas.width * Math.random(),
        this.canvas.height * Math.random(),
        this.asteroid_mass
    );
};

// helpter method to create a push/twist asteroid
AsteroidsGame.prototype.push_asteroid = function (asteroid, elapsed) {
    elapsed = elapsed || 0.015;
    // apply a force to the asteroid
    asteroid.push(2 * Math.PI * Math.random(), this.asteroid_push, elapsed);
    asteroid.twist(
        (Math.random() - 0.5) * Math.PI * this.asteroid_push * 0.02,
        elapsed
    );
};

AsteroidsGame.prototype.split_asteroid = function (asteroid, elapsed) {
    // remove some of the mass
    asteroid.mass -= this.mass_destroyed;
    // add some score to the game given we have shot an asteroid
    this.score += this.mass_destroyed;
    // split the asteroid
    var split = 0.25 + 0.5 * Math.random(); // split unevenly
    // now we create two asteroids which need to inherit the same properties (position, speed etc)
    var ch1 = asteroid.child(asteroid.mass * split);
    var ch2 = asteroid.child(asteroid.mass * (1 - split));
    // with each split asteroid, need to add this this to the game
    [ch1, ch2].forEach(function (child) {
        // if the mass is too small, simply don't add it.
        if (child.mass < this.mass_destroyed) {
            this.score += child.mass;
        } else {
            this.push_asteroid(child, elapsed);
            this.asteroids.push(child);
        }
    }, this);
};

// Wrappers for key handler
AsteroidsGame.prototype.keyDown = function (e) {
    this.key_handler(e, true);
};
AsteroidsGame.prototype.keyUp = function (e) {
    this.key_handler(e, false);
};

AsteroidsGame.prototype.key_handler = function (e, value) {
    var nothing_handled = false;
    switch (e.key || e.keyCode) {
        case "ArrowLeft":
        case 37: // left arrow
            this.ship.left_thruster = value;
            break;
        case "ArrowUp":
        case 38: // up arrow
            this.ship.thruster_on = value;
            break;
        case "ArrowRight":
        case 39: // right arrow
            this.ship.right_thruster = value;
            break;
        case "ArrowDown":
        case 40:
            this.ship.retro_on = value;
            break;
        case " ":
        case 32: //spacebar
            if (this.game_over) {
                this.reset_game();
            } else {
                this.ship.trigger = value;
            }
            break;
        case "g":
        case 71: // g for guide
            if (value) this.guide = !this.guide;
            break;
        default:
            nothing_handled = true;
    }
    if (!nothing_handled) e.preventDefault();
};

// this function is called in the last line of the constructor
AsteroidsGame.prototype.frame = function (timestamp) {
    if (!this.previous) this.previous = timestamp;
    var elapsed = timestamp - this.previous;
    this.fps = 1000 / elapsed;
    this.update(elapsed / 1000);
    this.draw();
    this.previous = timestamp;
    // the this.frame function is bound to the game instance when passed into window.requestAnimationFrame. This forces the this keyword to be set to the game instance when the frame function is called.
    window.requestAnimationFrame(this.frame.bind(this));
};

// This function controls all the game elements.
// It updates all the asteroids, the ship, and all the projectiles. It controls the removal of dead projectiles and the creation of new projectiles when the ship is loaded and the trigger is pulled. It contains nothing new, but we’re now always referencing attributes of our game object.
AsteroidsGame.prototype.update = function (elapsed) {
    // set the ship compromised (collission detection) to false
    this.ship.compromised = false;
    // updte each asteroid
    this.asteroids.forEach(function (asteroid) {
        asteroid.update(elapsed, this.ctx);
        // detect the collision. set ship.compromised to true
        if (collision(asteroid, this.ship)) {
            this.ship.compromised = true;
        }
    }, this);
    // now check to see if the ship health...so health to true if we are down to zero
    if (this.ship.health <= 0) {
        this.game_over = true;
        return;
    }

    // update the ship
    this.ship.update(elapsed, this.ctx);
    this.projectiles.forEach(function (projectile, idx, projectiles) {
        projectile.update(elapsed, this.ctx);
        if (projectile.life <= 0) {
            projectiles.splice(idx, 1);
        } else {
            //The addition of an else clause to the if(p.life <= 0) block ensures that we only test projectiles that are currently live in the game.
            this.asteroids.forEach(function (asteroid, j) {
                if (collision(asteroid, projectile)) {
                    projectiles.splice(idx, 1);
                    this.asteroids.splice(j, 1);
                    // function to to split the asteroid if hit by projectile
                    this.split_asteroid(asteroid, elapsed);
                }
            }, this);
        }
    }, this);
    if (this.ship.trigger && this.ship.loaded) {
        this.projectiles.push(this.ship.projectile(elapsed));
    }
};

// this function draws the whole game
AsteroidsGame.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // if guide is true, draw guide
    if (this.guide) {
        draw_grid(this.ctx);
        // draw asteroids with a line showing the projectile
        this.asteroids.forEach(function (asteroid) {
            draw_line(this.ctx, asteroid, this.ship);
            this.projectiles.forEach(function (projectile) {
                draw_line(this.ctx, asteroid, projectile);
            }, this);
        }, this);
        // draw the fps if grid guide is true
        this.fps_indicator.draw(this.ctx, this.fps);
    }
    // draw the asteroids
    this.asteroids.forEach(function (asteroid) {
        asteroid.draw(this.ctx, this.guide);
    }, this);

    // if the game is over, don't draw the ship again. ASteroids will continue to float about etc.
    if (this.game_over) {
        this.message.draw(this.ctx, "Game over", "Press space to play again");
        return;
    }

    // draw the ship
    this.ship.draw(this.ctx, this.guide);

    // draw athe projectiles
    this.projectiles.forEach(function (projectile) {
        projectile.draw(this.ctx);
    }, this);

    this.health_indicator.draw(
        this.ctx,
        this.ship.health,
        this.ship.max_health
    );

    this.score_indicator.draw(this.ctx, this.score);
};

// this helper method initialises the split asteroid with th esame veloctiy/rotation/postion as their parent
Asteroid.prototype.child = function (mass) {
    return new Asteroid(
        this.x,
        this.y,
        mass,
        this.x_speed,
        this.y_speed,
        this.rotation_speed
    );
};
