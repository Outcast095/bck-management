import express from 'express';

// Import Routes
import movieRoutes from "./routes/movieRoutes.js";


const app = express();
const PORT = 5001;      


// API Routes
app.use("/movies", movieRoutes);



const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})