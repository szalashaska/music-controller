import React from "react";

import CreateRoomPage from "./CreateRoomPage";
import { Grid, Button } from "@material-ui/core";

const Settings = ({
  showSettingsCallback,
  updateModifiedRoom,
  roomState,
  roomCode,
}) => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <CreateRoomPage
          update={true}
          votesToSkip={roomState.votesToSkip}
          guestCanPause={roomState.guestCanPause}
          roomCode={roomCode}
          updateCallback={updateModifiedRoom}
        />
      </Grid>
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            showSettingsCallback(false);
          }}
        >
          Close
        </Button>
      </Grid>
    </Grid>
  );
};

export default Settings;
