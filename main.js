process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const needle = require("needle");
const gmusic = new (require("playmusic"));
const util = require('util');
const moment = require('moment');
const fs = require('fs');
const config = require("./config.json");
const mkdirp = require('mkdirp');

() => {
  gmusic.init({email: config.email, password: config.password}, function(err) {
    if(err) {
      console.error(err);
      return;
    }

    console.log("Polling playlist");
    gmusic.getPlayListEntries((err, data) => {
        var songs = data.data.items.filter(entry => entry.playlistId == config.playlist_cid).sort((a, b) => a.absolutePosition - b.absolutePosition);

        var lastSong = songs[songs.length - 1];
        var supposedToBeLast = songs.findIndex(entry => entry.track && entry.track.title == config.last_song_title); // All of the lights CID //
        var firstSong = songs[0];

        if (supposedToBeLast == -1) {
          console.log("Cannot find last song. Was it deleted?");
          clearInterval(id);
          return;
        }

        if (supposedToBeLast == songs.length - 1) {
          // nothing to update //
          console.log("Nothing to update");
          return;
        }

        var songsToMove = songs.slice(supposedToBeLast + 1);

        // Take a snapshot of the playlist order //
        console.log("Saving current playlist snapshot to: './snapshots/" + moment().format("MMM_do_YY_hh_mm_ss") + ".json'")
        mkdirp.sync("./snapshots");
        fs.writeFileSync('./snapshots/' + moment().format("MMM_do_YY_hh_mm_ss") + '.json', JSON.stringify(songs, null, 2), 'utf-8');

        songsToMove.forEach(function(songToMove) {
          console.log("Moving: " + (songToMove.track ? songToMove.track.title : "Non-Google Music song"));
          gmusic.movePlayListEntryBefore(songToMove, firstSong.clientId, function(err, result){
            if (err) console.log("ERROR:" + err);
            console.log(result);
          });
        });
    });

  });
}();
