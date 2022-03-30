import React, { useState } from "react";
import { TextField, Button, Grid, Typography } from "@material-ui/core";
import { Link, useNavigate } from "react-router-dom";

const RoomJoinPage = () => {
  const navigate = useNavigate();

  const [joinRoom, setJoinRoom] = useState({
    roomCode: "",
    error: false,
    errorMessage: "",
  });

  const handleTextFieldChange = (e) => {
    setJoinRoom({
      ...joinRoom,
      roomCode: e.target.value,
    });
  };

  const roomButtonPressed = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: joinRoom.roomCode,
      }),
    };
    try {
      let data = await fetch("/api/join-room", requestOptions);
      let response = await data.json();

      // Check if room exists, by looking on the response status data.status === 200 or data.ok
      if (data.ok) {
        navigate(`/room/${joinRoom.roomCode}`);
      } else {
        setJoinRoom({
          ...joinRoom,
          errorMessage: "Room not found.",
          error: true,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <Typography variant="h4" component="h4">
          Join a Room
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <TextField
          error={joinRoom.error}
          label="Code"
          placeholder="Enter a Room Code"
          value={joinRoom.roomCode}
          helperText={joinRoom.errorMessage}
          variant="outlined"
          onChange={handleTextFieldChange}
        />
      </Grid>
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="secondary"
          onClick={roomButtonPressed}
        >
          Enter Room
        </Button>
      </Grid>
      <Grid item xs={12} align="center">
        <Button variant="contained" color="primary" to="/" component={Link}>
          Back
        </Button>
      </Grid>
    </Grid>
  );
};

export default RoomJoinPage;
