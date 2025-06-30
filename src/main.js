import * as game_exports from "./game";
Object.assign(globalThis, game_exports);

import * as ui_exports from "./ui"
Object.assign(globalThis, ui_exports);

let current_level = 0;
let last_menu = "main";

//---------------------------------------------
// mouse move event
//---------------------------------------------

const level_settings = [
    
    { // level daisy
        ball_time: 1000,
        ball_chance: 0,
        star_time: 50,
        star_chance: 0.5
    },

    { // level 1
        ball_time: 200,
        ball_chance: 0.4,
        ball_chance_big: 0,
        star_time: 500,
        star_chance: 0.6
    },

    { // level 2
        ball_time: 100,
        ball_chance: 0.7,
        ball_chance_big: 0.003,
        star_time: 200,
        star_chance: 0.4
    },

    { // level 3
        ball_time: 50,
        ball_chance: 0.7,
        ball_chance_big: 0.004,
        star_time: 200,
        star_chance: 0.5
    },

    { // level 4
        ball_time: 50,
        ball_chance: 0.9,
        ball_chance_big: 0.005,
        star_time: 200,
        star_chance: 0.5
    },

    { // level 5
        ball_time: 25,
        ball_chance: 0.9,
        ball_chance_big: 0.05,
        star_time: 100,
        star_chance: 0.7
    },
]

//---------------------------------------------
// pointer lock events
//---------------------------------------------

function start_pointerlock() {
    // request pointer lock
    console.log("requesting pointer lock");
    game_canvas().requestPointerLock();
}

document.addEventListener("pointerlockerror", e => {
    console.error("error acquiring pointer lock:", e);
});

document.addEventListener("pointerlockchange", e => {

    console.log(document.pointerLockElement);

    // pointer lock get!
    if (document.pointerLockElement == game_canvas()) {
        console.debug("got pointer lock");
        game_start();
    }
    else {
        // lost pointer lock so pause game
        console.debug("lost pointer lock");
        ext_game_pause();
    }

})



//---------------------------------------------
// mouse move event
//---------------------------------------------

document.addEventListener("mousemove", e => {
    game_move_friend(e.movementX, e.movementY);
});



//---------------------------------------------
// key press event
//---------------------------------------------

let esc_break = false;

document.addEventListener("keydown", e=> {
    // console.log(e.key);
    switch (e.key) {

        case "b":
            game_make_ball();
            break;

        case "g":
            game_make_green_balls();
            break;

        case "r":
            ext_game_resume();
            break;
        
        case "Escape":
            console.log("esc")
            // pause the game as soon as esc is pressed
            ext_game_pause();
            break;
    }
});

// note!!!  the functions for pausing + resuming are called by BOTH
// (keydown, keyup) and the pointerlock handler.  it seems that
// key events for Escape just aren't fired when pointerlock stuff
// happens, so the functions are called redundantly, with the expectation
// that if pointer is locked, then the key events won't actually run.
// this might become a problem if this behaviour changes...

document.addEventListener("keyup", e => {
    switch(e.key) {

        case "Escape":
            console.log("ESC")
            // only unpause the game once esc has been released
            // (to prevent the pointerlock releasing immediately after the game unpauses)
            ext_game_resume();
            // it seems that when unpausing, the pointer lock fails if the canvas is not in focus
            // so if you navigate to another tab, you have to click to resume, you can't just press
            // escape.  :(  thx javascript

    }
});



//---------------------------------------------
// window resize event
//---------------------------------------------

window.addEventListener("resize", e => {
    game_resize();
});


//---------------------------------------------
// functions for the ui to control the game
//---------------------------------------------

window.ext_game_load = (level) => {
    current_level = level;                      // store current level
    game_default_settings();                    // restore all settings to default
    game_set_settings(level_settings[level]);   // set level-specific settings
    ext_game_resume();                          // start game!
}

let ext_game_pause = () => {
    if (!game_is_paused()) {
        game_pause(true);       // pause the game engine
        console.log("aaaaaaa")
        document.exitPointerLock();
        
        // if game is still active, then its paused
        if (game_is_active()) {
            switch_menu("pause");   // show the pause menu
        }
        // otherwise assume it's game over
        else {
            setTimeout(() => {

                // todo: record scores here!

                if (!game_is_active()) // if game is still not active
                switch_menu("end");   // show the game over menu

            }, 1500);
        }
    }
}

window.ext_game_resume = () => {
    console.log("paused", game_exports.game_is_paused())
    if (game_is_paused() || !game_is_active()) {
        switch_menu();        // hide menu
        start_pointerlock();  // (re)start game
    }
}

window.ext_game_quit = () => {
    game_end();          // end game
    switch_menu("main"); // return to main menu
}

window.ext_game_start_custom = () => {

    // set level
    current_level = -1;

    // set custom settings
    let new_settings = {};

    // for each setting value
    Object.keys(game_get_settings()).forEach(name => {

        // get element for this setting
        let el = document.getElementById(name);

        console.log(el)

        // if element exists
        if (el) {

            console.log("\t", el.value);
            console.log("\t", parseFloat(el.value));

            // get value
            new_settings[name] = parseFloat(el.value);

        }

    });

    game_set_settings(new_settings);

    // start game!
    ext_game_resume();

}

window.ext_clear_data = () => {
    localStorage.clear();
    load_scores();
}

window.ext_custom_preload = (lvl) => {

    console.log("setting custom mode fields");

    // populate with default values
    // for each setting value
    Object.keys(game_get_settings()).forEach(name => {

        // get element for this setting
        let el = document.getElementById(name);

        // if element exists
        if (el) {
            el.value = game_get_default_settings()[name];
        }

        // if level is from 1 to 5
        if (1 <= lvl && lvl <= 5) {

            // if this level's settings obj has this setting
            if (Object.keys(level_settings[lvl]).includes(name)) {

                // overwrite the value in the form
                el.value = level_settings[lvl][name];

            }

        }

    });

}

//---------------------------------------------
// high score handling
//---------------------------------------------

function update_score(level, time, stars) {

    // time
    let current_time = parseInt(localStorage.getItem(`time-${level}`)) || 0;
    if (time > current_time) {
        document.getElementById("new-record-time").style.display = "block";
        localStorage.setItem(`time-${level}`, time);
    } else document.getElementById("new-record-time").style.display = "none";

    // stars
    let current_stars = parseInt(localStorage.getItem(`stars-${level}`)) || 0;
    if (stars > current_stars) {
        document.getElementById("new-record-stars").style.display = "block";
        localStorage.setItem(`stars-${level}`, stars);
    }
    else document.getElementById("new-record-stars").style.display = "none";

}

function load_scores() {
    for (let i = 1; i < 6; i++) {

        // get score
        let el_score = document.getElementById(`score-time-lvl-${i}`);
        let score = localStorage.getItem(`time-${i}`);
        if (score == null) el_score.innerText = "--";
        else {
            let seconds = ((score % 60000) / 1000);
            let mins = Math.floor(score / 60000);
            
            el_score.innerText = (mins > 0 ? mins.toString() + ":" : "") + 
            Math.floor(seconds).toString().padStart(2, "0") + "." + 
            Math.floor((seconds - Math.floor(seconds)) * 100).toString().padStart(2, "0");
        }


        // get stars
        let el_stars = document.getElementById(`score-stars-lvl-${i}`);
        let stars = localStorage.getItem(`stars-${i}`);
        if (stars == null) el_stars.innerText = "--";
        else el_stars.innerText = stars;

    }
}

function updateText(el_id){

    let delay = 80;
    
        let h1 = document.getElementById(el_id);
    
          h1.innerHTML = h1.innerText
            .split("")
            .map(letter => {
              return `<span>` + letter + `</span>`;
            })
            .join("");
    
          Array.from(h1.children).forEach((span, index) => {
            span.classList.add("wavy");
            span.style.animationDelay = `${index * delay}ms`
          });
    
    }


//---------------------------------------------
// game event listeners
//---------------------------------------------

game_add_event_listener("gameend", () => {

    // save score
    update_score(current_level, game_get_timer(), game_get_stars());
    load_scores();
})


//---------------------------------------------
// start game
//---------------------------------------------
updateText("new-record-time");
updateText("new-record-stars");
game_setup();
setTimeout(() => {
    load_scores();
    switch_menu("main");
}, 400);