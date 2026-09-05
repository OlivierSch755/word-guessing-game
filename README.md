This is the original code I submitted for a Game Jam organized with friends as a challenge in early 2024.


Rules were as follow: 
* 48h total dev time
* Must be playable on a mobile phone
* Must be multiplayer but serverless

So I did a port of So Clover! which is a board game where players are expected to use words associations to guess the correct position and rotation of 4 tiles containing 4 words (+ a random intruder).

https://github.com/user-attachments/assets/8c9f93f1-c204-4e08-a444-b24a744e2c29


50% of the dev time has been dedicated to building my own dictionary of words and tiles by using a small custom Node.js program, sqlite3 and the French [lexique383 database](http://www.lexique.org/databases/Lexique383/). Which was very inefficient but using the ones from the original boardgame felt like stealing, so I'd make the same decision today.

At least 40% was dedicated to the main UI problem : manipulating and rotating tiles while keeping words readable. 

The last 10% of dev time was spent in a hurry trying to encode a game state over a base64 string that can be shared over SMS (that is the whole multiplayer thing).


As this is the original code it has many issues:
* The home page where I planned to write the rules of the game has not been written.
* Most special characters will be rejected for player 1.
* Also the dictionary of tiles, in addition to having been crafted in a tiny amount of time (= is not great) has not been completely sanitized. So one should expect to find an occasional swear-word.

I'll also have to make some tiny modifications to make it fit in a Github page. 

I plan to continue the project on another branch some day. 
