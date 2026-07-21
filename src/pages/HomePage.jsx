import { Link } from "react-router-dom"

import "./HomePage.css"

function HomePage() {
    return (
        <>
            <h1>Home page</h1>
            <h3>Hello {localStorage.getItem("data")}</h3>

            <Link to="/login">Go To DashBoard</Link>

        </>
    )
}

export default HomePage