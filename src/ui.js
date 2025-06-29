const dim = document.getElementById("dim");
let current_menu = undefined;

export function switch_menu(new_menu=undefined) {

    console.log("showing menu " + new_menu);

    function show_new_menu(e) {

        console.log("start showing menu " + new_menu)
        console.log(e);

        let el_new_menu = document.getElementById("menu-" + new_menu);

        // if this is an event listener, check if the event was fired on
        // the menu and not a child
        if (e && e.target != current_menu) {
            console.log("event fired on " + e.target + " so ignoring")
            return;
        }

        // finally hide old menu (if visible)
        if (current_menu != undefined) {
            current_menu.style.display = "none";
        }

        // if this function is being used as an event listener, deregister it
        if (current_menu != undefined && e) {
            current_menu.removeEventListener("transitionend", show_new_menu);
        }

        // show new menu
        el_new_menu.style.display = "block";
        document.body.offsetHeight; // HACK!!! https://stackoverflow.com/a/64001548
        el_new_menu.style.opacity = 1;
        current_menu = el_new_menu;

        // make sure the dim layer is show
        dim.style.opacity = 1;
    }

    // if there is currently a menu on screen, hide that one
    // then show the new menu once the fade transition has ended
    if (current_menu != undefined) {

        console.log("hiding current menu")

        current_menu.style.opacity = 0;
        if (!!new_menu) current_menu.addEventListener("transitionend", show_new_menu);
    }

    // if no menu is currently open, just show the new one immediately
    else {
        if (new_menu) show_new_menu();
    }

    // if no new menu is provided, hide the dim layer
    if (!new_menu) {
        dim.style.opacity = 0;
        if (current_menu) current_menu.style.display = "none";
        current_menu = undefined;
    }

}
window.switch_menu = switch_menu;