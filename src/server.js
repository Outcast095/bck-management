import express from 'express';

const app = express();
const PORT = 5001;      


app.get('/', (req, res) => {
    res.json({message: "Hello world"});
});



const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})