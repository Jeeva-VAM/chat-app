import { useState } from "react";
import Navbar from "../components/Navbar";
import Suggestions from "../components/suggestions";
import SuggestionsRow from "../components/SuggestionsRow";

function DashboardPage() {
  
  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-content">
        <h1>Welcome {user.name} </h1>
        <p>Select a chat to start messaging</p>
        <div>
          <SuggestionsRow/>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
