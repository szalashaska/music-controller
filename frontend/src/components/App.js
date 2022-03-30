import React from "react";
import { render } from "react-dom";
import Homepage from "./Homepage";

const App = () => {
  return (
    <div>
      <Homepage />
    </div>
  );
};

export default App;

const appDiv = document.getElementById("app");
render(<App />, appDiv);
