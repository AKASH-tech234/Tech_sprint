import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing, SignUp } from "./pages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
