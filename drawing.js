//            is a canvas contet,
function draw_grid(ctx, minor, major, stroke, fill) {
    minor = minor || 10;
    major = major || minor * 5;
    stroke = stroke || "#00FF00";
    fill = fill || "#009900";
    // added ctx.save() to save the clean state before restoring it at the bottom
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    let width = ctx.canvas.width,
        height = ctx.canvas.height;
    // draw the column lines
    for (var x = 0; x < width; x += minor) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.lineWidth = x % major == 0 ? 0.5 : 0.25;
        ctx.stroke();
        if (x % major == 0) {
            ctx.fillText(x, x, 10);
        }
    }
    // draw the row lines
    for (var y = 0; y < height; y += minor) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.lineWidth = y % major == 0 ? 0.5 : 0.25;
        ctx.stroke();
        if (y % major == 0) {
            ctx.fillText(y, 0, y + 10);
        }
    }
    // adding the below .restore() is restored to its original state
    ctx.restore();
}

function draw_ship(ctx, radius, options) {
    options = options || {};
    ctx.save();
    ctx.lineWidth = options.lineWidth || 2;
    ctx.strokeStyle = options.stroke || "white";
    ctx.fillStyle = options.fill || "black";
    let angle = (options.angle || 0.5 * Math.PI) / 2; // Now we have two curve arguments
    let curve1 = options.curve1 || 0.25;
    let curve2 = options.curve2 || 0.75;

    // show a fuel/rocket blast from the end of the ship
    if (options.thruster) {
        ctx.save();
        ctx.strokeStyle = "yellow";
        ctx.fillStyle = "red";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(
            (Math.cos(Math.PI + angle * 0.8) * radius) / 2,
            (Math.sin(Math.PI + angle * 0.8) * radius) / 2
        );
        ctx.quadraticCurveTo(
            -radius * 2,
            0,
            (Math.cos(Math.PI - angle * 0.8) * radius) / 2,
            (Math.sin(Math.PI - angle * 0.8) * radius) / 2
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(radius, 0);
    // here we have the three curves
    ctx.quadraticCurveTo(
        Math.cos(angle) * radius * curve2,
        Math.sin(angle) * radius * curve2,
        Math.cos(Math.PI - angle) * radius,
        Math.sin(Math.PI - angle) * radius
    );

    ctx.quadraticCurveTo(
        -radius * curve1,
        0,
        Math.cos(Math.PI + angle) * radius,
        Math.sin(Math.PI + angle) * radius
    );
    ctx.quadraticCurveTo(
        Math.cos(-angle) * radius * curve2,
        Math.sin(-angle) * radius * curve2,
        radius,
        0
    );
    ctx.fill();
    ctx.stroke();
    // the guide drawing code is getting complicated
    if (options.guide) {
        ctx.fillStyle = "white";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(-angle) * radius, Math.sin(-angle) * radius);

        ctx.lineTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);

        ctx.moveTo(-radius, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.beginPath();

        ctx.arc(
            Math.cos(angle) * radius * curve2,
            Math.sin(angle) * radius * curve2,
            radius / 40,
            0,
            2 * Math.PI
        );

        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            Math.cos(-angle) * radius * curve2,
            Math.sin(-angle) * radius * curve2,
            radius / 40,
            0,
            2 * Math.PI
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}

// tnhis function draws a basic asteroid
// the context, radius, shape (an array of random numbers), options
function draw_asteroid(ctx, radius, shape, options) {
    options = options || {};
    ctx.strokeStyle = options.stroke || "white";
    ctx.fillStyle = options.fill || "black";
    ctx.lineWidth = options.lineWidth || 1;
    if (options.noise === undefined) {
        options.noise = 0.4;
    }
    ctx.save();
    ctx.beginPath();
    // rotate the canvas, shape.length, adding a line to the path for
    // each segment.
    for (let i = 0; i < shape.length; i++) {
        ctx.rotate((2 * Math.PI) / shape.length); //rotates the current drawing.
        // Note, we want to create random shapes but still contain it in the circle for collision detctions.
        ctx.lineTo(radius + radius * options.noise * shape[i], 0); //add a new point and creates a line TO that point FROM the last specified point in the canvas (this does not draw the line yet).
    }
    // path is then closed off
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // if we want to see the circle as a guide, make sure options = true
    if (options.guide) {
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        // draw middle circle
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.stroke();
        // draw outer circle
        ctx.beginPath();
        ctx.lineWidth = 0.25;
        ctx.arc(0, 0, radius * (1 + options.noise / 2), 0, 2 * Math.PI);
        ctx.stroke();
        //draw inner circle
        ctx.beginPath();
        ctx.arc(0, 0, radius * (1 - options.noise / 2), 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}

///this function concerns itself with drawing the projectile on teh screen
function draw_projectile(ctx, radius, lifetime) {
    ctx.save();
    ctx.fillStyle = "rgb(100%, 100%, " + 100 * lifetime + "%)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function draw_line(ctx, obj1, obj2) {
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(obj1.x, obj1.y);
    ctx.lineTo(obj2.x, obj2.y);
    ctx.stroke();
    ctx.restore();
}
