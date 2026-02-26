import { useState } from "react";
import Navbar from "../components/Navbar";
import Suggestions from "../components/suggestions";
import SuggestionsRow from "../components/SuggestionsRow";
import user from '../data/users.json'
import '../styles/dashboard.css'
function DashboardPage() {
  const userDetail = localStorage.getItem("user");
  const userDetails = JSON.parse(userDetail);
  console.log(userDetails)
  return (
    <div className="dashboard">

      <div className="dashboard-content">
        <h1>Welcome {userDetails.name} </h1>
        <p>Select a chat to start messaging</p>
        <div>
          <SuggestionsRow/>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
