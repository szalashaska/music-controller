import React from "react";
import {
  Grid,
  Card,
  Typography,
  IconButton,
  LinearProgress,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import PauseIcon from "@material-ui/icons/Pause";

const MusicPlayer = ({ song }) => {
  const songProgress = (song.time / song.duration) * 100;

  const pauseSong = () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    // We are using put method so we do not care about error
    fetch("/spotify/pause", requestOptions);
  };

  const playSong = () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    // We are using put method so we do not care about error
    fetch("/spotify/play", requestOptions);
  };

  const skipSong = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    // We are using put method so we do not care about error
    fetch("/spotify/skip", requestOptions);
  };

  return (
    <Card>
      <Grid container alignItems="center">
        <Grid item align="center" xs={4}>
          <img src={song.image_url} height="100%" width="100%" />
        </Grid>
        <Grid item align="center" xs={8}>
          <Typography component="h5" variant="h5">
            {song.title}
          </Typography>
          <Typography color="textSecondary" varaint="subtitle1">
            {song.artist}
          </Typography>
          <div>
            <IconButton
              onClick={() => {
                song.is_playing ? pauseSong() : playSong();
              }}
            >
              {song.is_playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={skipSong}>
              <SkipNextIcon />
              <Typography component="h6" variant="h6">
                {song.votes} / {song.votes_required}
              </Typography>
            </IconButton>
          </div>
        </Grid>
      </Grid>
      <LinearProgress variant="determinate" value={songProgress} />
    </Card>
  );
};

export default MusicPlayer;
