import React from "react";
import { Grid, Button } from "@material-ui/core";

const SettingsButton = ({ showSettingsCallback }) => {
  return (
    <Grid item xs={12} align="center">
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          showSettingsCallback(true);
        }}
      >
        Settings
      </Button>
    </Grid>
  );
};

export default SettingsButton;
