import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Grid,
  Typography,
  TextField,
  FormHelperText,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Collapse,
} from "@material-ui/core";

import Alert from "@material-ui/lab/Alert"; // Only package we neeed, so without {}

const CreateRoomPage = ({
  update,
  guestCanPause,
  votesToSkip,
  roomCode,
  updateCallback,
}) => {
  const navigate = useNavigate();

  // State variables are either default(Create Room) or passed as props (Update Room)
  const [roomSettings, setRoomSettings] = useState({
    guestCanPause: guestCanPause,
    votesToSkip: votesToSkip,
  });

  // Message to show after update
  const [updateMsg, setUpdateMsg] = useState({
    message: "",
    showMessage: false,
    error: false,
  });

  const handleVotesChange = (e) => {
    setRoomSettings({
      ...roomSettings,
      votesToSkip: e.target.value,
    });
  };

  const handleGuestCanPauseChange = (e) => {
    setRoomSettings({
      ...roomSettings,
      guestCanPause: e.target.value === "true" ? true : false,
    });
  };

  const handleRoomButtonPressed = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: roomSettings.votesToSkip,
        guest_can_pause: roomSettings.guestCanPause,
      }),
    };

    try {
      let data = await fetch("/api/create-room", requestOptions);
      let response = await data.json();
      navigate(`/room/${response.code}`);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdateButtonPressed = async () => {
    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: roomSettings.votesToSkip,
        guest_can_pause: roomSettings.guestCanPause,
        code: roomCode,
      }),
    };

    try {
      let data = await fetch("/api/update-room", requestOptions);
      let response = await data.json();

      if (data.ok) {
        setUpdateMsg({
          ...updateMsg,
          message: "Room updated successfully!",
          showMessage: true,
        });
      } else {
        setUpdateMsg({
          ...updateMsg,
          message: "Error updating room...",
          showMessage: true,
          error: true,
        });
      }
      updateCallback();
    } catch (err) {
      console.log(err);
    }
  };

  // We check props value "update", not roomSettings.update
  const title = update ? "Update Room" : "Create a Room";

  const renderCreateButtons = () => {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Button
            color="primary"
            variant="contained"
            onClick={handleRoomButtonPressed}
          >
            Create A Room
          </Button>
        </Grid>
        <Grid item xs={12} align="center">
          <Button color="secondary" variant="contained" to="/" component={Link}>
            Back
          </Button>
        </Grid>
      </Grid>
    );
  };

  const renderUpdateButtons = () => {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Button
            color="primary"
            variant="contained"
            onClick={handleUpdateButtonPressed}
          >
            Update Room
          </Button>
        </Grid>
      </Grid>
    );
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <Collapse in={updateMsg.showMessage}>
          <Alert
            severity={updateMsg.error ? "error" : "success"}
            onClose={() => {
              setUpdateMsg({ ...updateMsg, showMessage: false });
            }}
          >
            {updateMsg.message}
          </Alert>
        </Collapse>
      </Grid>
      <Grid item xs={12} align="center">
        <Typography component="h4" variant="h4">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <FormControl component="fieldset">
          <FormHelperText component="div">
            <div align="center">Guest Control of Playback State</div>
          </FormHelperText>
          <RadioGroup
            row
            defaultValue={guestCanPause.toString()}
            onChange={handleGuestCanPauseChange}
          >
            <FormControlLabel
              value="true"
              control={<Radio color="primary" />}
              label="Play/Pause"
              labelPlacement="bottom"
            />
            <FormControlLabel
              value="false"
              control={<Radio color="secondary" />}
              label="No Control"
              labelPlacement="bottom"
            />
          </RadioGroup>
        </FormControl>
        <Grid item xs={12} align="center">
          <FormControl>
            <TextField
              required={true}
              type="number"
              defaultValue={roomSettings.votesToSkip}
              inputProps={{ min: 1, style: { textAlign: "center" } }}
              onChange={handleVotesChange}
            />
            <FormHelperText component="div">
              <div align="center">Votes required to skip song</div>
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      {update ? renderUpdateButtons() : renderCreateButtons()}
    </Grid>
  );
};

// Define default props, when no props are passed (Create Page case)
CreateRoomPage.defaultProps = {
  guestCanPause: true,
  votesToSkip: 2,
  roomCode: null,
  update: false,
  updateCallback: null,
};

export default CreateRoomPage;
