import { useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css"

function AdminDashboard() {

    const [userName, setUserName] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        if (userName) {
            localStorage.setItem("data", userName);
        }
        setUserName("");
    }
    return (
        <>

            <h1>Admin Dashboard</h1>

            <form onSubmit={handleSubmit}>
                <label> Please enter your name <input name="Name" onChange={(e) => setUserName(e.target.value)} type="text" value={userName} /></label>

                <button type="submit">submit</button>
            </form>

            <Link to="/">Go to Home Page</Link>



        </>
    )
}

export default AdminDashboard