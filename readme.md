# Dodge The Spiked Balls

<img alt="sprite of the ufo friend from the game" src="./public/assets/friend.gif" align="right">

Hello!  This is a web-based clone of the minigame *Dodge The Spiked Balls* from the video game [*Nintendo Switch 2 Welcome Tour*](https://en.wikipedia.org/wiki/Nintendo_Switch_2_Welcome_Tour).  While much effort was spent trying to replicate the original game, this clone isn't designed to be 100% identical and takes lots of creative liberties.  Nonetheless, I hope that it's fun to play!

I decided to make this when I had some time off, and I wanted to do a short project that would be within my ability.  The game is web-based so that it can run on multiple platforms without modification (and it doesn't really need the performance afforded by native game engines).  I ended up using PixiJS for the first time, which was a fun learning experience!

A live build of the game is available at [dodgeball.atctwo.net](https://dodgeball.atctwo.net/).

# Building
First, make sure `npm` and `node` are installed.  Install the dependencies by running `npm install` in the root of this repo.

To run the game locally, run `npm run start`; the game will be running at [`localhost:8000`](http://localhost:8000).

To build the game for production run `npm run build`.

# Credits
- Created using <a href="https://pixijs.com/">PixiJS</a>
- Circular collision detection method from <a href="https://www.jeffreythompson.org/collision-detection/circle-circle.php">Jeffrey Thompson</a>
- Performance monitoring performed using <a href="https://github.com/Prozi/pixi-stats">pixi-stats</a>
- Explosion sound effect by <a href="https://pixabay.com/users/soundreality-31074404/?utm_source=link-attribution&utm_medium=referral&utm_campaign=mutm_content=343683">Jurij</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=343683">Pixabay</a></li>
- Star sound effect by <a href="https://pixabay.com/users/benkirb-8692052/?utm_source=link-attribution&utm_medium=referral&utm_campaign=mutm_content=268901">Benjamin Adams</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=268901">Pixabay</a></li>
