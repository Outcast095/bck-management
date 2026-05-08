import express from 'express';

const app = express();
const PORT = 5001;      


app.get('/', (req, res) => {})

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})