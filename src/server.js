import app from './app';

const port = process.env.PORT || 7777;

app.listen(port, () => console.log(`Listening on port: ${port}`));
