import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { Grid, Button, ButtonGroup, Typography } from "@material-ui/core";

import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";
import Info from "./Info";

const Homepage = () => {
  const [roomCode, setRoomCode] = useState({
    code: null,
  });

  // Async check if room exist, dependecny array used
  useEffect(() => {
    const fetchData = async () => {
      try {
        let request = await fetch("/api/user-in-room");
        let data = await request.json();
        setRoomCode({ code: data.code });
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const clearRoomCode = () => {
    setRoomCode({
      code: null,
    });
  };

  // Render Header function, just to show how to do it without component in another file
  const renderHomePage = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} align="center">
          <Typography variant="h3" compact="h3">
            House Party
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <ButtonGroup disableElevation variant="contained" color="primary">
            <Button color="primary" to="/join" component={Link}>
              Join a Room
            </Button>
            <Button color="default" to="/info" component={Link}>
              Info
            </Button>
            <Button color="secondary" to="/create" component={Link}>
              Create a Room
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    );
  };

  // Nice tenary operator in path="/"
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            roomCode.code ? (
              <Navigate to={`/room/${roomCode.code}`} />
            ) : (
              renderHomePage()
            )
          }
        />
        <Route path="/join" element={<RoomJoinPage />} />
        <Route path="/info" element={<Info />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route
          path="/room/:roomCode"
          element={<Room leaveRoomCallback={clearRoomCode} />}
        />
      </Routes>
    </Router>
  );
};

export default Homepage;
