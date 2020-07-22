// In order for the Asteroid class to inherit the behavior of a Mass, we’ll need to manipulate the object prototypes.
// This prototype manipulation allows for a child class constructor to pass parameters to the parent constructor via the super method.
function extend(ChildClass, ParentClass) {
    // create an instance of the parent class first
    var parent = new ParentClass();
    // now replace the childclass with the parent
    ChildClass.prototype = parent;
    // now sort out a way to call the parent constuctor from within the child constructor via the use of super
    ChildClass.prototype.super = parent.constructor;
    // now, the constructor of the child class prototype (which is the parent class instance) is set back to the child class.
    ChildClass.prototype.constructor = ChildClass;
}

// this Mass constructor stores a position (x/y), velocity (x/y), an angle and rotation speed.
// this will be extended to produce an Asteroid and Ship class that will.
// This will help obey Newton's law
function Mass(mass, radius, x, y, angle, x_speed, y_speed, rotation_speed) {
    this.mass = mass || 1;
    this.radius = radius;
    this.x = x || 0;
    this.y = y || 0;

    this.angle = angle || 0;
    this.x_speed = x_speed || 0;
    this.y_speed = y_speed || 0;
    this.rotation_speed = rotation_speed || 0;
}

// This function updates the mass and applies Newtons first law.
// It also ensure that the objects wrap around the canvas when it moves
// off the edge
Mass.prototype.update = function (elapsed, ctx) {
    this.x += this.x_speed * elapsed;
    this.y += this.y_speed * elapsed;
    this.angle += this.rotation_speed * elapsed;
    this.angle %= 2 * Math.PI;
    if (this.x - this.radius > ctx.canvas.width) {
        this.x = -this.radius;
    }
    if (this.x + this.radius < 0) {
        this.x = ctx.canvas.width + this.radius;
    }
    if (this.y - this.radius > ctx.canvas.height) {
        this.y = -this.radius;
    }
    if (this.y + this.radius < 0) {
        this.y = ctx.canvas.height + this.radius;
    }
};

// To test out our parent Mass class, we need a draw method. This will be overridden in any child classes. PLACEHOLDER function
Mass.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
    ctx.restore();
};

// IMPEMENT NEWTONS SECOND LAW OF MOTION when hitting an object
Mass.prototype.push = function (angle, force, elapsed) {
    this.x_speed += (elapsed * (Math.cos(angle) * force)) / this.mass;
    this.y_speed += (elapsed * (Math.sin(angle) * force)) / this.mass;
};

// HELPER FUNCTION - calculate the twist
Mass.prototype.twist = function (force, elapsed) {
    this.rotation_speed += (elapsed * force) / this.mass;
};

//HELPER FUNCTION - calculate the speed of a Mass
Mass.prototype.speed = function () {
    return Math.sqrt(Math.pow(this.x_speed, 2) + Math.pow(this.y_speed, 2));
};

//HELPER FUNCTION - calculate the angle of a Mass
Mass.prototype.movement_angle = function () {
    return Math.atan2(this.y_speed, this.x_speed);
};

// this function below is an object constructor.
// It will be used for creating more asteroids
function Asteroid(mass, x, y, x_speed, y_speed, rotation_speed) {
    // Internally, the asteroid calculates a radius value from the given mass based on a fixed density value.
    var density = 1; // kg per square pixel
    var radius = Math.sqrt(mass / density / Math.PI);

    // By calling the below, set the mass, radius, x, y, angle, x_speed, y_speed, and rotation_speed properties of our object
    this.super(mass, radius, x, y, 0, x_speed, y_speed, rotation_speed);

    // now set hte asteroid shape
    this.circumference = 2 * Math.PI * this.radius;
    this.segments = Math.ceil(this.circumference / 15);
    this.segments = Math.min(25, Math.max(5, this.segments));
    this.noise = 0.2;
    this.shape = [];
    for (var i = 0; i < this.segments; i++) {
        this.shape.push(2 * (Math.random() - 0.5));
    }
}
// call the extend function and pass in the child class (Asteroid) and the parent class (Mass)
// This sets Asteroid.super to the Mass Constructor...
// Critically, this sets the Asteroid.prototype to an instance of Mass
extend(Asteroid, Mass);

// THE BELOW FUNCTOIN IS NOT NEEDED AS WE ARE EXTENDING ASTEROID TO MASS WHIC HAS ITS OWN UPDATE METHOD IN WHICH IT WILL USE
// we are extending teh prototype. EAch individual asteroid will be governed by the below
// elapsed = time that elapsed in seconds since the last frame was rendered.
// xspeed & yspeed are pixels per second. They are multiplied by the elapsed to calculate the exact number of pixels to move.
// Asteroid.prototype.update = function (elapsed) {
//     if (this.x - this.radius + elapsed * this.x_speed > context.canvas.width) {
//         this.x = -this.radius;
//     }
//     if (this.x + this.radius + elapsed * this.x_speed < 0) {
//         this.x = context.canvas.width + this.radius;
//     }
//     if (this.y - this.radius + elapsed * this.y_speed > context.canvas.height) {
//         this.y = -this.radius;
//     }
//     if (this.y + this.radius + elapsed * this.y_speed < 0) {
//         this.y = context.canvas.height + this.radius;
//     }
//     this.x += elapsed * this.x_speed;
//     this.y += elapsed * this.y_speed;
//     this.angle = (this.angle + this.rotation_speed * elapsed) % (2 * Math.PI);
// };

// we have transferred the draw method from extercise7.html into another Asteroid prototype method here. We can now remove the old one in the html file.
Asteroid.prototype.draw = function (ctx, guide) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    draw_asteroid(ctx, this.radius, this.shape, {
        noise: this.noise,
        guide: guide,
    });
    ctx.restore();
};

Asteroid.prototype.child = function (mass) {
    return new Asteroid(
        mass,
        this.x,
        this.y,
        this.x_speed,
        this.y_speed,
        this.rotation_speed
    );
};

// The ship is a mass floating in space just like an asteroid.
function Ship(mass, radius, x, y, power, weapon_power) {
    this.super(mass, radius, x, y, 1.5 * Math.PI);
    // use the below to determine how much power to apply
    this.thruster_power = power;
    // the below is used for steering. This will be updated via the ship.prototype.update method
    this.steering_power = this.thruster_power / 20;
    this.right_thruster = false;
    this.left_thruster = false;
    // use this boolean to geterme if thruster is on or off
    this.thruster_on = false;
    this.retro_on = false;
    // need a varaible to determine the power when shooting a projectile.
    this.weapon_power = weapon_power;
    this.loaded = false;
    this.weapon_reload_time = 0.25; // seconds
    this.time_until_reloaded = this.weapon_reload_time;
    // use the circle around the ship to detect if an asteroid hits it
    this.compromised = false;
    this.max_health = 2.0;
    this.health = this.max_health;
}
extend(Ship, Mass);

Ship.prototype.draw = function (ctx, guide) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (guide && this.compromised) {
        ctx.save();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    // draw the ship and include the thruster
    draw_ship(ctx, this.radius, {
        guide: guide,
        thruster: this.thruster_on,
    });
    ctx.restore();
};

// this update function ensure to push the ship in the direct it is pointing only if
// thrusters are on incorporating tehe angle too.
// Then call the MAss.prototype.update method.
Ship.prototype.update = function (elapsed) {
    this.push(
        this.angle,
        (this.thruster_on - this.retro_on) * this.thruster_power,
        elapsed
    );
    // take difference of the 2 thrusters...if both are on, result = zero. Else it is -1 or 1 multilied by steering power
    this.twist(
        (this.right_thruster - this.left_thruster) * this.steering_power,
        elapsed
    );

    // reload as necessary
    this.loaded = this.time_until_reloaded === 0;
    if (!this.loaded) {
        this.time_until_reloaded -= Math.min(elapsed, this.time_until_reloaded);
    }
    // decrement health if an asteroid is in the collision radius of the ship
    if (this.compromised) {
        this.health -= Math.min(elapsed, this.health);
    }

    // We need to call a method of a parent class when we the child class has overridden them.
    // need to use function.apply to
    // call the Mass.prototype.update method, passing in our this keyword to reference the ship instance and the arguments list passed into the function.
    Mass.prototype.update.apply(this, arguments);
};

// this function ties a projectile to a ship.
Ship.prototype.projectile = function (elapsed) {
    // instantiate a projectile with a mass and a life of '1 second'
    var projectile = new Projectile(
        0.025,
        1,
        //calculate the x/y co-orindates at ateh front of the ship
        this.x + Math.cos(this.angle) * this.radius,
        this.y + Math.sin(this.angle) * this.radius,
        // set the projectiles speed & rotation initially the same as the ship.
        this.x_speed,
        this.y_speed,
        this.rotation_speed
    );
    // now push the projectice in the direcgionr of the ship by a variable called "weapon_ppower"
    // make the ship push back a little to mimick newton's 3rd law
    projectile.push(this.angle, this.weapon_power, elapsed);
    this.push(this.angle + Math.PI, this.weapon_power, elapsed);
    this.time_until_reloaded = this.weapon_reload_time;
    return projectile;
};

// PROJECTILE CONSTRUCTOR
function Projectile(mass, lifetime, x, y, x_speed, y_speed, rotation_speed) {
    var density = 0.001; // low density means we can see very light projectiles
    var radius = Math.sqrt(mass / density / Math.PI);
    this.super(mass, radius, x, y, 0, x_speed, y_speed, rotation_speed);
    this.lifetime = lifetime;
    this.life = 1.0;
}
extend(Projectile, Mass);

// make the projectile decrement down at each frame rate so it will die out and not consume resources.
Projectile.prototype.update = function (elapsed, ctx) {
    this.life -= elapsed / this.lifetime;
    Mass.prototype.update.apply(this, arguments);
};

// this function darws the projectile on the screen
Projectile.prototype.draw = function (ctx, guide) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    draw_projectile(ctx, this.radius, this.life, guide);
    ctx.restore();
};

// consructor for indictor
function Indicator(label, xPosition, yPosition, width, height) {
    this.label = label + ": ";
    this.xPosition = xPosition;
    this.yPosition = yPosition;
    this.width = width;
    this.height = height;
}

// The constructor has a draw method
Indicator.prototype.draw = function (ctx, max, level) {
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.font = this.height + "pt Arial";
    var offset = ctx.measureText(this.label).width;
    ctx.fillText(this.label, this.xPosition, this.yPosition + this.height - 1);
    ctx.beginPath();
    ctx.rect(offset + this.xPosition, this.yPosition, this.width, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(
        offset + this.xPosition,
        this.yPosition,
        this.width * (max / level),
        this.height
    );
    ctx.fill();
    ctx.restore();
};

// now we add a score indicator
function NumberIndicator(label, x, y, options) {
    options = options || {};
    this.label = label + ": ";
    this.x = x;
    this.y = y;
    this.digits = options.digits || 0;
    this.pt = options.pt || 10;
    this.align = options.align || "end";
}

NumberIndicator.prototype.draw = function (ctx, value) {
    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = this.pt + "pt Arial";
    ctx.textAlign = this.align;
    ctx.fillText(
        this.label + value.toFixed(this.digits),
        this.x,
        this.y + this.pt - 1
    );
    ctx.restore();
};

function Message(x, y, options) {
    options = options || {};
    this.x = x;
    this.y = y;
    this.main_pt = options.main_pt || 28;
    this.sub_pt = options.sub_pt || 18;
    this.fill = options.fill || "white";
    this.textAlign = options.align || "center";
}

Message.prototype.draw = function (ctx, main, sub) {
    ctx.save();
    ctx.fillStyle = this.fill;
    ctx.textAlign = this.textAlign;
    ctx.font = this.main_pt + "pt Arial";
    ctx.fillText(main, this.x, this.y);
    ctx.font = this.sub_pt + "pt Arial";
    ctx.fillText(sub, this.x, this.y + this.main_pt);
    ctx.restore();
};
