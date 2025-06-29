import { Application, Assets, Sprite, Particle, ParticleContainer, Texture, Graphics, FillGradient } from "pixi.js";
import { GifSprite } from "pixi.js/gif";
import { sound, Sound } from "@pixi/sound";
import { Stats } from "pixi-stats";

let pixi_container = document.getElementById("pixi-container");
let scoreTimer = document.getElementById("score-timer");
let scoreStars = document.getElementById("score-stars");
let scoreTimerValue = document.getElementById("score-timer-value");
let scoreStarsValue = document.getElementById("score-stars-value");
let debugInfo = document.getElementById("debug-info");

let app;                    // game application
let evt_handlers = {   // registered event listeners
    "gamestart": [],
    "gameend": []
};

let game_active = false;    // flag to indicate a game is being played
let game_paused = false;    // flag to indicate a game is paused
let game_loaded = false;    // flag to store game load state

let current_level = 0;
let game_timer = 0;         // how long the current game has been going on for (in ms)
let game_stars = 0;
let last_ball_time = 0;     // time since last ball
let last_star_time = 0;     // time since last ball

let tex_friend;             // texture for friend
let tex_ball;               // texture for ball
let tex_star;               // texture for stars
let tex_explosion;          // texture for explosion
let tex_particle;           // texture for the trail left behind

let snd_explosion;          // explosion sound
let snd_star;               // star sound

let background_gradient;    // gradient for the background
let obj_background;         // object for the background gradient

let obj_friend;             // object to store friend
let objs_balls = [];        // array to hold Existing Balls

let obj_friend_particles;   // container for friend particles
let obj_friend_particles2 = []; // array of friend particles

// gameplay settings
let ball_threshold = 50;                // amount of time between balls chances
let ball_chance = 0.7;                  // chance of a ball spawning
let ball_chance_big = 0.003;            // chance a ball will be a big ball
let star_threshold = 200;               // amount of time between stars chances
let star_chance = 0.5;                  // chance of a star spawning
let ball_init_velocity_scale = 2;     // multiplier for starting velocity
let ball_accel_x = 0.005;               // x-axis acceleration for balls
let ball_accel_y = 0.1;                // y-axis acceleration for balls
let ball_accel_accel_x = 0;
let ball_accel_accel_y = 7.5e-7;

// controls settings
// let mouse_sensitivity = 1.7; // firefox
let mouse_sensitivity = 1.0; // chrome

let trail_alpha_decay = 0.05;
let trail_scale_decay = 0.03;

//---------------------------------------------
// helper funcs
//---------------------------------------------

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function game_canvas() {
    return app.canvas;
}

export function game_is_paused() {
    return game_paused;
}
export function game_is_active() {
    return game_active;
}

export function game_set_level(lvl) {
    current_level = lvl;
}

export function game_get_timer() {
    return game_timer;
}

export function game_get_stars() {
    return game_stars;
}

export function game_add_event_listener(evt, handler) {
    if (evt == "gamestart") {
        evt_handlers.gamestart.push(handler);
    }
    if (evt == "gameend") {
        evt_handlers.gameend.push(handler);
    }
}

function game_redraw_background() {
    background_gradient = new FillGradient({
        type: "linear",
        colorStops: [
            { offset: 0, color: "#4B0D91" },
            { offset: 1, color: "#61139C" },
        ]
    });
    obj_background = new Graphics()
        .rect(0, 0, app.screen.width, app.screen.height)
        .fill(background_gradient);
    app.stage.addChild(obj_background);
}

//---------------------------------------------
// game running functions
//---------------------------------------------

export function game_resize() {
    // game_redraw_background();
    console.log("im an idiot");
}

export function game_pause(state=undefined) {

    if (game_active) {

        // if no state is provided, toggle state
        if (state == undefined) state = !game_paused;

        if (state) {
            // if pausing game, exit pointer lock
            console.log("pausing game");
            game_paused = true;
        }
        else {
            // if unpausing game, restart gameplay properly
            console.log("unpausing game");
            game_paused = false;
        }

    }
    else console.log("cant pause, game isnt active")

}

export function game_start() {

    if (game_active) console.log("restarting game...");
    else             console.log("starting game...");

    // no game active, so reset play state
    if (!game_active) {
        
        // clear balls
        objs_balls.forEach((ball, i) => {
            ball.obj.destroy();
        })
        objs_balls.splice(0, objs_balls.length);

        // reset friend position
        obj_friend.position.set(app.screen.width / 2, app.screen.height / 2);

        // reset timer
        game_timer = 0;
        game_stars = 0;
        scoreTimer.style.display = "block";
        scoreStars.style.display = "block";
        scoreStarsValue.innerText = game_stars;
        
    }
    
    // unhide friend
    obj_friend.visible = true;
    
    // set game states
    game_active = true;
    game_paused = false;

    // call event handlers
    evt_handlers.gamestart.forEach(handler => {
        handler();
    })
}

export function game_end() {

    if (!game_active) {
        console.warn("game not active!");
        return
    }

    console.log("ending game!!!");

    // release cursor
    document.exitPointerLock();

    // clear game flags
    game_active = false;
    game_paused = false;

    // call event handlers
    evt_handlers.gameend.forEach(handler => {
        handler();
    })

}


//---------------------------------------------
// game setup
//---------------------------------------------

export function game_move_friend(dx, dy) {
    if (game_active && !game_paused) {
        if (obj_friend) {

            let moved = false;
            let new_x = obj_friend.position.x + dx * mouse_sensitivity;
            let new_y = obj_friend.position.y + dy * mouse_sensitivity;

            if (((tex_friend.width/2) <= new_x && new_x <= app.screen.width - (tex_friend.width/2))) {
                obj_friend.position.x = new_x;
                moved = true;
            }
            if (((tex_friend.height/2) <= new_y && new_y <= app.screen.height - (tex_friend.height/2))) {
                obj_friend.position.y = new_y;
                moved = true;
            }

            if (moved) {
                const particle = new Particle({
                    texture: tex_particle,
                    x: new_x,
                    y: new_y,
                    anchorX: 0.5,
                    anchorY: 0.5,
                    alpha: 0.8
                });
                obj_friend_particles.addParticle(particle);
                obj_friend_particles2.push({
                    particle
                });
            }
        }
    }
}

export function game_make_ball(type) {

    if (!game_loaded) {
        console.warn("can't!  games not loaded");
        return
    }

    // console.debug("making ball");

    // create a sprite
    let obj_ball;
    switch(type) {
        default:
        case "ball":
        case "big":
            obj_ball = new GifSprite(tex_ball);
            break;

        case "star":
            obj_ball = new Sprite(tex_star);
            break;
    };
    obj_ball.anchor.set(0.5);
    obj_ball.position.set(getRandomInt(0, app.screen.width), -(tex_ball.height)*3);
    
    if (type == "big") {
        obj_ball.scale.set(5);
    }

    // add movement params
    let angle = getRandomArbitrary(-0.2, 0.2);
    let velocity = [
        Math.asin(angle) * ball_init_velocity_scale,
        Math.acos(angle) * ball_init_velocity_scale,
    ]
    // console.debug(`velocity: ${velocity}, angle: ${angle}`);

    // add to world
    objs_balls.push({
        "obj": obj_ball,
        "angle": angle,
        "velocity": velocity,
        "type": type,
        "exploded": false,
    });
    app.stage.addChild(obj_ball);

}

function game_make_explosion(x, y) {

    if (!game_loaded) {
        console.warn("can't!  games not loaded");
        return
    }

    let obj_explosion = new GifSprite({
        source: tex_explosion,
        animationSpeed: 0.1,
        loop: false
    });
    obj_explosion.anchor.set(0.5);
    obj_explosion.scale = 4;
    obj_explosion.position.set(x, y);
    
    obj_explosion.onComplete = () => {
        obj_explosion.stop();
        obj_explosion.destroy();
    }
    
    app.stage.addChild(obj_explosion);
    snd_explosion.play();

}

export function game_set_settings(settings) {

    console.log("setting game parameters", settings);

    // ball time
    if (Object.keys(settings).includes("ball_time")) {
        console.log(settings.ball_time);
        ball_threshold = settings.ball_time;
    }

    // ball chance
    if (Object.keys(settings).includes("ball_chance")) {
        ball_chance = settings.ball_chance;
    }

    // ball chance
    if (Object.keys(settings).includes("ball_chance_big")) {
        ball_chance_big = settings.ball_chance_big;
    }

    // star time
    if (Object.keys(settings).includes("star_time")) {
        star_threshold = settings.star_time;
    }

    // star chance
    if (Object.keys(settings).includes("star_chance")) {
        star_chance = settings.star_chance;
    }

    // ball velocity init scale
    if (Object.keys(settings).includes("ball_init_velocity_scale")) {
        ball_init_velocity_scale = settings.ball_init_velocity_scale;
    }

    // ball acceleration x
    if (Object.keys(settings).includes("ball_accel_x")) {
        ball_accel_x = settings.ball_accel_x;
    }

    // ball acceleration y
    if (Object.keys(settings).includes("ball_accel_y")) {
        ball_accel_y = settings.ball_accel_y;
    }

    // ball acceleration x
    if (Object.keys(settings).includes("ball_accel_accel_x")) {
        ball_accel_accel_x = settings.ball_accel_accel_x;
    }

    // ball acceleration y
    if (Object.keys(settings).includes("ball_accel_accel_y")) {
        ball_accel_accel_y = settings.ball_accel_accel_y;
    }

}

export async function game_setup() {


    //---------------------------------------------
    // setup application
    //---------------------------------------------

    console.log("setting up game...");

    // Create a new application
    app = new Application();

    // Initialize the application
    await app.init({ resizeTo: window, backgroundAlpha: 0 });
    app.renderer.background.alpha = 0;

    // app.renderer.events.cursorStyles.default = "none";

    // Append the application canvas to the document body
    pixi_container.appendChild(app.canvas);

    // create stats.js
    // let obj_stats = new Stats(app);

    //---------------------------------------------
    // load assets
    //---------------------------------------------

    console.log("loading assets...");

    tex_friend = await Assets.load("/assets/friend.gif");
    tex_ball = await Assets.load("/assets/ball.gif");
    // tex_ball = await Assets.load("/assets/MKT_Icon_Bob-omb.png");
    // tex_ball.scaleX = 0.5;
    // tex_ball.scaleY = 0.5;
    tex_star = await Assets.load("/assets/star.png");
    tex_explosion = await Assets.load("/assets/explode.gif");
    tex_particle = await Assets.load("/assets/trail.png");    

    snd_explosion = Sound.from({
        url: "/assets/explosion.mp3",
        preload: true,
        volume: 2,
    });

    snd_star = Sound.from({
        url: "/assets/shine-8-268901.mp3",
        preload: true,
        volume: 6,
    });


    //---------------------------------------------
    // setup background
    //---------------------------------------------
    // game_redraw_background();

    //---------------------------------------------
    // load friend
    //---------------------------------------------

    console.log("creating friend...");

    // create sprite
    obj_friend = new GifSprite(tex_friend);
    obj_friend.anchor.set(0.5);
    obj_friend.position.set(app.screen.width / 2, app.screen.height / 2);
    
    // create container for particles
    obj_friend_particles = new ParticleContainer({
        dynamicProperties: {
            color: true
        }
    });
    
    // add to world
    app.stage.addChild(obj_friend_particles);
    app.stage.addChild(obj_friend);

    //---------------------------------------------
    // main game loop
    //---------------------------------------------

    // Listen for animate update
    app.ticker.add((time) => {

        if (game_active && !game_paused) {

            //
            // make balls
            //
            last_ball_time += time.deltaMS
            if (last_ball_time > ball_threshold) {
                if (getRandomArbitrary(0, 1) < ball_chance) {

                    // change to make a big ball
                    if (getRandomArbitrary(0, 1) < ball_chance_big)
                        game_make_ball("big");

                    // make a normal ball
                    else game_make_ball("ball");
                }
                last_ball_time = 0;
            }

            last_star_time += time.deltaMS
            if (last_star_time > star_threshold) {
                if (getRandomArbitrary(0, 1) > star_chance) {
                    game_make_ball("star");
                }
                last_star_time = 0;
            }


            //
            // get friend position
            //
            let friend_bounds = obj_friend.getBounds();

            //
            // process balls
            //
            objs_balls.forEach((ball, i) => {

                // move ball
                // ball.obj.position.x += ball.velocity[0] * Math.asin(ball.angle) * time.deltaTime;
                // ball.obj.position.y += ball.velocity[1] * Math.acos(ball.angle) * time.deltaTime;
                
                // ball.obj.position.x += ball.velocity[0] * time.deltaTime;
                // ball.obj.position.y += ball.velocity[1] * time.deltaTime;
                // ball.velocity[1] += 0.02 * time.deltaTime;
                
                // store old velocity
                let old_velocity = ball.velocity;

                // calc new velocity due to acceleration
                let accel_x = ball_accel_x + (ball_accel_accel_x * game_timer);
                let accel_y = ball_accel_y + (ball_accel_accel_y * game_timer);
                ball.velocity[0] += accel_x * time.deltaTime * Math.sign(old_velocity[0]);
                ball.velocity[1] += accel_y * time.deltaTime;

                // calc distance moved and move ball
                ball.obj.position.x += ((ball.velocity[0] + old_velocity[0]) / 2) * time.deltaTime;
                ball.obj.position.y += ((ball.velocity[1] + old_velocity[1]) / 2) * time.deltaTime;

                // rotate ball
                if (ball.type == "star") ball.obj.rotation += 0.01 * time.deltaTime;

                // collosion with friend
                let ball_bounds = ball.obj.getBounds();
                let distx = obj_friend.position.x - ball.obj.position.x;
                let disty = obj_friend.position.y - ball.obj.position.y;
                let dist = Math.sqrt(Math.pow(distx, 2) + Math.pow(disty, 2));
                let ball_r_multiplier = ball.type == "star" ? 1.2 : 1;

                if (
                    // friend_bounds.x < ball_bounds.x + ball_bounds.width &&
                    // friend_bounds.x + friend_bounds.width > ball_bounds.x &&
                    // friend_bounds.y < ball_bounds.y + ball_bounds.height &&
                    // friend_bounds.y + friend_bounds.height > ball_bounds.y
                    dist <= ((tex_ball.height*ball_r_multiplier*ball.obj.scale.y)/2) + (tex_friend.height/2)
                ) {
                    if ((ball.type == "ball" || ball.type == "big") && !ball.exploded) {
                        game_make_explosion(friend_bounds.x + friend_bounds.width / 2, friend_bounds.y + friend_bounds.height / 2);
                        ball.exploded = true;

                        // hide friend
                        obj_friend.visible = false;

                        // end game
                        game_end();
                    }

                    if (ball.type == "star") {

                        // increment score
                        game_stars += 1;
                        scoreStarsValue.innerText = game_stars;

                        // play sound
                        snd_star.play();

                        // destroy star ball
                        ball.obj.destroy();
                        objs_balls.splice(i, 1);
                        return // continue but this is foreach
                    }
                }

                // out of bounds check
                if (ball.obj.position.y > app.screen.height + 70) {
                    ball.obj.destroy();
                    objs_balls.splice(i, 1);
                }

            }); 

            // update timer
            game_timer += time.deltaMS;
            let seconds = ((game_timer % 60000) / 1000);
            let mins = Math.floor(game_timer / 60000);

            scoreTimerValue.innerText = (mins > 0 ? mins.toString() + ":" : "") + 
                Math.floor(seconds).toString().padStart(2, "0") + "." + 
                Math.floor((seconds - Math.floor(seconds)) * 100).toString().padStart(2, "0");

            debugInfo.innerHTML = `${objs_balls.length} balls<br>${obj_friend_particles2.length} friend particles`;


        } // if game is active and not paused

        //
        // process particles
        //
        obj_friend_particles2.forEach((particle, i) => {
            particle.particle.alpha -= trail_alpha_decay;
            particle.particle.scaleX -= trail_scale_decay;
            particle.particle.scaleY -= trail_scale_decay;
            if (particle.particle.alpha <= 0) {
                obj_friend_particles.removeParticle(particle.particle);
                obj_friend_particles2.splice(i, 1);
            }
        })
    });

    // game is loaded!!!
    console.log("done :p");
    game_loaded = true;

};