import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button, Typography } from "@material-ui/core";

import SettingsButton from "./SettingsButton";
import Settings from "./Settings";
import MusicPlayer from "./MusicPlayer";

const Room = ({ leaveRoomCallback }) => {
  // useParams lets us get parameters from URL
  const params = useParams();
  const navigate = useNavigate();

  const [roomState, setRoomState] = useState({
    votesToSkip: 2,
    guestCanPause: false,
    isHost: false,
    showSettings: false,
  });

  const [songState, setSongState] = useState({
    song: null,
  });

  const [authState, setAuthState] = useState({
    spotifyAuthenticated: false,
  });

  // Get the room code from URL
  const roomCode = params.roomCode;

  // Assign room details, second argument of function is a dependency array, prevents the continuous loop

  useEffect(() => {
    const authenticateSpotify = async () => {
      try {
        const response = await fetch("/spotify/is-authenticated");
        const data = await response.json();
        // Redirect user to login page, if not authenticated
        if (!data.status) {
          try {
            const response = await fetch("/spotify/get-auth-url");
            const data = await response.json();

            // Native JavaScript method to redirect to url
            window.location.replace(data.url);
          } catch (err) {
            console.log(err);
          }
          // Set users status as authenticated
        } else {
          setAuthState({
            ...authState,
            spotifyAuthenticated: data.status,
          });
        }
      } catch (err) {
        console.log(err);
      }
    };

    const getRoomDetails = async () => {
      try {
        const response = await fetch(`/api/get-room?code=${roomCode}`);
        const data = await response.json();
        if (!response.ok) {
          // Clear room code and redirect back to homepage, inform user about error
          console.log(data);
          leaveRoomCallback();
          navigate("/");
          return;
        }

        setRoomState({
          ...roomState,
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });

        // Authenticate user, but only if he is a host of the room
        if (data.is_host) {
          authenticateSpotify();
        }
        // 404 is error, that won't be catched by catch.
      } catch (err) {
        console.log(err);
      }
    };

    getRoomDetails();
  }, []);

  // In useEffect using return statement is similar to ComponentWillUnmount method

  useEffect(() => {
    const interval = setInterval(() => {
      // Wait for songs information
      const getCurrentSong = async () => {
        try {
          const response = await fetch("/spotify/current-song");

          // If we did not get correct response return empty object
          if (response.status === 204) {
            setSongState({
              song: null,
            });
            return;
          }
          const data = await response.json();

          // Update state
          setSongState({
            song: data,
          });
        } catch (err) {
          console.log(err);
        }
      };
      getCurrentSong();
    }, 1500);

    // Clear interval when finished
    return () => {
      clearInterval(interval);
    };
  }, []);

  const leaveButtonPressed = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    let data = await fetch("/api/leave-room", requestOptions);
    let response = await data.json();
    console.log(response);
    // Clear room code and redirect back to homepage
    leaveRoomCallback();
    navigate("/");
  };

  const updateShowSettings = (value) => {
    setRoomState({
      ...roomState,
      showSettings: value,
    });
  };

  const updateModifiedRoom = async () => {
    try {
      const response = await fetch(`/api/get-room?code=${roomCode}`);
      if (!response.ok) {
        // Clear room code and redirect back to homepage, inform user about error
        console.log(data);
        leaveRoomCallback();
        navigate("/");
        return;
      }
      const data = await response.json();
      //  If room does not exists return to homepage
      setRoomState({
        ...roomState,
        votesToSkip: data.votes_to_skip,
        guestCanPause: data.guest_can_pause,
        isHost: data.is_host,
      });
      // 404 is error, that won't be catched by catch.
    } catch (err) {
      console.log(err);
    }
  };

  if (roomState.showSettings) {
    return (
      <Settings
        showSettingsCallback={updateShowSettings}
        updateModifiedRoom={updateModifiedRoom}
        roomState={roomState}
        roomCode={roomCode}
      />
    );
  }
  return (
    <Grid container spacing={1} align="center">
      <Grid item xs={12}>
        <Typography variant="h4" component="h4">
          Code: {roomCode}
        </Typography>
      </Grid>
      <div className="center">
        {songState.song ? (
          <MusicPlayer song={songState.song} />
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" component="h6">
              No music is currently playing
            </Typography>
          </Grid>
        )}
      </div>

      {/* Settings Button, only when you are the host of the room */}
      {roomState.isHost ? (
        <SettingsButton showSettingsCallback={updateShowSettings} />
      ) : null}
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="secondary"
          onClick={leaveButtonPressed}
        >
          Leave Room
        </Button>
      </Grid>
      {/*
      <Grid item xs={12}>
        <h2> Debug info: </h2>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">
          Votes: {roomState.votesToSkip}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">
          Guest can pause: {roomState.guestCanPause.toString()}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">
          Host: {roomState.isHost.toString()}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" component="h6">
          Spotify authenticated: {authState.spotifyAuthenticated.toString()}
        </Typography>
      </Grid>
    */}
    </Grid>
  );
};

export default Room;
